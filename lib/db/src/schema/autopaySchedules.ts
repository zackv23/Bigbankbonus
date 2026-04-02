import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const autopaySchedulesTable = pgTable("autopay_schedules", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  bonusGuid: text("bonus_guid"),
  bankName: text("bank_name"),
  bonusAmount: integer("bonus_amount"),
  offerLink: text("offer_link"),
  section: text("section"),

  // Stored account info — only last 4 of account number; full account tokenized via Stripe
  accountLast4: text("account_last4"),
  routingNumber: text("routing_number"),
  stripeBankTokenId: text("stripe_bank_token_id"),
  stripeCustomerId: text("stripe_customer_id"),
  stripePaymentMethodId: text("stripe_payment_method_id"),

  // Amounts (in whole dollars)
  ddAmount: integer("dd_amount"),
  chargeAmount: integer("charge_amount"),
  achAmount: integer("ach_amount"),
  leverageChargeAmount: integer("leverage_charge_amount"), // fixed $1000 leverage collateral

  // 91-day cycle program
  cycleCount: integer("cycle_count").default(0),
  maxCycles: integer("max_cycles").default(18),
  endsAt: timestamp("ends_at"),                       // enrollment + 91 days
  nextActionAt: timestamp("next_action_at"),          // when to run next push/pull
  nextActionType: text("next_action_type"),           // "push" | "pull"
  cycleIntervalBizDays: integer("cycle_interval_biz_days").default(2),
  discountPct: integer("discount_pct").default(0),   // 25 = 25% off

  // Schedule dates (current cycle)
  ddOutDate: timestamp("dd_out_date"),
  ddInDate: timestamp("dd_in_date"),
  refundDate: timestamp("refund_date"),

  // Status lifecycle
  status: text("status").notNull().default("pending_charge"),

  // Stripe operation IDs
  stripeChargeId: text("stripe_charge_id"),
  stripeTransferOutId: text("stripe_transfer_out_id"),
  stripeTransferInId: text("stripe_transfer_in_id"),
  stripeRefundId: text("stripe_refund_id"),

  // Notification preferences
  notifyEmail: text("notify_email"),
  notifyPhone: text("notify_phone"),

  demo: boolean("demo").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAutopaySchema = createInsertSchema(autopaySchedulesTable).omit({ id: true });
export type InsertAutopay = z.infer<typeof insertAutopaySchema>;
export type AutopaySchedule = typeof autopaySchedulesTable.$inferSelect;
