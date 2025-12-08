import { inngest } from "./client";
import { db } from "@tenderwatch/db";
import { linkedAccounts, tenders } from "@tenderwatch/db";
import { eq } from "drizzle-orm";
import { getAdapter } from "@tenderwatch/agent";
import { decrypt } from "@tenderwatch/crypto";

export const syncAccount = inngest.createFunction(
  {
    id: "sync-account",
    retries: 3,
    concurrency: {
      limit: 5 // Max 5 accounts syncing at once
    }
  },
  { event: "account/sync" },
  async ({ event, step }) => {
    const { accountId } = event.data;

    // Get account details
    const account = await step.run("get-account", async () => {
      const result = await db.query.linkedAccounts.findFirst({
        where: eq(linkedAccounts.id, accountId)
      });
      if (!result) throw new Error(`Account not found: ${accountId}`);
      return result;
    });

    // Decrypt credentials
    const credentials = await step.run("decrypt-credentials", async () => {
      return decrypt(account.encryptedCredentials);
    });

    // Spin up browser and sync
    const discoveredTenders = await step.run("sync-portal", async () => {
      // TODO: Initialize Browserbase session
      // const browser = await browserbase.connect();
      // const page = await browser.newPage();
      // const adapter = getAdapter(account.site, browser, page);
      
      // For now, return empty array
      console.log(`Would sync ${account.site} for user ${account.userId}`);
      return [];
    });

    // Update account status
    await step.run("update-status", async () => {
      await db.update(linkedAccounts)
        .set({
          lastSyncAt: new Date(),
          status: "connected",
          lastError: null,
          updatedAt: new Date()
        })
        .where(eq(linkedAccounts.id, accountId));
    });

    // Trigger processing for each new tender
    for (const tender of discoveredTenders) {
      await step.sendEvent("queue-processing", {
        name: "tender/process",
        data: { tenderId: tender.id, accountId }
      });
    }

    return { discovered: discoveredTenders.length };
  }
);
