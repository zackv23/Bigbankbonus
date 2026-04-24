import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const subscriptionsTable = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  plan: text("plan").notNull().default("free"),        // "free" | "monthly" | "annual"
  status: text("status").notNull().default("active"),  // "active" | "cancelled" | "past_due" | "trialing"
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripePriceId: text("stripe_price_id"),
  stripeDefaultPaymentMethodId: text("stripe_default_payment_method_id"),
  billingEmail: text("billing_email"),
  paymentMethodCollectedAt: timestamp("payment_method_collected_at"),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  trialEnd: timestamp("trial_end"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptionsTable).omit({ id: true });
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptionsTable.$inferSelect;

// Pricing constants — billing is only triggered after account approval
export const PLANS = {
  free: { name: "Free", monthlyPrice: 0, annualPrice: 0, annualMonthly: 0 },
  monthly: { name: "Pro Monthly", monthlyPrice: 6.00, annualPrice: null, annualMonthly: null },
  annual:  { name: "Pro Annual",  monthlyPrice: null, annualPrice: 72.00, annualMonthly: 6.00 },
} as const;

export const SERVICE_FEE = 99; // one-time service fee charged on approval
