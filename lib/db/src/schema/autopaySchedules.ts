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
  ddAmount: integer("dd_amount"),      // bonusAmount / 3, rounded up
  chargeAmount: integer("charge_amount"), // ddAmount + 3% fee, rounded up
  achAmount: integer("ach_amount"),    // ddAmount + 1 (round up + $1)

  // Schedule
  ddOutDate: timestamp("dd_out_date"),   // next business day = ACH push date
  ddInDate: timestamp("dd_in_date"),     // 5 business days after ddOutDate = ACH pull date
  refundDate: timestamp("refund_date"),  // 3 business days after ddInDate = CC refund

  // Status lifecycle
  // pending_charge → charged → ach_push_sent → ach_push_settled →
  // ach_pull_sent → ach_pull_settled → refunded | cancelled | failed
  status: text("status").notNull().default("pending_charge"),

  // Stripe operation IDs
  stripeChargeId: text("stripe_charge_id"),
  stripeTransferOutId: text("stripe_transfer_out_id"),
  stripeTransferInId: text("stripe_transfer_in_id"),
  stripeRefundId: text("stripe_refund_id"),

  demo: boolean("demo").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAutopaySchema = createInsertSchema(autopaySchedulesTable).omit({ id: true });
export type InsertAutopay = z.infer<typeof insertAutopaySchema>;
export type AutopaySchedule = typeof autopaySchedulesTable.$inferSelect;
