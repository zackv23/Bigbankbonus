import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const fileUploadsTable = pgTable("file_uploads", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  contentType: text("content_type").notNull(),
  objectPath: text("object_path").notNull(),
  category: text("category").notNull().default("other"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFileUploadSchema = createInsertSchema(fileUploadsTable).omit({ id: true });
export type InsertFileUpload = z.infer<typeof insertFileUploadSchema>;
export type FileUpload = typeof fileUploadsTable.$inferSelect;
