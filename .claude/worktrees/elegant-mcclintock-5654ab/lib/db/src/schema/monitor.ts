import { pgTable, text, serial, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const monitorEventsTable = pgTable("monitor_events", {
  id: serial("id").primaryKey(),
  sourceUrl: text("source_url").notNull(),
  sourceCategory: text("source_category").notNull(),
  sourceName: text("source_name"),
  changeType: text("change_type").notNull(),
  summary: text("summary").notNull(),
  severity: text("severity").notNull().default("info"),
  affectedBanks: jsonb("affected_banks").$type<string[]>().default([]),
  rawSnippet: text("raw_snippet"),
  detectedAt: timestamp("detected_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const monitorRunsTable = pgTable("monitor_runs", {
  id: serial("id").primaryKey(),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  sourcesChecked: integer("sources_checked").default(0),
  eventsDetected: integer("events_detected").default(0),
  errorsEncountered: integer("errors_encountered").default(0),
  status: text("status").notNull().default("running"),
  notes: text("notes"),
});

export const sourceHealthTable = pgTable("source_health", {
  id: serial("id").primaryKey(),
  sourceUrl: text("source_url").notNull().unique(),
  sourceCategory: text("source_category").notNull(),
  sourceName: text("source_name"),
  isAlive: boolean("is_alive").default(true),
  lastStatusCode: integer("last_status_code"),
  lastCheckedAt: timestamp("last_checked_at").defaultNow(),
  responseTimeMs: integer("response_time_ms"),
  errorMessage: text("error_message"),
  consecutiveFailures: integer("consecutive_failures").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMonitorEventSchema = createInsertSchema(monitorEventsTable).omit({ id: true });
export type InsertMonitorEvent = z.infer<typeof insertMonitorEventSchema>;
export type MonitorEvent = typeof monitorEventsTable.$inferSelect;

export const insertMonitorRunSchema = createInsertSchema(monitorRunsTable).omit({ id: true });
export type InsertMonitorRun = z.infer<typeof insertMonitorRunSchema>;
export type MonitorRun = typeof monitorRunsTable.$inferSelect;

export const insertSourceHealthSchema = createInsertSchema(sourceHealthTable).omit({ id: true });
export type InsertSourceHealth = z.infer<typeof insertSourceHealthSchema>;
export type SourceHealth = typeof sourceHealthTable.$inferSelect;
