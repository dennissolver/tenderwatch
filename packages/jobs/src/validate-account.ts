import { inngest } from "./client";
import { db } from "@tenderwatch/db";
import { linkedAccounts } from "@tenderwatch/db";
import { eq } from "drizzle-orm";

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
    const { accountId, username, password, site, isRegistration, companyName, abn, acn, legalName, businessName, orgType, addressLine1, addressLine2, city, state, postcode, country, phone, contactFirstName, contactLastName, contactPosition } = event.data;

    const isRetry = password === "__USE_STORED__";

    // Step 1: Resolve the plaintext password
    const plainPassword = await step.run("resolve-credentials", async () => {
      if (isRetry) {
        // Retry: decrypt the already-stored credentials
        const [account] = await db
          .select({ encryptedCredentials: linkedAccounts.encryptedCredentials })
          .from(linkedAccounts)
          .where(eq(linkedAccounts.id, accountId));

        if (!account?.encryptedCredentials || account.encryptedCredentials === "__PENDING_ENCRYPTION__") {
          throw new Error("No stored credentials to retry — please re-link this account");
        }

        const { decrypt } = await import("@tenderwatch/crypto");
        return await decrypt(account.encryptedCredentials);
      }
      return password;
    });

    // Step 1b: Encrypt and store credentials (skip if retry — already stored)
    if (!isRetry) {
      const encryptedCreds = await step.run("encrypt-credentials", async () => {
        const { encrypt } = await import("@tenderwatch/crypto");
        return await encrypt(plainPassword);
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
    }

    // Step 2: Connect to portal via Browserbase
    const result = await step.run("connect-to-portal", async () => {
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
        const adapter = getAdapter(site, browser as any, page);

        if (isRegistration) {
          // Register on the portal
          const regResult = await adapter.register({
            email: username,
            password: plainPassword,
            companyName: companyName || "",
            abn: abn || undefined,
            acn: acn || undefined,
            legalName: legalName || undefined,
            businessName: businessName || undefined,
            orgType: orgType || undefined,
            addressLine1: addressLine1 || undefined,
            addressLine2: addressLine2 || undefined,
            city: city || undefined,
            state: state || undefined,
            postcode: postcode || undefined,
            country: country || undefined,
            phone: phone || undefined,
            contactFirstName: contactFirstName || undefined,
            contactLastName: contactLastName || undefined,
            contactPosition: contactPosition || undefined,
          });

          if (!regResult.success) {
            return { success: false, error: regResult.error, sessionData: null };
          }

          if (regResult.requiresVerification) {
            return { success: true, requiresVerification: true, sessionData: regResult.sessionData };
          }

          return { success: true, sessionData: regResult.sessionData };
        } else {
          // Login (used for non-registration and for retries of registered accounts)
          const loginResult = await adapter.login(username, plainPassword);

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
