import { inngest } from "./client";
import { db } from "@tenderwatch/db";
import { tenders, watches, matches } from "@tenderwatch/db";
import { eq } from "drizzle-orm";
import { matchTender, generateSummary } from "@tenderwatch/processor";

export const processTender = inngest.createFunction(
  {
    id: "process-tender",
    retries: 2
  },
  { event: "tender/process" },
  async ({ event, step }) => {
    const { tenderId } = event.data;

    // Get tender
    const tender = await step.run("get-tender", async () => {
      const result = await db.query.tenders.findFirst({
        where: eq(tenders.id, tenderId)
      });
      if (!result) throw new Error(`Tender not found: ${tenderId}`);
      return result;
    });

    // Get all active watches
    const activeWatches = await step.run("get-watches", async () => {
      return db.query.watches.findMany({
        where: eq(watches.isActive, true)
      });
    });

    // Match against each watch
    const matchResults = await step.run("match-watches", async () => {
      const results = [];

      for (const watch of activeWatches) {
        const matchResult = matchTender(
          {
            title: tender.title,
            description: tender.description || "",
            fullText: tender.fullText || undefined,
            regions: tender.regions || [],
            categories: tender.categories || [],
            buyerOrg: tender.buyerOrg || undefined,
            valueLow: tender.valueLow || undefined,
            valueHigh: tender.valueHigh || undefined,
            closesAt: tender.closesAt || undefined,
            certificationsRequired: tender.certificationsRequired || []
          },
          {
            keywordsMust: watch.keywordsMust || [],
            keywordsBonus: watch.keywordsBonus || [],
            keywordsExclude: watch.keywordsExclude || [],
            regions: watch.regions || [],
            valueMin: watch.valueMin || undefined,
            valueMax: watch.valueMax || undefined,
            includeUnspecifiedValue: watch.includeUnspecifiedValue ?? true,
            minResponseDays: watch.minResponseDays || undefined,
            preferredSectors: watch.preferredSectors || [],
            preferredBuyers: watch.preferredBuyers || [],
            certificationsHeld: watch.certificationsHeld || [],
            sensitivity: watch.sensitivity
          }
        );

        if (matchResult.tier !== "reject") {
          results.push({
            watchId: watch.id,
            ...matchResult
          });
        }
      }

      return results;
    });

    // Save matches and generate summaries
    for (const result of matchResults) {
      await step.run(`save-match-${result.watchId}`, async () => {
        // Get watch for summary context
        const watch = activeWatches.find(w => w.id === result.watchId)!;
        
        // Generate personalised summary if Pro user
        // TODO: Check user plan
        let summary: string | undefined;
        
        // Insert match
        await db.insert(matches).values({
          watchId: result.watchId,
          tenderId: tender.id,
          score: result.score,
          tier: result.tier,
          matchedKeywords: result.matchedKeywords,
          llmReasoning: result.reasoning,
          personalisedSummary: summary
        });
      });
    }

    return { matchCount: matchResults.length };
  }
);
