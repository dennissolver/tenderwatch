import { db } from "@tenderwatch/db";
import { users, usage, watches, linkedAccounts } from "@tenderwatch/db";
import { eq, and, gte, lte, count } from "drizzle-orm";

export type LimitType = "watches" | "matches" | "accounts" | "documents";
export type Plan = "free" | "pro";

const LIMITS: Record<Plan, Record<LimitType, number>> = {
  free: {
    watches: 1,
    matches: 3,      // per month
    accounts: 1,
    documents: 0     // no downloads
  },
  pro: {
    watches: Infinity,
    matches: Infinity,
    accounts: 20,
    documents: Infinity
  }
};

export interface LimitCheck {
  allowed: boolean;
  current: number;
  limit: number;
  plan: Plan;
}

export async function checkLimit(
  userId: string,
  limitType: LimitType
): Promise<LimitCheck> {
  // Get user's plan
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId)
  });

  if (!user) {
    throw new Error("User not found");
  }

  const plan = user.plan as Plan;
  const limit = LIMITS[plan][limitType];

  let current: number;

  switch (limitType) {
    case "watches":
      const watchCount = await db
        .select({ count: count() })
        .from(watches)
        .where(eq(watches.userId, userId));
      current = watchCount[0]?.count || 0;
      break;

    case "accounts":
      const accountCount = await db
        .select({ count: count() })
        .from(linkedAccounts)
        .where(eq(linkedAccounts.userId, userId));
      current = accountCount[0]?.count || 0;
      break;

    case "matches":
    case "documents":
      // Get current period usage
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const usageRecord = await db.query.usage.findFirst({
        where: and(
          eq(usage.userId, userId),
          gte(usage.periodStart, periodStart),
          lte(usage.periodEnd, periodEnd)
        )
      });

      current = limitType === "matches"
        ? usageRecord?.matchesViewed || 0
        : usageRecord?.documentsDownloaded || 0;
      break;

    default:
      current = 0;
  }

  return {
    allowed: current < limit,
    current,
    limit: limit === Infinity ? -1 : limit,
    plan
  };
}

export async function incrementUsage(
  userId: string,
  type: "matches" | "documents"
): Promise<void> {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Get or create usage record
  let usageRecord = await db.query.usage.findFirst({
    where: and(
      eq(usage.userId, userId),
      gte(usage.periodStart, periodStart),
      lte(usage.periodEnd, periodEnd)
    )
  });

  if (!usageRecord) {
    const [newRecord] = await db.insert(usage).values({
      userId,
      periodStart,
      periodEnd,
      matchesViewed: 0,
      documentsDownloaded: 0
    }).returning();
    usageRecord = newRecord;
  }

  // Increment
  const field = type === "matches" ? "matchesViewed" : "documentsDownloaded";
  await db.update(usage)
    .set({
      [field]: (usageRecord[field] || 0) + 1
    })
    .where(eq(usage.id, usageRecord.id));
}

export type Feature = 
  | "ai_summaries"
  | "semantic_matching"
  | "document_downloads"
  | "instant_alerts"
  | "csv_export";

const PRO_FEATURES: Feature[] = [
  "ai_summaries",
  "semantic_matching",
  "document_downloads",
  "instant_alerts",
  "csv_export"
];

export async function canUseFeature(
  userId: string,
  feature: Feature
): Promise<boolean> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId)
  });

  if (!user) return false;

  if (user.plan === "pro") return true;

  return !PRO_FEATURES.includes(feature);
}
