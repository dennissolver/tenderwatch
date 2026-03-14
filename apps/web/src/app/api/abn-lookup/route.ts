import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy to the ABR (Australian Business Register) public JSON endpoint.
 * Strips the JSONP wrapper and returns clean JSON.
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
    const url = `https://abr.business.gov.au/json/AbnDetails.aspx?abn=${abn}&callback=cb`;
    const res = await fetch(url, { next: { revalidate: 86400 } }); // cache 24h
    const text = await res.text();

    // Strip JSONP wrapper: cb({...})
    const jsonStr = text.replace(/^cb\(/, "").replace(/\)$/, "");
    const data = JSON.parse(jsonStr);

    if (data.Abn) {
      return NextResponse.json({
        abn: data.Abn,
        abnStatus: data.AbnStatus,
        entityName: data.EntityName || "",
        entityType: data.EntityTypeName || "",
        businessNames: (data.BusinessName || []).map(
          (b: string) => b
        ),
        state: data.AddressState || "",
        postcode: data.AddressPostcode || "",
      });
    }

    return NextResponse.json(
      { error: data.Message || "ABN not found" },
      { status: 404 }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to look up ABN" },
      { status: 500 }
    );
  }
}
