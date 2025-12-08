import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { users } from "./users";

export const usage = pgTable("usage", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),

  matchesViewed: integer("matches_viewed").default(0).notNull(),
  documentsDownloaded: integer("documents_downloaded").default(0).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull()
});

export type Usage = typeof usage.$inferSelect;
export type NewUsage = typeof usage.$inferInsert;
