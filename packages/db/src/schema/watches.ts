import { pgTable, text, timestamp, boolean, integer, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { users } from "./users";

export const sensitivityEnum = pgEnum("sensitivity", ["strict", "balanced", "adventurous"]);
export const deliveryMethodEnum = pgEnum("delivery_method", ["instant", "daily", "weekly"]);
export const detailLevelEnum = pgEnum("detail_level", ["headlines", "standard", "deep"]);

export const watches = pgTable("watches", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  name: text("name").notNull(),
  isActive: boolean("is_active").default(true).notNull(),

  // Keywords
  keywordsMust: jsonb("keywords_must").$type<string[]>().default([]),
  keywordsBonus: jsonb("keywords_bonus").$type<string[]>().default([]),
  keywordsExclude: jsonb("keywords_exclude").$type<string[]>().default([]),

  // Filters
  regions: jsonb("regions").$type<string[]>().default([]),
  valueMin: integer("value_min"),
  valueMax: integer("value_max"),
  includeUnspecifiedValue: boolean("include_unspecified_value").default(true),
  tenderTypes: jsonb("tender_types").$type<string[]>().default([]),
  minResponseDays: integer("min_response_days"),

  // Preferences
  preferredSectors: jsonb("preferred_sectors").$type<string[]>().default([]),
  preferredBuyers: jsonb("preferred_buyers").$type<string[]>().default([]),
  certificationsHeld: jsonb("certifications_held").$type<string[]>().default([]),

  // Matching
  sensitivity: sensitivityEnum("sensitivity").default("balanced").notNull(),

  // Delivery
  deliveryMethod: deliveryMethodEnum("delivery_method").default("daily").notNull(),
  detailLevel: detailLevelEnum("detail_level").default("standard").notNull(),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export type Watch = typeof watches.$inferSelect;
export type NewWatch = typeof watches.$inferInsert;
