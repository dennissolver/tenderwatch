import { inngest } from "./client";
import { db } from "@tenderwatch/db";
import { users, matches, watches, tenders } from "@tenderwatch/db";
import { eq, and, isNull, gte } from "drizzle-orm";

export const sendDigest = inngest.createFunction(
  {
    id: "send-digest",
    retries: 2
  },
  { cron: "0 7 * * *" }, // 7 AM daily
  async ({ step }) => {
    // Get users who need daily digests
    const usersToNotify = await step.run("get-users", async () => {
      return db.query.users.findMany({
        where: eq(users.onboardingCompleted, true)
      });
    });

    let sentCount = 0;

    for (const user of usersToNotify) {
      await step.run(\`send-digest-\${user.id}\`, async () => {
        // Get user's watches with daily delivery
        const userWatches = await db.query.watches.findMany({
          where: and(
            eq(watches.userId, user.id),
            eq(watches.isActive, true),
            eq(watches.deliveryMethod, "daily")
          )
        });

        if (userWatches.length === 0) return;

        const watchIds = userWatches.map(w => w.id);

        // Get unnotified matches from past 24 hours
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // TODO: Query matches and send email
        console.log(\`Would send digest to \${user.email} for \${watchIds.length} watches\`);
        sentCount++;
      });
    }

    return { sent: sentCount };
  }
);
