import { pgTable, text, serial, integer, timestamp, decimal, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const salesRepsTable = pgTable("sales_reps", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  avatar: text("avatar"),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull().default("10.00"),
  status: text("status").notNull().default("active"),
  totalEarnings: decimal("total_earnings", { precision: 12, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const leadsTable = pgTable("leads", {
  id: serial("id").primaryKey(),
  repId: integer("rep_id").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  source: text("source"),
  stage: text("stage").notNull().default("new"),
  estimatedValue: decimal("estimated_value", { precision: 12, scale: 2 }),
  notes: text("notes"),
  lastContactedAt: timestamp("last_contacted_at"),
  convertedAt: timestamp("converted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const clientNotesTable = pgTable("client_notes", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull(),
  repId: integer("rep_id").notNull(),
  content: text("content").notNull(),
  noteType: text("note_type").notNull().default("general"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const commissionsTable = pgTable("commissions", {
  id: serial("id").primaryKey(),
  repId: integer("rep_id").notNull(),
  leadId: integer("lead_id"),
  clientUserId: text("client_user_id"),
  type: text("type").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSalesRepSchema = createInsertSchema(salesRepsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLeadSchema = createInsertSchema(leadsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertClientNoteSchema = createInsertSchema(clientNotesTable).omit({ id: true, createdAt: true });
export const insertCommissionSchema = createInsertSchema(commissionsTable).omit({ id: true, createdAt: true });

export type SalesRep = typeof salesRepsTable.$inferSelect;
export type InsertSalesRep = z.infer<typeof insertSalesRepSchema>;
export type Lead = typeof leadsTable.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type ClientNote = typeof clientNotesTable.$inferSelect;
export type InsertClientNote = z.infer<typeof insertClientNoteSchema>;
export type Commission = typeof commissionsTable.$inferSelect;
export type InsertCommission = z.infer<typeof insertCommissionSchema>;
