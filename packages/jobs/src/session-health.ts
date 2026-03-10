import { inngest } from "./client";
import { db } from "@tenderwatch/db";
import { linkedAccounts } from "@tenderwatch/db";
import { eq, and, inArray } from "drizzle-orm";

export const sessionHealthCheck = inngest.createFunction(
  {
    id: "session-health-check",
    retries: 1,
    concurrency: {
      limit: 3,
    },
  },
  { cron: "*/30 * * * *" }, // Every 30 minutes
  async ({ step }) => {
    // Get all connected accounts that need health checks
    const activeAccounts = await step.run("get-active-accounts", async () => {
      return db.query.linkedAccounts.findMany({
        where: inArray(linkedAccounts.status, ["connected", "pending"]),
      });
    });

    let healthy = 0;
    let expired = 0;
    let errors = 0;

    for (const account of activeAccounts) {
      await step.run(`check-${account.id}`, async () => {
        try {
          // Check session age — if last sync was more than 24 hours ago,
          // the session is likely stale and needs refresh
          const lastSync = account.lastSyncAt
            ? new Date(account.lastSyncAt).getTime()
            : 0;
          const hoursSinceSync = (Date.now() - lastSync) / (1000 * 60 * 60);

          if (hoursSinceSync > 24) {
            // Session is stale — trigger a re-sync which will re-authenticate
            await inngest.send({
              name: "account/sync",
              data: { accountId: account.id },
            });
            return;
          }

          // TODO: When Browserbase is integrated, perform a lightweight
          // session validation here:
          // 1. Restore session cookies from account.sessionData
          // 2. Navigate to a profile/dashboard page
          // 3. Check if still authenticated (isLoggedIn())
          // 4. If expired, re-authenticate with stored credentials
          // 5. Update session data and status

          // For now, mark as healthy if recently synced
          healthy++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Health check failed";

          // Check if this is an auth failure
          const isAuthError =
            errorMessage.includes("login") ||
            errorMessage.includes("auth") ||
            errorMessage.includes("session") ||
            errorMessage.includes("401") ||
            errorMessage.includes("403");

          if (isAuthError) {
            // Mark as expired — user will see this in their dashboard
            await db
              .update(linkedAccounts)
              .set({
                status: "expired",
                lastError: `Session expired: ${errorMessage}`,
                updatedAt: new Date(),
              })
              .where(eq(linkedAccounts.id, account.id));
            expired++;
          } else {
            // Transient error — mark as error but don't lose the session
            await db
              .update(linkedAccounts)
              .set({
                status: "error",
                lastError: errorMessage,
                updatedAt: new Date(),
              })
              .where(eq(linkedAccounts.id, account.id));
            errors++;
          }
        }
      });
    }

    return {
      checked: activeAccounts.length,
      healthy,
      expired,
      errors,
    };
  }
);
