import { NextRequest, NextResponse } from "next/server";

/**
 * Scrapes the ABR public page to look up ABN details.
 * No API key / GUID required — uses the public HTML view.
 * GET /api/abn-lookup?abn=12345678901
 */
export async function GET(req: NextRequest) {
  const abn = req.nextUrl.searchParams.get("abn")?.replace(/\s/g, "");

  if (!abn || !/^\d{11}$/.test(abn)) {
    return NextResponse.json(
      { error: "ABN must be exactly 11 digits" },
      { status: 400 }
    );
  }

  try {
    const url = `https://abr.business.gov.au/ABN/View?abn=${abn}`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    const html = await res.text();

    // Check if ABN exists
    if (html.includes("No records found") || html.includes("is not a valid ABN")) {
      return NextResponse.json(
        { error: "ABN not found" },
        { status: 404 }
      );
    }

    // Extract entity name
    const entityNameMatch = html.match(
      /itemprop="legalName"[^>]*>([^<]+)</
    );
    const entityName = entityNameMatch?.[1]?.trim() || "";

    // Extract ABN status (Active / Cancelled)
    const statusMatch = html.match(
      /ABN status:<\/th>\s*<td>\s*(\w+)/
    );
    const abnStatus = statusMatch?.[1]?.trim() || "";

    // Extract entity type
    const typeMatch = html.match(
      /Entity type:<\/th>\s*<td>\s*(?:<[^>]*>\s*)*([^<]+)/s
    );
    const entityType = typeMatch?.[1]?.trim() || "";

    // Extract location (e.g. "QLD 4006")
    const locationMatch = html.match(
      /itemprop="addressLocality"[^>]*>([^<]+)</
    );
    const location = locationMatch?.[1]?.trim() || "";
    const locParts = location.match(/^(\w+)\s+(\d{4})$/);
    const state = locParts?.[1] || "";
    const postcode = locParts?.[2] || "";

    // Extract ACN if present
    const acnMatch = html.match(
      />\s*(\d{3}\s*\d{3}\s*\d{3})\s*<a[^>]*connectonline\.asic/
    );
    const acn = acnMatch?.[1]?.replace(/\s/g, "") || "";

    // Extract business/trading names
    const businessNames: string[] = [];
    const bnSection = html.match(
      /Business name[s]?.*?<table[^>]*>(.*?)<\/table>/s
    );
    if (bnSection) {
      const nameMatches = bnSection[1].matchAll(/<td[^>]*>([A-Z][^<]+)<\/td>/g);
      for (const m of nameMatches) {
        const name = m[1].trim();
        if (name && !name.match(/^\d/) && name.length > 2) {
          businessNames.push(name);
        }
      }
    }

    if (!entityName) {
      return NextResponse.json(
        { error: "Could not parse ABN details" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      abn,
      abnStatus,
      entityName,
      entityType,
      acn,
      businessNames,
      state,
      postcode,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to look up ABN" },
      { status: 500 }
    );
  }
}
