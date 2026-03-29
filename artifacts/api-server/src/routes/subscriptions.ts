import { Router } from "express";
import { db, subscriptionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;

// Stripe price IDs — set these in env once Stripe is configured
const PRICE_IDS = {
  monthly: process.env.STRIPE_PRICE_MONTHLY ?? "price_monthly_demo",
  annual:  process.env.STRIPE_PRICE_ANNUAL  ?? "price_annual_demo",
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

async function stripeGet(path: string): Promise<Record<string, any>> {
  if (!STRIPE_SECRET) return { demo: true };
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    headers: { Authorization: `Bearer ${STRIPE_SECRET}` },
  });
  return res.json() as Promise<Record<string, any>>;
}

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
      features: planFeatures("free"),
    });
  }

  res.json({ ...sub, features: planFeatures(sub.plan) });
});

// ─── POST /subscriptions/subscribe ───────────────────────────────────────────
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

  const isDemo = !STRIPE_SECRET || stripePaymentMethodId === "demo";
  let stripeCustomerId: string | null = null;
  let stripeSubscriptionId: string | null = null;
  let currentPeriodEnd: Date | null = null;

  if (!isDemo && stripePaymentMethodId && email) {
    // Create or retrieve Stripe customer
    const customer = await stripePost("/customers", {
      email,
      "metadata[userId]": userId,
    });
    stripeCustomerId = customer.id;

    // Attach payment method
    await stripePost(`/payment_methods/${stripePaymentMethodId}/attach`, {
      customer: stripeCustomerId,
    });

    // Update default payment method
    await stripePost(`/customers/${stripeCustomerId}`, {
      "invoice_settings[default_payment_method]": stripePaymentMethodId,
    });

    // Create subscription
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
  } else {
    // Demo mode
    stripeCustomerId = `demo_cus_${userId}`;
    stripeSubscriptionId = `demo_sub_${Date.now()}`;
    currentPeriodEnd = new Date(Date.now() + (plan === "annual" ? 365 : 30) * 24 * 60 * 60 * 1000);
  }

  // Upsert subscription record
  const existing = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.userId, userId)).limit(1);

  let sub;
  if (existing.length > 0) {
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

  res.json({ subscription: sub, features: planFeatures(plan) });
});

// ─── POST /subscriptions/cancel ──────────────────────────────────────────────
router.post("/subscriptions/cancel", async (req, res) => {
  const { userId } = req.body as { userId: string };
  if (!userId) return res.status(400).json({ error: "userId required" });

  const [sub] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.userId, userId)).limit(1);
  if (!sub) return res.status(404).json({ error: "No subscription found" });

  if (!sub.demo && STRIPE_SECRET && sub.stripeSubscriptionId) {
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

// ─── GET /subscriptions/prices — public pricing ───────────────────────────────
router.get("/subscriptions/prices", (_req, res) => {
  res.json({
    monthly: { price: 9.99, interval: "month", label: "Pro Monthly", priceId: PRICE_IDS.monthly },
    annual:  { price: 83.88, interval: "year", monthlyEquivalent: 6.99, label: "Pro Annual",
               discount: 30, priceId: PRICE_IDS.annual },
  });
});

// ─── Feature gates ────────────────────────────────────────────────────────────
function planFeatures(plan: string) {
  const isPro = plan === "monthly" || plan === "annual";
  return {
    liveDealsLimit: isPro ? null : 5,     // null = unlimited
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
