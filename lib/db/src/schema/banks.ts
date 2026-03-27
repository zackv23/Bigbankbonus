import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userAccountsTable = pgTable("user_accounts", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  bankName: text("bank_name").notNull(),
  accountNumber: text("account_number"),
  routingNumber: text("routing_number"),
  bonusAmount: integer("bonus_amount").notNull().default(0),
  directDepositRequired: integer("direct_deposit_required").notNull().default(0),
  status: text("status").notNull().default("pending"),
  openedAt: timestamp("opened_at").defaultNow(),
  bonusReceivedAt: timestamp("bonus_received_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const scheduledTransactionsTable = pgTable("scheduled_transactions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  userAccountId: integer("user_account_id").notNull(),
  type: text("type").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  scheduledDate: timestamp("scheduled_date").notNull(),
  status: text("status").notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userCreditsTable = pgTable("user_credits", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  totalCredits: decimal("total_credits", { precision: 12, scale: 2 }).notNull().default("0"),
  usedCredits: decimal("used_credits", { precision: 12, scale: 2 }).notNull().default("0"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const agentConversationsTable = pgTable("agent_conversations", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull().default("New Conversation"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const agentMessagesTable = pgTable("agent_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserAccountSchema = createInsertSchema(userAccountsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertScheduledTransactionSchema = createInsertSchema(scheduledTransactionsTable).omit({ id: true, createdAt: true });
export const insertUserCreditSchema = createInsertSchema(userCreditsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAgentConversationSchema = createInsertSchema(agentConversationsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAgentMessageSchema = createInsertSchema(agentMessagesTable).omit({ id: true, createdAt: true });

export type UserAccount = typeof userAccountsTable.$inferSelect;
export type InsertUserAccount = z.infer<typeof insertUserAccountSchema>;
export type ScheduledTransaction = typeof scheduledTransactionsTable.$inferSelect;
export type InsertScheduledTransaction = z.infer<typeof insertScheduledTransactionSchema>;
export type UserCredit = typeof userCreditsTable.$inferSelect;
export type AgentConversation = typeof agentConversationsTable.$inferSelect;
export type AgentMessage = typeof agentMessagesTable.$inferSelect;
