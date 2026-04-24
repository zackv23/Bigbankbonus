import { Router } from "express";
import { db, subscriptionsTable, userAccountsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  PRICE_IDS,
  SERVICE_FEE,
  activateApprovedSubscription,
  cancelStripeSubscription,
  createSubscriptionSetupIntent,
} from "../lib/stripeBilling";

const router = Router();

// Updated pricing: $6/mo subscription + $99 one-time service fee, triggered on approval
const MONTHLY_PRICE = 6.0;
const ANNUAL_PRICE = 72.0;

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
      monthlyEquivalent: 6.0,
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
    billingExplanation:
      "Sign up is free. You are only charged the $6/mo subscription and the $99 service fee after your bank account application is approved.",
  });
});

router.post("/subscriptions/setup", async (req, res) => {
  const { userId, email } = req.body as {
    userId?: string;
    email?: string;
  };

  if (!userId) {
    return res.status(400).json({ error: "userId required" });
  }

  try {
    const [existingSub] = await db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.userId, userId))
      .limit(1);

    const setup = await createSubscriptionSetupIntent({
      userId,
      email: email ?? existingSub?.billingEmail ?? undefined,
      existingCustomerId: existingSub?.stripeCustomerId,
    });

    if (existingSub) {
      await db
        .update(subscriptionsTable)
        .set({
          stripeCustomerId: setup.customerId,
          billingEmail: email ?? existingSub.billingEmail,
          updatedAt: new Date(),
        })
        .where(eq(subscriptionsTable.userId, userId));
    } else {
      await db.insert(subscriptionsTable).values({
        userId,
        plan: "free",
        status: "active",
        stripeCustomerId: setup.customerId,
        billingEmail: email ?? null,
      });
    }

    return res.json({
      ...setup,
      publishableKey:
        process.env.STRIPE_PUBLISHABLE_KEY ??
        process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ??
        null,
    });
  } catch (error: any) {
    return res.status(error?.statusCode ?? 500).json({
      error: error?.message ?? "Failed to initialize subscription setup",
    });
  }
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
      plan: "free",
      status: "active",
      userId,
      billingActive: false,
      features: planFeatures("free"),
    });
  }

  return res.json({ ...sub, features: planFeatures(sub.plan) });
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

  const approvedAccounts = await db
    .select()
    .from(userAccountsTable)
    .where(eq(userAccountsTable.userId, userId));

  const hasApproved = approvedAccounts.some((a) => a.approvalStatus === "approved");
  if (!hasApproved) {
    return res.status(403).json({
      error: "Billing cannot be activated before account approval",
      detail:
        "At least one user account must be in 'approved' status before a subscription can be created.",
    });
  }

  const [existingSub] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, userId))
    .limit(1);

  if (
    existingSub &&
    (existingSub.plan === "monthly" || existingSub.plan === "annual") &&
    existingSub.status === "active"
  ) {
    return res.status(409).json({
      error: "Active subscription already exists",
      subscription: existingSub,
      features: planFeatures(existingSub.plan),
    });
  }

  try {
    const billing = await activateApprovedSubscription({
      userId,
      plan,
      email: email ?? existingSub?.billingEmail ?? undefined,
      existingCustomerId: existingSub?.stripeCustomerId,
      defaultPaymentMethodId:
        stripePaymentMethodId ??
        existingSub?.stripeDefaultPaymentMethodId ??
        undefined,
    });

    let sub;
    if (existingSub) {
      [sub] = await db
        .update(subscriptionsTable)
        .set({
          plan,
          status: billing.status,
          stripeCustomerId: billing.stripeCustomerId,
          stripeSubscriptionId: billing.stripeSubscriptionId,
          stripePriceId: billing.stripePriceId,
          stripeDefaultPaymentMethodId:
            stripePaymentMethodId ?? existingSub.stripeDefaultPaymentMethodId ?? undefined,
          billingEmail: email ?? existingSub.billingEmail ?? undefined,
          currentPeriodStart: new Date(),
          currentPeriodEnd: billing.currentPeriodEnd ?? undefined,
          cancelAtPeriodEnd: false,
          updatedAt: new Date(),
        })
        .where(eq(subscriptionsTable.userId, userId))
        .returning();
    } else {
      [sub] = await db
        .insert(subscriptionsTable)
        .values({
          userId,
          plan,
          status: billing.status,
          stripeCustomerId: billing.stripeCustomerId,
          stripeSubscriptionId: billing.stripeSubscriptionId,
          stripePriceId: billing.stripePriceId,
          stripeDefaultPaymentMethodId: stripePaymentMethodId ?? null,
          billingEmail: email ?? null,
          currentPeriodStart: new Date(),
          currentPeriodEnd: billing.currentPeriodEnd ?? undefined,
        })
        .returning();
    }

    return res.json({
      subscription: sub,
      features: planFeatures(plan),
      serviceFeeCharged: true,
    });
  } catch (error: any) {
    return res.status(error?.statusCode ?? 500).json({
      error: error?.message ?? "Failed to create subscription",
    });
  }
});

// ─── POST /subscriptions/cancel ──────────────────────────────────────────────
router.post("/subscriptions/cancel", async (req, res) => {
  const { userId } = req.body as { userId: string };
  if (!userId) return res.status(400).json({ error: "userId required" });

  const [sub] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, userId))
    .limit(1);
  if (!sub) return res.status(404).json({ error: "No subscription found" });

  if (sub.stripeSubscriptionId && !sub.stripeSubscriptionId.startsWith("demo_")) {
    await cancelStripeSubscription(sub.stripeSubscriptionId);
  }

  const [updated] = await db
    .update(subscriptionsTable)
    .set({ cancelAtPeriodEnd: true, updatedAt: new Date() })
    .where(eq(subscriptionsTable.userId, userId))
    .returning();

  return res.json({ subscription: updated });
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
