/**
 * Stripe Webhook endpoint — POST /api/webhooks/stripe
 *
 * Verifies Stripe-Signature header with STRIPE_WEBHOOK_SECRET.
 * Falls back to unverified in dev/demo mode.
 *
 * Handles:
 *  - payment_intent.succeeded        → mark autopay/deposit as charged
 *  - payment_intent.payment_failed   → mark as failed + notify user
 *  - customer.subscription.updated   → sync plan status in DB
 *  - customer.subscription.deleted   → downgrade to free
 *  - invoice.payment_failed          → notify user of lapsed subscription
 *  - invoice.paid                    → confirm subscription active
 */

import { Router } from "express";
import { db, autopaySchedulesTable, subscriptionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { sendEmail, sendSMS, sendPushNotification } from "../lib/notifications";
import { upsertStoredPaymentMethod } from "../lib/stripeBilling";

const router = Router();
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// ─── Stripe signature verification (lightweight) ───────────────────────────────
async function verifyStripeSignature(
  rawBody: Buffer,
  signature: string | undefined,
  secret: string
): Promise<boolean> {
  if (!signature) return false;
  try {
    const { createHmac } = await import("crypto");
    const parts = signature.split(",").reduce<Record<string, string>>((acc, part) => {
      const [k, v] = part.split("=");
      acc[k] = v;
      return acc;
    }, {});
    const timestamp = parts["t"];
    const expected = parts["v1"];
    if (!timestamp || !expected) return false;
    const payload = `${timestamp}.${rawBody.toString("utf8")}`;
    const hmac = createHmac("sha256", secret).update(payload).digest("hex");
    return hmac === expected;
  } catch {
    return false;
  }
}

// Parse raw body for signature verification
router.post(
  "/webhooks/stripe",
  // Express raw body needed — set Content-Type to application/json in Stripe dashboard
  async (req, res) => {
    const sig = req.headers["stripe-signature"] as string | undefined;
    const rawBody: Buffer = (req as any).rawBody ?? Buffer.from(JSON.stringify(req.body));

    // Verify signature in production
    if (WEBHOOK_SECRET && sig) {
      const valid = await verifyStripeSignature(rawBody, sig, WEBHOOK_SECRET);
      if (!valid) {
        return res.status(400).json({ error: "Invalid signature" });
      }
    } else if (STRIPE_SECRET && WEBHOOK_SECRET) {
      return res.status(400).json({ error: "Missing stripe-signature header" });
    }

    const event = req.body as { type: string; data: { object: Record<string, any> } };
    const obj = event?.data?.object ?? {};

    try {
      switch (event.type) {

        // ── Subscription events ──────────────────────────────────────────────
        case "setup_intent.succeeded": {
          const userId = obj.metadata?.userId as string | undefined;
          const paymentMethodId = obj.payment_method as string | undefined;
          const customerId = obj.customer as string | undefined;

          if (userId && paymentMethodId) {
            await upsertStoredPaymentMethod({
              userId,
              email: null,
              stripeCustomerId: customerId,
              stripePaymentMethodId: paymentMethodId,
            });
          }
          break;
        }

        case "customer.subscription.updated": {
          const stripeSubId = obj.id as string;
          const status = obj.status as string; // active | past_due | canceled | trialing
          const currentPeriodEnd = obj.current_period_end
            ? new Date((obj.current_period_end as number) * 1000)
            : undefined;
          const currentPeriodStart = obj.current_period_start
            ? new Date((obj.current_period_start as number) * 1000)
            : undefined;
          await db
            .update(subscriptionsTable)
            .set({
              status,
              stripePriceId: obj.items?.data?.[0]?.price?.id ?? undefined,
              stripeDefaultPaymentMethodId:
                obj.default_payment_method as string | undefined,
              currentPeriodStart,
              currentPeriodEnd,
              cancelAtPeriodEnd: Boolean(obj.cancel_at_period_end),
              updatedAt: new Date(),
            })
            .where(eq(subscriptionsTable.stripeSubscriptionId, stripeSubId));
          break;
        }

        case "customer.subscription.deleted": {
          const stripeSubId = obj.id as string;
          await db
            .update(subscriptionsTable)
            .set({ status: "cancelled", plan: "free", updatedAt: new Date() })
            .where(eq(subscriptionsTable.stripeSubscriptionId, stripeSubId));
          break;
        }

        case "invoice.payment_failed": {
          const stripeSubId = (obj.subscription ?? obj.parent?.subscription_details?.subscription) as string | undefined;
          const customerEmail = obj.customer_email as string | undefined;
          if (customerEmail) {
            await sendEmail({
              to: customerEmail,
              subject: "BigBankBonus: Payment failed — action required",
              html: `<div style="font-family:sans-serif;padding:24px"><h2>Payment Failed</h2><p>We couldn't process your BigBankBonus subscription payment. Please update your payment method at <a href="https://bigbankbonus.com/settings">bigbankbonus.com/settings</a> to keep your Pro access.</p></div>`,
              text: "Your BigBankBonus payment failed. Update your card at bigbankbonus.com/settings.",
            });
          }
          if (stripeSubId) {
            await db
              .update(subscriptionsTable)
              .set({ status: "past_due", updatedAt: new Date() })
              .where(eq(subscriptionsTable.stripeSubscriptionId, stripeSubId));
          }
          break;
        }

        case "invoice.paid": {
          const stripeSubId = (obj.subscription ?? obj.parent?.subscription_details?.subscription) as string | undefined;
          if (stripeSubId) {
            await db
              .update(subscriptionsTable)
              .set({
                status: "active",
                stripeDefaultPaymentMethodId:
                  obj.default_payment_method as string | undefined,
                updatedAt: new Date(),
              })
              .where(eq(subscriptionsTable.stripeSubscriptionId, stripeSubId));
          }
          break;
        }

        // ── PaymentIntent events ─────────────────────────────────────────────
        case "payment_intent.succeeded": {
          const piId = obj.id as string;
          const meta = (obj.metadata ?? {}) as Record<string, string>;
          if (meta.autopay_schedule_id) {
            await db
              .update(autopaySchedulesTable)
              .set({ status: "charged", stripeChargeId: piId, updatedAt: new Date() })
              .where(eq(autopaySchedulesTable.id, parseInt(meta.autopay_schedule_id, 10)));
          }
          break;
        }

        case "payment_intent.payment_failed": {
          const piId = obj.id as string;
          const meta = (obj.metadata ?? {}) as Record<string, string>;
          if (meta.autopay_schedule_id) {
            const schedId = parseInt(meta.autopay_schedule_id, 10);
            const [sched] = await db
              .select()
              .from(autopaySchedulesTable)
              .where(eq(autopaySchedulesTable.id, schedId))
              .limit(1);
            await db
              .update(autopaySchedulesTable)
              .set({ status: "failed", updatedAt: new Date() })
              .where(eq(autopaySchedulesTable.id, schedId));
            if (sched?.notifyEmail) {
              await sendEmail({
                to: sched.notifyEmail,
                subject: `BigBankBonus: Autopay payment failed — ${sched.bankName}`,
                html: `<div style="font-family:sans-serif;padding:24px"><h2 style="color:#F44336">Payment Failed</h2><p>Your autopay schedule for <strong>${sched.bankName}</strong> could not process. Please check your payment method.</p></div>`,
                text: `Your BigBankBonus autopay for ${sched.bankName} failed. Check your payment method.`,
              });
            }
            if (sched?.notifyPhone) {
              await sendSMS(sched.notifyPhone, `BigBankBonus: Autopay payment failed for ${sched.bankName}. Check your card.`);
            }
          }
          break;
        }

        default:
          // Unhandled event type — return 200 so Stripe stops retrying
          break;
      }
    } catch (err) {
      console.error("[webhooks] error processing event:", event.type, err);
      return res.status(500).json({ error: "Internal error" });
    }

    return res.json({ received: true });
  }
);

export default router;
