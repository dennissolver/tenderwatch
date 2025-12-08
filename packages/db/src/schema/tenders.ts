import { pgTable, text, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { siteEnum } from "./linked-accounts";

export const tenders = pgTable("tenders", {
  id: text("id").primaryKey().$defaultFn(() => createId()),

  // Source
  source: siteEnum("source").notNull(),
  sourceId: text("source_id").notNull(),
  sourceUrl: text("source_url").notNull(),

  // Basic info
  title: text("title").notNull(),
  description: text("description"),
  fullText: text("full_text"),
  buyerOrg: text("buyer_org"),

  // Classification
  regions: jsonb("regions").$type<string[]>().default([]),
  categories: jsonb("categories").$type<string[]>().default([]), // UNSPSC codes
  tenderType: text("tender_type"),

  // Value
  valueLow: integer("value_low"),
  valueHigh: integer("value_high"),
  valueIsEstimated: boolean("value_is_estimated").default(false),

  // Dates
  publishedAt: timestamp("published_at"),
  closesAt: timestamp("closes_at"),
  briefingAt: timestamp("briefing_at"),

  // Requirements
  certificationsRequired: jsonb("certifications_required").$type<string[]>().default([]),

  // AI Processing
  llmSummary: text("llm_summary"),
  llmExtractedData: jsonb("llm_extracted_data"),

  // Documents
  documentUrls: jsonb("document_urls").$type<string[]>().default([]),
  documentsStoragePath: text("documents_storage_path"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export type Tender = typeof tenders.$inferSelect;
export type NewTender = typeof tenders.$inferInsert;
