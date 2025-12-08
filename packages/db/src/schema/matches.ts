import { pgTable, text, timestamp, integer, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { watches } from "./watches";
import { tenders } from "./tenders";

export const matchTierEnum = pgEnum("match_tier", ["strong", "maybe", "stretch"]);
export const userFeedbackEnum = pgEnum("user_feedback", ["positive", "negative"]);

export const matches = pgTable("matches", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  watchId: text("watch_id").notNull().references(() => watches.id, { onDelete: "cascade" }),
  tenderId: text("tender_id").notNull().references(() => tenders.id, { onDelete: "cascade" }),

  // Scoring
  score: integer("score").notNull(),
  tier: matchTierEnum("tier").notNull(),
  matchedKeywords: jsonb("matched_keywords").$type<string[]>().default([]),

  // AI Analysis
  llmRelevanceScore: integer("llm_relevance_score"),
  llmReasoning: text("llm_reasoning"),
  personalisedSummary: text("personalised_summary"),

  // User interaction
  userFeedback: userFeedbackEnum("user_feedback"),
  feedbackReason: text("feedback_reason"),
  isSaved: boolean("is_saved").default(false),
  isHidden: boolean("is_hidden").default(false),

  notifiedAt: timestamp("notified_at"),

  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Add missing import
import { boolean } from "drizzle-orm/pg-core";

export type Match = typeof matches.$inferSelect;
export type NewMatch = typeof matches.$inferInsert;
