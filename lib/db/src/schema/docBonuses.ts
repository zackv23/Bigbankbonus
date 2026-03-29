import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const docBonusesTable = pgTable("doc_bonuses", {
  id: serial("id").primaryKey(),
  guid: text("guid").notNull().unique(),
  title: text("title").notNull(),
  link: text("link").notNull(),
  description: text("description"),
  bankName: text("bank_name"),
  bonusAmount: integer("bonus_amount"),
  category: text("category").notNull().default("bank"),
  pubDate: timestamp("pub_date"),
  fetchedAt: timestamp("fetched_at").defaultNow(),
});

export const insertDocBonusSchema = createInsertSchema(docBonusesTable).omit({ id: true });
export type InsertDocBonus = z.infer<typeof insertDocBonusSchema>;
export type DocBonus = typeof docBonusesTable.$inferSelect;
