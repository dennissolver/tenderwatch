import { inngest } from "./client";
import { db } from "@tenderwatch/db";
import { linkedAccounts } from "@tenderwatch/db";
import { eq } from "drizzle-orm";

export const completeManualStep = inngest.createFunction(
  {
    id: "complete-manual-step",
    retries: 1,
    concurrency: {
      limit: 3,
    },
  },
  { event: "account/complete-manual-step" },
  async ({ event, step }) => {
    const { accountId } = event.data;

    // Step 1: Get account details
    const account = await step.run("get-account", async () => {
      const [row] = await db
        .select()
        .from(linkedAccounts)
        .where(eq(linkedAccounts.id, accountId));
      return row;
    });

    if (!account) {
      throw new Error("Account not found");
    }

    const bbSessionId = (account as any).browserbaseSessionId;
    const manualStepType = (account as any).manualStepType;

    // Step 2: Check if manual step was completed
    const result = await step.run("verify-completion", async () => {
      const Browserbase = (await import("@browserbasehq/sdk")).default;
      const { chromium } = await import("playwright-core");
      const { getAdapter } = await import("@tenderwatch/agent");

      const bb = new Browserbase({
        apiKey: process.env.BROWSERBASE_API_KEY!,
      });

      // For email verification: try logging in with stored credentials
      if (manualStepType === "email_verification" || !bbSessionId) {
        // Decrypt credentials and try login
        const { decrypt } = await import("@tenderwatch/crypto");
        const plainPassword = await decrypt(account.encryptedCredentials);

        const session = await bb.sessions.create({
          projectId: process.env.BROWSERBASE_PROJECT_ID!,
        });

        const browser = await chromium.connectOverCDP(session.connectUrl);
        const context = browser.contexts()[0];
        const page = context.pages()[0];

        try {
          const adapter = getAdapter(account.site, browser as any, page);
          const loginResult = await adapter.login(account.siteUsername, plainPassword);

          if (loginResult.success) {
            return { success: true, sessionData: loginResult.sessionData };
          }

          return { success: false, error: loginResult.error || "Login failed — email may not be verified yet" };
        } finally {
          await browser.close();
        }
      }

      // For CAPTCHA: reconnect to the existing session and check result
      try {
        const sessionInfo = await bb.sessions.retrieve(bbSessionId);
        const browser = await chromium.connectOverCDP((sessionInfo as any).connectUrl);
        const context = browser.contexts()[0];
        const page = context.pages()[0];

        try {
          const adapter = getAdapter(account.site, browser as any, page);

          // Check if we're now logged in (CAPTCHA was solved + form submitted)
          const loggedIn = await adapter.isLoggedIn();
          if (loggedIn) {
            const cookies = await page.context().cookies();
            return { success: true, sessionData: { cookies } };
          }

          // Check for verification message
          const verifyMsg = await page.$('text=/verify|confirmation|check your email/i');
          if (verifyMsg) {
            return { success: false, error: "Email verification required — check your inbox" };
          }

          return { success: false, error: "Manual step not yet completed. Please complete the action in the browser window above." };
        } finally {
          await browser.close();
          // Release the session
          try {
            await bb.sessions.update(bbSessionId, { status: "REQUEST_RELEASE" } as any);
          } catch {
            // Ignore
          }
        }
      } catch (e) {
        // Session may have expired
        return { success: false, error: `Browser session expired. Please retry. (${e instanceof Error ? e.message : "unknown"})` };
      }
    });

    // Step 3: Update account status
    await step.run("update-status", async () => {
      if (result.success) {
        await db
          .update(linkedAccounts)
          .set({
            status: "connected",
            sessionData: (result as any).sessionData || null,
            lastSyncAt: new Date(),
            lastError: null,
            browserbaseSessionId: null,
            liveViewUrl: null,
            manualStepType: null,
            updatedAt: new Date(),
          } as any)
          .where(eq(linkedAccounts.id, accountId));
      } else {
        await db
          .update(linkedAccounts)
          .set({
            status: "error",
            lastError: (result as any).error || "Manual step failed",
            browserbaseSessionId: null,
            liveViewUrl: null,
            manualStepType: null,
            updatedAt: new Date(),
          } as any)
          .where(eq(linkedAccounts.id, accountId));
      }
    });

    return { accountId, success: result.success, error: (result as any).error };
  }
);
