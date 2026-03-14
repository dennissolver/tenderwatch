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
        keepAlive: true, // Keep alive for manual steps
        browserSettings: {
          solveCaptchas: true, // Auto-solve CAPTCHAs when possible
        },
      } as any);

      const browser = await chromium.connectOverCDP(session.connectUrl);
      const context = browser.contexts()[0];
      const page = context.pages()[0];

      let shouldCloseBrowser = true;

      try {
        const adapter = getAdapter(site, browser as any, page);

        if (isRegistration) {
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

          // Check if manual step is needed (CAPTCHA detected)
          if (!regResult.success && !regResult.requiresManualStep) {
            // Check if there's a CAPTCHA on the page
            const hasCaptcha = await adapter.detectCaptcha();
            if (hasCaptcha) {
              regResult.requiresManualStep = { type: "captcha" };
            }
          }

          if (regResult.requiresManualStep) {
            // Keep session alive and return live view URL
            shouldCloseBrowser = false;
            try {
              const liveUrls = await bb.sessions.debug(session.id);
              return {
                success: false,
                awaitingUser: true,
                manualStepType: regResult.requiresManualStep.type,
                browserbaseSessionId: session.id,
                liveViewUrl: (liveUrls as any).debuggerFullscreenUrl || (liveUrls as any).debuggerUrl || "",
              };
            } catch {
              return {
                success: false,
                awaitingUser: true,
                manualStepType: regResult.requiresManualStep.type,
                browserbaseSessionId: session.id,
                liveViewUrl: "",
              };
            }
          }

          if (regResult.requiresVerification) {
            // Email verification needed — keep session info but release browser
            return {
              success: false,
              awaitingUser: true,
              manualStepType: "email_verification",
              browserbaseSessionId: null,
              liveViewUrl: null,
            };
          }

          if (!regResult.success) {
            return { success: false, error: regResult.error, sessionData: null };
          }

          return { success: true, sessionData: regResult.sessionData };
        } else {
          // Login flow
          const loginResult = await adapter.login(username, plainPassword);

          // Check for CAPTCHA on login too
          if (!loginResult.success && !loginResult.requiresManualStep) {
            const hasCaptcha = await adapter.detectCaptcha();
            if (hasCaptcha) {
              loginResult.requiresManualStep = { type: "captcha" };
            }
          }

          if (loginResult.requiresManualStep) {
            shouldCloseBrowser = false;
            try {
              const liveUrls = await bb.sessions.debug(session.id);
              return {
                success: false,
                awaitingUser: true,
                manualStepType: loginResult.requiresManualStep.type,
                browserbaseSessionId: session.id,
                liveViewUrl: (liveUrls as any).debuggerFullscreenUrl || (liveUrls as any).debuggerUrl || "",
              };
            } catch {
              return {
                success: false,
                awaitingUser: true,
                manualStepType: loginResult.requiresManualStep.type,
                browserbaseSessionId: session.id,
                liveViewUrl: "",
              };
            }
          }

          if (!loginResult.success) {
            return { success: false, error: loginResult.error, sessionData: null };
          }

          return { success: true, sessionData: loginResult.sessionData };
        }
      } finally {
        if (shouldCloseBrowser) {
          await browser.close();
          // Release the session
          try {
            await bb.sessions.update(session.id, { status: "REQUEST_RELEASE" } as any);
          } catch {
            // Ignore release errors
          }
        }
      }
    });

    // Step 3: Update account status based on result
    await step.run("update-account-status", async () => {
      if ((result as any).awaitingUser) {
        // Manual step needed — save session info for UI embed
        await db
          .update(linkedAccounts)
          .set({
            status: "awaiting_user" as any,
            browserbaseSessionId: (result as any).browserbaseSessionId || null,
            liveViewUrl: (result as any).liveViewUrl || null,
            manualStepType: (result as any).manualStepType || null,
            lastError: null,
            updatedAt: new Date(),
          } as any)
          .where(eq(linkedAccounts.id, accountId));
      } else if (result.success) {
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
            lastError: (result as any).error || "Validation failed",
            browserbaseSessionId: null,
            liveViewUrl: null,
            manualStepType: null,
            updatedAt: new Date(),
          } as any)
          .where(eq(linkedAccounts.id, accountId));
      }
    });

    return {
      accountId,
      site,
      success: result.success,
      awaitingUser: (result as any).awaitingUser || false,
      error: (result as any).error,
    };
  }
);
