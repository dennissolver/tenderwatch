import { pgTable, text, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { users } from "./users";

export const siteEnum = pgEnum("site", [
  "austender",
  "nsw_etender",
  "qld_qtenders",
  "vic_tenders",
  "sa_tenders",
  "wa_tenders",
  "tas_tenders",
  "nt_tenders",
  "act_tenders",
  "vendorpanel",
  "tenderlink",
  "icn_gateway"
]);

export const accountStatusEnum = pgEnum("account_status", [
  "connected",
  "error",
  "expired",
  "pending"
]);

export const linkedAccounts = pgTable("linked_accounts", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  site: siteEnum("site").notNull(),
  siteUsername: text("site_username").notNull(),
  encryptedCredentials: text("encrypted_credentials").notNull(),

  // Session data (cookies/tokens for maintaining login)
  sessionData: jsonb("session_data"),

  status: accountStatusEnum("status").default("pending").notNull(),
  lastSyncAt: timestamp("last_sync_at"),
  lastError: text("last_error"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export type LinkedAccount = typeof linkedAccounts.$inferSelect;
export type NewLinkedAccount = typeof linkedAccounts.$inferInsert;
