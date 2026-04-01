import { Router } from "express";
import { db, subscriptionsTable, userAccountsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;

// Updated pricing: $6/mo subscription + $99 one-time service fee, triggered on approval
const MONTHLY_PRICE = 6.00;
const ANNUAL_PRICE = 72.00;
const SERVICE_FEE = 99.00;

const PRICE_IDS = {
  monthly: process.env.STRIPE_PRICE_MONTHLY ?? "price_monthly_demo",
  annual:  process.env.STRIPE_PRICE_ANNUAL  ?? "price_annual_demo",
  serviceFee: process.env.STRIPE_PRICE_SERVICE_FEE ?? "price_service_fee_demo",
};

async function stripePost(path: string, body: Record<string, string>): Promise<Record<string, any>> {
  if (!STRIPE_SECRET) return { demo: true };
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${STRIPE_SECRET}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body),
  });
  return res.json() as Promise<Record<string, any>>;
}

// ─── GET /subscriptions/prices — public pricing (MUST be before /:userId) ──
router.get("/subscriptions/prices", (_req, res) => {
  res.json({
    monthly: {
      price: MONTHLY_PRICE,
      interval: "month",
      label: "Pro Monthly",
      priceId: PRICE_IDS.monthly,
      note: "Charged after account approval",
    },
    annual: {
      price: ANNUAL_PRICE,
      interval: "year",
      monthlyEquivalent: 6.00,
      label: "Pro Annual",
      priceId: PRICE_IDS.annual,
      note: "Charged after account approval",
    },
    serviceFee: {
      price: SERVICE_FEE,
      label: "One-Time Service Fee",
      description: "Charged once when your bank account is approved",
    },
    billingModel: "approval_gated",
    billingExplanation: "Sign up is free. You are only charged the $6/mo subscription and the $99 service fee after your bank account application is approved.",
  });
});

// ─── GET /subscriptions/:userId ───────────────────────────────────────────────
router.get("/subscriptions/:userId", async (req, res) => {
  const { userId } = req.params;
  const [sub] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, userId))
    .limit(1);

  if (!sub) {
    return res.json({
      plan: "free", status: "active", userId,
      billingActive: false,
      features: planFeatures("free"),
    });
  }

  res.json({ ...sub, features: planFeatures(sub.plan) });
});

/**
 * POST /subscriptions/subscribe
 * Initiates billing for an approved user (called after approval transition).
 * Enforces: user must have an approved account, and must not already have an
 * active paid subscription.
 */
router.post("/subscriptions/subscribe", async (req, res) => {
  const { userId, plan, stripePaymentMethodId, email } = req.body as {
    userId: string;
    plan: "monthly" | "annual";
    stripePaymentMethodId?: string;
    email?: string;
  };

  if (!userId || !plan) {
    return res.status(400).json({ error: "userId and plan required" });
  }

  // ─── Approval gate: ensure user has an approved account ─────────────────
  const approvedAccounts = await db
    .select()
    .from(userAccountsTable)
    .where(eq(userAccountsTable.userId, userId));

  const hasApproved = approvedAccounts.some(a => a.approvalStatus === "approved");
  if (!hasApproved) {
    return res.status(403).json({
      error: "Billing cannot be activated before account approval",
      detail: "At least one user account must be in 'approved' status before a subscription can be created.",
    });
  }

  // ─── Idempotency: avoid double-charging ────────────────────────────────
  const [existingSub] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, userId))
    .limit(1);

  if (existingSub && (existingSub.plan === "monthly" || existingSub.plan === "annual") && existingSub.status === "active") {
    return res.status(409).json({
      error: "Active subscription already exists",
      subscription: existingSub,
      features: planFeatures(existingSub.plan),
    });
  }

  const isDemo = !STRIPE_SECRET || stripePaymentMethodId === "demo";
  let stripeCustomerId: string | null = null;
  let stripeSubscriptionId: string | null = null;
  let currentPeriodEnd: Date | null = null;

  if (!isDemo && stripePaymentMethodId && email) {
    const customer = await stripePost("/customers", {
      email,
      "metadata[userId]": userId,
    });
    stripeCustomerId = customer.id;

    await stripePost(`/payment_methods/${stripePaymentMethodId}/attach`, {
      customer: stripeCustomerId,
    });

    await stripePost(`/customers/${stripeCustomerId}`, {
      "invoice_settings[default_payment_method]": stripePaymentMethodId,
    });

    // Create $6/mo subscription
    const priceId = PRICE_IDS[plan];
    const subscription = await stripePost("/subscriptions", {
      customer: stripeCustomerId,
      "items[0][price]": priceId,
      "expand[]": "latest_invoice.payment_intent",
    });
    stripeSubscriptionId = subscription.id;
    if (subscription.current_period_end) {
      currentPeriodEnd = new Date(subscription.current_period_end * 1000);
    }

    // Charge the $99 one-time service fee as a separate invoice
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
    // Demo mode — no real Stripe calls
    stripeCustomerId = `demo_cus_${userId}`;
    stripeSubscriptionId = `demo_sub_${Date.now()}`;
    currentPeriodEnd = new Date(Date.now() + (plan === "annual" ? 365 : 30) * 24 * 60 * 60 * 1000);
  }

  let sub;
  if (existingSub) {
    [sub] = await db.update(subscriptionsTable).set({
      plan, status: "active",
      stripeCustomerId, stripeSubscriptionId,
      stripePriceId: PRICE_IDS[plan],
      currentPeriodStart: new Date(),
      currentPeriodEnd: currentPeriodEnd ?? undefined,
      cancelAtPeriodEnd: false,
      updatedAt: new Date(),
    }).where(eq(subscriptionsTable.userId, userId)).returning();
  } else {
    [sub] = await db.insert(subscriptionsTable).values({
      userId, plan, status: "active",
      stripeCustomerId, stripeSubscriptionId,
      stripePriceId: PRICE_IDS[plan],
      currentPeriodStart: new Date(),
      currentPeriodEnd: currentPeriodEnd ?? undefined,
    }).returning();
  }

  res.json({ subscription: sub, features: planFeatures(plan), serviceFeeCharged: true });
});

// ─── POST /subscriptions/cancel ──────────────────────────────────────────────
router.post("/subscriptions/cancel", async (req, res) => {
  const { userId } = req.body as { userId: string };
  if (!userId) return res.status(400).json({ error: "userId required" });

  const [sub] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.userId, userId)).limit(1);
  if (!sub) return res.status(404).json({ error: "No subscription found" });

  if (STRIPE_SECRET && sub.stripeSubscriptionId && !sub.stripeSubscriptionId.startsWith("demo_")) {
    await stripePost(`/subscriptions/${sub.stripeSubscriptionId}`, {
      cancel_at_period_end: "true",
    });
  }

  const [updated] = await db.update(subscriptionsTable)
    .set({ cancelAtPeriodEnd: true, updatedAt: new Date() })
    .where(eq(subscriptionsTable.userId, userId))
    .returning();

  res.json({ subscription: updated });
});

// ─── Feature gates ────────────────────────────────────────────────────────────
function planFeatures(plan: string) {
  const isPro = plan === "monthly" || plan === "annual";
  return {
    liveDealsLimit: isPro ? null : 5,
    aiAgent: isPro,
    autopay: isPro,
    plaidLinking: isPro,
    roicCalculator: isPro,
    analyticsExport: isPro,
    prioritySupport: isPro,
    earlyAccess: plan === "annual",
    accountManager: plan === "annual",
  };
}

export default router;
