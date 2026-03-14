import { inngest } from "./client";
import { db } from "@tenderwatch/db";
import { linkedAccounts } from "@tenderwatch/db";
import { eq, inArray, and, lt } from "drizzle-orm";

export const sessionHealthCheck = inngest.createFunction(
  {
    id: "session-health-check",
    retries: 1,
    concurrency: {
      limit: 2,
    },
  },
  { cron: "0 */12 * * *" }, // Every 12 hours
  async ({ step }) => {
    // Step 1: Clean up stale awaiting_user sessions (older than 30 min)
    await step.run("cleanup-stale-sessions", async () => {
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);

      const staleAccounts = await db.query.linkedAccounts.findMany({
        where: and(
          eq(linkedAccounts.status, "awaiting_user" as any),
          lt(linkedAccounts.updatedAt, thirtyMinAgo)
        ),
      });

      const Browserbase = (await import("@browserbasehq/sdk")).default;
      const bb = new Browserbase({
        apiKey: process.env.BROWSERBASE_API_KEY!,
      });

      for (const account of staleAccounts) {
        const bbSessionId = (account as any).browserbaseSessionId;
        if (bbSessionId) {
          try {
            await bb.sessions.update(bbSessionId, { status: "REQUEST_RELEASE" } as any);
          } catch {
            // Session may already be released
          }
        }

        await db
          .update(linkedAccounts)
          .set({
            status: "error",
            lastError: "Manual step timed out. Please try again.",
            browserbaseSessionId: null,
            liveViewUrl: null,
            manualStepType: null,
            updatedAt: new Date(),
          } as any)
          .where(eq(linkedAccounts.id, account.id));
      }

      return { cleaned: staleAccounts.length };
    });

    // Step 2: Get all connected accounts for health check
    const activeAccounts = await step.run("get-active-accounts", async () => {
      return db.query.linkedAccounts.findMany({
        where: eq(linkedAccounts.status, "connected"),
      });
    });

    let healthy = 0;
    let refreshed = 0;
    let expired = 0;

    // Step 3: Check each connected account via Browserbase
    for (const account of activeAccounts) {
      await step.run(`heartbeat-${account.id}`, async () => {
        try {
          const Browserbase = (await import("@browserbasehq/sdk")).default;
          const { chromium } = await import("playwright-core");
          const { getAdapter } = await import("@tenderwatch/agent");

          const bb = new Browserbase({
            apiKey: process.env.BROWSERBASE_API_KEY!,
          });

          const session = await bb.sessions.create({
            projectId: process.env.BROWSERBASE_PROJECT_ID!,
          });

          const browser = await chromium.connectOverCDP(session.connectUrl);
          const context = browser.contexts()[0];
          const page = context.pages()[0];

          try {
            const adapter = getAdapter(account.site, browser as any, page);

            // Restore cookies if we have session data
            if (account.sessionData && typeof account.sessionData === "object") {
              const cookies = (account.sessionData as any).cookies;
              if (Array.isArray(cookies) && cookies.length > 0) {
                await context.addCookies(cookies);
              }
            }

            // Navigate to the portal and check if logged in
            await adapter.navigateTo(adapter.siteUrl);
            const isLoggedIn = await adapter.isLoggedIn();

            if (isLoggedIn) {
              // Session is still valid — update sync time and fresh cookies
              const freshCookies = await context.cookies();
              await db
                .update(linkedAccounts)
                .set({
                  sessionData: { cookies: freshCookies },
                  lastSyncAt: new Date(),
                  updatedAt: new Date(),
                } as any)
                .where(eq(linkedAccounts.id, account.id));
              healthy++;
            } else {
              // Session expired — try re-login with stored credentials
              const { decrypt } = await import("@tenderwatch/crypto");
              const plainPassword = await decrypt(account.encryptedCredentials);

              const loginResult = await adapter.login(account.siteUsername, plainPassword);

              if (loginResult.success) {
                await db
                  .update(linkedAccounts)
                  .set({
                    sessionData: loginResult.sessionData || null,
                    lastSyncAt: new Date(),
                    lastError: null,
                    updatedAt: new Date(),
                  } as any)
                  .where(eq(linkedAccounts.id, account.id));
                refreshed++;
              } else {
                await db
                  .update(linkedAccounts)
                  .set({
                    status: "expired",
                    lastError: `Session expired, re-login failed: ${loginResult.error || "unknown"}`,
                    updatedAt: new Date(),
                  })
                  .where(eq(linkedAccounts.id, account.id));
                expired++;
              }
            }
          } finally {
            await browser.close();
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Health check failed";
          await db
            .update(linkedAccounts)
            .set({
              status: "error",
              lastError: `Heartbeat failed: ${errorMessage}`,
              updatedAt: new Date(),
            })
            .where(eq(linkedAccounts.id, account.id));
          expired++;
        }
      });
    }

    return {
      checked: activeAccounts.length,
      healthy,
      refreshed,
      expired,
    };
  }
);
