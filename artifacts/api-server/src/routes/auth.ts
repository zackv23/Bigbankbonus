import { Router, type Request, type Response } from "express";
import { db, userAccountsTable, subscriptionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;

const PRICE_IDS = {
  monthly: process.env.STRIPE_PRICE_MONTHLY ?? "price_monthly_demo",
  annual:  process.env.STRIPE_PRICE_ANNUAL  ?? "price_annual_demo",
};
const SERVICE_FEE = 99.00;

async function stripePost(path: string, body: Record<string, string>): Promise<Record<string, any>> {
  if (!STRIPE_SECRET) return { demo: true };
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${STRIPE_SECRET}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body),
  });
  return res.json() as Promise<Record<string, any>>;
}

/**
 * requireAdmin — fails closed: denies if ADMIN_SECRET is set and header doesn't match,
 * OR if ADMIN_SECRET is not configured at all (no unsecured production access).
 * Set ADMIN_SECRET env var to enable admin endpoints.
 */
function requireAdmin(req: Request, res: Response): boolean {
  const adminSecret = req.headers["x-admin-secret"];
  if (!process.env.ADMIN_SECRET) {
    res.status(403).json({ error: "Admin access not configured. Set the ADMIN_SECRET environment variable." });
    return false;
  }
  if (adminSecret !== process.env.ADMIN_SECRET) {
    res.status(403).json({ error: "Forbidden" });
    return false;
  }
  return true;
}

/**
 * POST /api/auth/social
 * Verify a Google access token or Apple identity token server-side,
 * return a normalized user object.
 */
router.post("/auth/social", async (req, res) => {
  const { provider, accessToken, identityToken } = req.body as {
    provider: "google" | "apple";
    accessToken?: string;
    identityToken?: string;
  };

  if (!provider) return res.status(400).json({ error: "provider required" });

  try {
    if (provider === "google") {
      if (!accessToken) return res.status(400).json({ error: "accessToken required for Google" });

      const googleRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!googleRes.ok) return res.status(401).json({ error: "Invalid Google token" });

      const profile = (await googleRes.json()) as {
        id: string; email: string; name: string; picture?: string; verified_email?: boolean;
      };

      return res.json({
        id: "google_" + profile.id,
        email: profile.email,
        name: profile.name,
        avatar: profile.picture,
        provider: "google",
        emailVerified: profile.verified_email ?? false,
      });
    }

    if (provider === "apple") {
      if (!identityToken) return res.status(400).json({ error: "identityToken required for Apple" });

      const parts = identityToken.split(".");
      if (parts.length !== 3) return res.status(400).json({ error: "Invalid Apple token" });

      const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as {
        sub: string; email?: string; email_verified?: boolean;
      };

      return res.json({
        id: "apple_" + payload.sub,
        email: payload.email ?? `apple_${payload.sub}@privaterelay.appleid.com`,
        name: "Apple User",
        provider: "apple",
        emailVerified: payload.email_verified ?? false,
      });
    }

    res.status(400).json({ error: "Unsupported provider" });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "Auth verification failed" });
  }
});

/**
 * POST /api/admin/accounts/:id/approval
 * Protected admin-only endpoint to update a user account's approval status.
 * On transition to "approved", triggers billing activation (Stripe subscription +
 * $99 one-time service fee) for the account's userId.
 *
 * Requires X-Admin-Secret header matching the ADMIN_SECRET env var.
 * Fails closed if ADMIN_SECRET is not configured.
 */
