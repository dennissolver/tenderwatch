import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export type DetailLevel = "headlines" | "standard" | "deep";

export interface SummaryContext {
  watchName: string;
  companyName: string;
  keywordsMust: string[];
  keywordsBonus: string[];
  preferredSectors: string[];
  certificationsHeld: string[];
}

export async function generateSummary(
  tender: {
    title: string;
    description: string;
    fullText?: string;
    buyerOrg: string;
    closesAt?: Date;
    valueLow?: number;
    valueHigh?: number;
  },
  context: SummaryContext,
  detailLevel: DetailLevel
): Promise<string> {
  const valueStr = tender.valueLow 
    ? `$${tender.valueLow.toLocaleString()} - $${tender.valueHigh?.toLocaleString() || "TBC"}`
    : "Not specified";

  const prompts: Record<DetailLevel, string> = {
    headlines: `Summarize this tender in ONE sentence (max 20 words). Focus on: what's being procured, value range, and deadline.
    
Tender: ${tender.title}
Description: ${tender.description?.slice(0, 500)}
Buyer: ${tender.buyerOrg}
Closes: ${tender.closesAt?.toISOString() || "Not specified"}
Value: ${valueStr}

One-line summary:`,

    standard: `Create a 3-4 sentence summary of this tender for ${context.companyName}.

They're looking for: ${context.keywordsMust.join(", ")}
Bonus interests: ${context.keywordsBonus.join(", ")}
Sectors: ${context.preferredSectors.join(", ")}

Tender: ${tender.title}
Description: ${tender.description?.slice(0, 2000)}
Buyer: ${tender.buyerOrg}
Closes: ${tender.closesAt?.toISOString() || "Not specified"}
Value: ${valueStr}

Highlight what matters to THIS company. Mention any potential concerns or requirements they should know about. Be direct and actionable.`,

    deep: `Provide a detailed analysis of this tender for ${context.companyName}.

Company context:
- Looking for: ${context.keywordsMust.join(", ")}
- Also interested in: ${context.keywordsBonus.join(", ")}
- Sectors: ${context.preferredSectors.join(", ")}
- Certifications held: ${context.certificationsHeld.join(", ") || "None specified"}

Tender details:
Title: ${tender.title}
Buyer: ${tender.buyerOrg}
Closes: ${tender.closesAt?.toISOString() || "Not specified"}
Value: ${valueStr}

Full content:
${tender.fullText?.slice(0, 8000) || tender.description}

Provide:
1. Executive summary (2-3 sentences)
2. Key requirements and deliverables
3. Evaluation criteria (if mentioned)
4. Potential challenges or red flags
5. Why this might be a good/bad fit for this company
6. Recommended next steps

Be specific and actionable. Don't pad with filler.`
  };

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: detailLevel === "deep" ? 1500 : 500,
    messages: [
      {
        role: "user",
        content: prompts[detailLevel]
      }
    ]
  });

  const textContent = response.content.find(c => c.type === "text");
  return textContent?.text || "";
}
