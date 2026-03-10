import { inngest } from "./client";
import { db } from "@tenderwatch/db";
import { linkedAccounts } from "@tenderwatch/db";
import { eq } from "drizzle-orm";
import { getAdapter } from "@tenderwatch/agent";
import { encrypt } from "@tenderwatch/crypto";
import Browserbase from "@browserbasehq/sdk";
import { chromium } from "playwright";

export const validateAccount = inngest.createFunction(
  {
    id: "validate-account",
    retries: 2,
    concurrency: {
      limit: 3,
    },
  },
  { event: "account/validate" },
  async ({ event, step }) => {
    const { accountId, username, password, site, isRegistration, companyName, abn } = event.data;

    // Step 1: Encrypt and store the credentials
    const encryptedCreds = await step.run("encrypt-credentials", async () => {
      return await encrypt(password);
    });

    await step.run("store-encrypted-credentials", async () => {
      await db
        .update(linkedAccounts)
        .set({
          encryptedCredentials: encryptedCreds,
          updatedAt: new Date(),
        })
        .where(eq(linkedAccounts.id, accountId));
    });

    // Step 2: Connect to portal via Browserbase
    const result = await step.run("connect-to-portal", async () => {
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
        const adapter = getAdapter(site, browser as any, page);

        if (isRegistration) {
          // Register on the portal
          const regResult = await adapter.register({
            email: username,
            password,
            companyName: companyName || "",
            abn: abn || undefined,
          });

          if (!regResult.success) {
            return { success: false, error: regResult.error, sessionData: null };
          }

          // If registration requires verification, mark appropriately
          if (regResult.requiresVerification) {
            return { success: true, requiresVerification: true, sessionData: regResult.sessionData };
          }

          return { success: true, sessionData: regResult.sessionData };
        } else {
          // Login to existing account
          const loginResult = await adapter.login(username, password);

          if (!loginResult.success) {
            return { success: false, error: loginResult.error, sessionData: null };
          }

          return { success: true, sessionData: loginResult.sessionData };
        }
      } finally {
        await browser.close();
      }
    });

    // Step 3: Update account status based on result
    await step.run("update-account-status", async () => {
      if (result.success) {
        await db
          .update(linkedAccounts)
          .set({
            status: "connected",
            sessionData: result.sessionData || null,
            lastSyncAt: new Date(),
            lastError: null,
            updatedAt: new Date(),
          })
          .where(eq(linkedAccounts.id, accountId));
      } else {
        await db
          .update(linkedAccounts)
          .set({
            status: "error",
            lastError: (result as any).error || "Validation failed",
            updatedAt: new Date(),
          })
          .where(eq(linkedAccounts.id, accountId));
      }
    });

    return {
      accountId,
      site,
      success: result.success,
      error: (result as any).error,
    };
  }
);
