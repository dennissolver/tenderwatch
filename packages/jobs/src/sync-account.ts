import { inngest } from "./client";
import { db } from "@tenderwatch/db";
import { linkedAccounts, tenders } from "@tenderwatch/db";
import { eq } from "drizzle-orm";

export const syncAccount = inngest.createFunction(
  {
    id: "sync-account",
    retries: 3,
    concurrency: {
      limit: 5,
    },
  },
  { event: "account/sync" },
  async ({ event, step }) => {
    const { accountId } = event.data;

    // Get account details
    const account = await step.run("get-account", async () => {
      const result = await db.query.linkedAccounts.findFirst({
        where: eq(linkedAccounts.id, accountId),
      });
      if (!result) throw new Error(`Account not found: ${accountId}`);
      return result;
    });

    // Decrypt credentials
    const password = await step.run("decrypt-credentials", async () => {
      const { decrypt } = await import("@tenderwatch/crypto");
      return decrypt(account.encryptedCredentials);
    });

    // Spin up browser and sync tenders
    const discoveredTenders = await step.run("sync-portal", async () => {
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

        // Login with stored credentials
        const loginResult = await adapter.login(account.siteUsername, password);
        if (!loginResult.success) {
          throw new Error(`Login failed for ${account.site}: ${loginResult.error}`);
        }

        // Search for recent tenders (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const listings = await adapter.search({
          publishedAfter: sevenDaysAgo,
        });

        // Fetch details for each new tender
        const newTenders = [];
        for (const listing of listings.slice(0, 50)) {
          // Check if tender already exists
          const existing = await db.query.tenders.findFirst({
            where: eq(tenders.sourceId, listing.sourceId),
          });

          if (!existing) {
            const detail = await adapter.fetchTenderDetail(listing.sourceId);
            newTenders.push({
              source: account.site,
              sourceId: listing.sourceId,
              sourceUrl: detail.sourceUrl,
              title: detail.title,
              description: detail.description,
              fullText: detail.fullText || null,
              buyerOrg: detail.buyerOrg,
              regions: detail.regions,
              categories: detail.categories,
              tenderType: detail.tenderType || null,
              valueLow: detail.valueLow || null,
              valueHigh: detail.valueHigh || null,
              publishedAt: detail.publishedAt || null,
              closesAt: detail.closesAt || null,
              briefingAt: detail.briefingAt || null,
              certificationsRequired: detail.certificationsRequired,
              documentUrls: detail.documentUrls,
            });
          }
        }

        // Update session data
        const cookies = await context.cookies();

        await db
          .update(linkedAccounts)
          .set({
            sessionData: { cookies },
            updatedAt: new Date(),
          })
          .where(eq(linkedAccounts.id, accountId));

        await adapter.logout();
        return newTenders;
      } finally {
        await browser.close();
      }
    });

    // Insert discovered tenders
    const insertedTenders = await step.run("insert-tenders", async () => {
      const inserted = [];
      for (const tender of discoveredTenders) {
        const [result] = await db
          .insert(tenders)
          .values(tender as any)
          .returning({ id: tenders.id });
        if (result) inserted.push(result);
      }
      return inserted;
    });

    // Update account status
    await step.run("update-status", async () => {
      await db
        .update(linkedAccounts)
        .set({
          lastSyncAt: new Date(),
          status: "connected",
          lastError: null,
          updatedAt: new Date(),
        })
        .where(eq(linkedAccounts.id, accountId));
    });

    // Trigger processing for each new tender
    for (const tender of insertedTenders) {
      await step.sendEvent("queue-processing", {
        name: "tender/process",
        data: { tenderId: tender.id, accountId },
      });
    }

    return { discovered: insertedTenders.length };
  }
);
