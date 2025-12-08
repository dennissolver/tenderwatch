export const SITES = {
  austender: {
    name: "AusTender",
    url: "https://www.tenders.gov.au",
    hasApi: true
  },
  nsw_etender: {
    name: "NSW eTendering",
    url: "https://tenders.nsw.gov.au",
    hasApi: true
  },
  qld_qtenders: {
    name: "QLD QTenders",
    url: "https://qtenders.epw.qld.gov.au",
    hasApi: false
  },
  vic_tenders: {
    name: "VIC Tenders",
    url: "https://www.tenders.vic.gov.au",
    hasApi: false
  },
  sa_tenders: {
    name: "SA Tenders",
    url: "https://www.tenders.sa.gov.au",
    hasApi: false
  },
  wa_tenders: {
    name: "WA Tenders",
    url: "https://www.tenders.wa.gov.au",
    hasApi: false
  },
  vendorpanel: {
    name: "VendorPanel",
    url: "https://www.vendorpanel.com",
    hasApi: false
  },
  tenderlink: {
    name: "TenderLink",
    url: "https://www.tenderlink.com",
    hasApi: false
  }
} as const;

export type SiteKey = keyof typeof SITES;

export const REGIONS = [
  "National",
  "New South Wales",
  "Victoria",
  "Queensland",
  "Western Australia",
  "South Australia",
  "Tasmania",
  "Northern Territory",
  "Australian Capital Territory"
] as const;

export type Region = typeof REGIONS[number];

export const TENDER_TYPES = [
  "Open Tender",
  "Select Tender",
  "Multi-Use List",
  "Panel",
  "Pre-qualification",
  "Expression of Interest",
  "Request for Quote"
] as const;

export type TenderType = typeof TENDER_TYPES[number];

export const MATCH_TIERS = ["strong", "maybe", "stretch"] as const;
export type MatchTier = typeof MATCH_TIERS[number];