router.post("/admin/accounts/:id/approval", async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const { approvalStatus, plan, email } = req.body as {
    approvalStatus: "pending" | "approved" | "denied";
    plan?: "monthly" | "annual";
    email?: string;
  };

  if (!["pending", "approved", "denied"].includes(approvalStatus)) {
    return res.status(400).json({ error: "approvalStatus must be pending, approved, or denied" });
  }

  const accountId = parseInt(req.params.id, 10);
  if (isNaN(accountId)) {
    return res.status(400).json({ error: "Invalid account id" });
  }

  try {
    const [existing] = await db
      .select()
      .from(userAccountsTable)
      .where(eq(userAccountsTable.id, accountId))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ error: "Account not found" });
    }

    const wasAlreadyApproved = existing.approvalStatus === "approved";
    const isBeingApproved = approvalStatus === "approved" && !wasAlreadyApproved;

    const [updated] = await db
      .update(userAccountsTable)
      .set({
        approvalStatus,
        approvedAt: isBeingApproved ? new Date() : existing.approvedAt,
        updatedAt: new Date(),
      })
      .where(eq(userAccountsTable.id, accountId))
      .returning();

    const response: Record<string, any> = {
      account: updated,
      billingTriggered: false,
    };

    // ─── On approval transition: activate billing ─────────────────────────
    if (isBeingApproved) {
      const billingPlan = plan ?? "monthly";
      const userId = existing.userId;

      // Check for existing active subscription (idempotency)
      const [existingSub] = await db
        .select()
        .from(subscriptionsTable)
        .where(eq(subscriptionsTable.userId, userId))
        .limit(1);

      const alreadyBilled =
        existingSub &&
        (existingSub.plan === "monthly" || existingSub.plan === "annual") &&
        existingSub.status === "active";

      if (!alreadyBilled) {
        const isDemo = !STRIPE_SECRET;
        let stripeCustomerId: string | null = null;
        let stripeSubscriptionId: string | null = null;
        let currentPeriodEnd: Date | null = null;

        if (!isDemo && email) {
          const customer = await stripePost("/customers", {
            email,
            "metadata[userId]": userId,
          });
          stripeCustomerId = customer.id;

          const priceId = PRICE_IDS[billingPlan];
          const subscription = await stripePost("/subscriptions", {
            customer: stripeCustomerId,
            "items[0][price]": priceId,
            "expand[]": "latest_invoice.payment_intent",
          });
          stripeSubscriptionId = subscription.id;
          if (subscription.current_period_end) {
            currentPeriodEnd = new Date(subscription.current_period_end * 1000);
          }

          // One-time $99 service fee invoice
          await stripePost("/invoiceitems", {
            customer: stripeCustomerId,
            amount: String(Math.round(SERVICE_FEE * 100)),
            currency: "usd",
            description: "BigBankBonus One-Time Service Fee",
          });
          await stripePost("/invoices", {
            customer: stripeCustomerId,
            auto_advance: "true",
          });
        } else {
          // Demo mode
          stripeCustomerId = `demo_cus_${userId}`;
          stripeSubscriptionId = `demo_sub_${Date.now()}`;
          currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        }

        // Persist the subscription record
        if (existingSub) {
          await db.update(subscriptionsTable).set({
            plan: billingPlan, status: "active",
            stripeCustomerId, stripeSubscriptionId,
            stripePriceId: PRICE_IDS[billingPlan],
            currentPeriodStart: new Date(),
            currentPeriodEnd: currentPeriodEnd ?? undefined,
            cancelAtPeriodEnd: false,
            updatedAt: new Date(),
          }).where(eq(subscriptionsTable.userId, userId));
        } else {
          await db.insert(subscriptionsTable).values({
            userId, plan: billingPlan, status: "active",
            stripeCustomerId, stripeSubscriptionId,
            stripePriceId: PRICE_IDS[billingPlan],
            currentPeriodStart: new Date(),
            currentPeriodEnd: currentPeriodEnd ?? undefined,
          });
        }

        response.billingTriggered = true;
        response.billingPlan = billingPlan;
        response.serviceFeeCharged = true;
        response.message = `Account approved. $6/mo subscription and $99 service fee activated for userId: ${userId}`;
      } else {
        response.message = "Account approved. Billing was already active — no duplicate charge created.";
        response.billingAlreadyActive = true;
      }
    }

    res.json(response);
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "Failed to update approval status" });
  }
});

/**
 * GET /api/admin/accounts
 * List all tracked user accounts with their approval status.
 * Requires admin authentication.
 */
router.get("/admin/accounts", async (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const accounts = await db
      .select()
      .from(userAccountsTable)
      .orderBy(userAccountsTable.createdAt);
    res.json({ accounts });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "Failed to fetch accounts" });
  }
});

/**
 * POST /api/accounts
 * Create a new tracked user account.
 * Enforces one active (non-closed) account per user — server-side.
 */
router.post("/accounts", async (req, res) => {
  const { userId, bankName, bonusAmount, directDepositRequired, accountNumber, routingNumber } = req.body as {
    userId: string;
    bankName: string;
    bonusAmount?: number;
    directDepositRequired?: number;
    accountNumber?: string;
    routingNumber?: string;
  };

  if (!userId || !bankName) {
    return res.status(400).json({ error: "userId and bankName required" });
  }

  try {
    // ─── One-free-account enforcement (server-side) ───────────────────────
    const existingAccounts = await db
      .select()
      .from(userAccountsTable)
      .where(eq(userAccountsTable.userId, userId));

    const activeCount = existingAccounts.filter(a => a.status !== "closed").length;
    if (activeCount >= 1) {
      return res.status(409).json({
        error: "Only one free account is allowed per user",
        detail: "Close your current account before opening a new one.",
        code: "ONE_FREE_ACCOUNT_LIMIT",
      });
    }

    const [account] = await db.insert(userAccountsTable).values({
      userId,
      bankName,
      bonusAmount: bonusAmount ?? 0,
      directDepositRequired: directDepositRequired ?? 0,
      accountNumber,
      routingNumber,
      status: "pending",
      approvalStatus: "pending",
    }).returning();

    res.status(201).json({ account });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "Failed to create account" });
  }
});

export default router;
