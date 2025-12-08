import { pgTable, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const planEnum = pgEnum("plan", ["free", "pro"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "canceled",
  "past_due",
  "unpaid",
  "trialing"
]);

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  email: text("email").notNull().unique(),
  companyName: text("company_name"),
  abn: text("abn"),

  // Subscription
  plan: planEnum("plan").default("free").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: subscriptionStatusEnum("subscription_status"),
  currentPeriodEnd: timestamp("current_period_end"),

  // Onboarding
  onboardingCompleted: boolean("onboarding_completed").default(false),

  // Admin
  isAdmin: boolean("is_admin").default(false),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
