import { pgTable, text, serial, integer, timestamp, boolean, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const depositOrdersTable = pgTable("deposit_orders", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),

  // Fixed product amounts (in cents for precision)
  depositAmount: integer("deposit_amount").notNull().default(50000),   // $500.00 in cents
  serviceFee: integer("service_fee").notNull().default(9900),          // $99.00 in cents
  taxAmount: integer("tax_amount").notNull().default(0),               // calculated from state
  stripeFee: integer("stripe_fee").notNull().default(0),               // 2.9% + $0.30
  totalCharged: integer("total_charged").notNull(),                    // sum of all above, in cents

  // User's state for tax calculation
  userState: text("user_state"),

  // Bank account details (masked)
  accountLast4: text("account_last4").notNull(),
  routingNumber: text("routing_number").notNull(),

  // Stripe identifiers
  stripeCustomerId: text("stripe_customer_id"),
  stripePaymentMethodId: text("stripe_payment_method_id"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeTransferId: text("stripe_transfer_id"),

  // Scheduling — ACH goes out the following Monday
  achScheduledDate: timestamp("ach_scheduled_date"),  // next Monday after charge
  achAmount: integer("ach_amount").notNull().default(50000), // exactly $500 in cents

  // Status lifecycle:
  // pending_charge → charged → ach_pending → ach_sent → ach_confirmed | failed | cancelled
  status: text("status").notNull().default("pending_charge"),

  // Recommended offers context (for leverage projection)
  stackedOffersCount: integer("stacked_offers_count"),
  stackedOffersTotal: integer("stacked_offers_total"),  // total potential bonuses in cents

  demo: boolean("demo").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDepositOrderSchema = createInsertSchema(depositOrdersTable).omit({ id: true });
export type InsertDepositOrder = z.infer<typeof insertDepositOrderSchema>;
export type DepositOrder = typeof depositOrdersTable.$inferSelect;
