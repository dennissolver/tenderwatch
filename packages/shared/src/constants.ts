export const SITES = {
  austender: {
    name: "AusTender",
    url: "https://www.tenders.gov.au",
    hasApi: true,
    description: "Federal government tenders and contracts",
    region: "National" as const,
    registrationUrl: "https://www.tenders.gov.au/Account/Register",
    requiredFields: ["email", "password", "companyName", "abn"] as const,
  },
  nsw_etender: {
    name: "NSW eTendering",
    url: "https://tenders.nsw.gov.au",
    hasApi: true,
    description: "New South Wales government procurement",
    region: "New South Wales" as const,
    registrationUrl: "https://tenders.nsw.gov.au/?event=public.registrant.show",
    requiredFields: ["email", "password", "companyName", "abn"] as const,
  },
  qld_qtenders: {
    name: "QLD QTenders",
    url: "https://qtenders.epw.qld.gov.au",
    hasApi: false,
    description: "Queensland government tenders",
    region: "Queensland" as const,
    registrationUrl: "https://qtenders.epw.qld.gov.au/qtenders/registration/newOrganisation.do",
    requiredFields: ["email", "password", "companyName", "abn"] as const,
  },
  vic_tenders: {
    name: "VIC Tenders",
    url: "https://www.tenders.vic.gov.au",
    hasApi: false,
    description: "Victorian government purchasing and tenders",
    region: "Victoria" as const,
    registrationUrl: "https://www.tenders.vic.gov.au/register",
    requiredFields: ["email", "password", "companyName"] as const,
  },
  sa_tenders: {
    name: "SA Tenders",
    url: "https://www.tenders.sa.gov.au",
    hasApi: false,
    description: "South Australian government tenders",
    region: "South Australia" as const,
    registrationUrl: "https://www.tenders.sa.gov.au/register",
    requiredFields: ["email", "password", "companyName", "abn"] as const,
  },
  wa_tenders: {
    name: "WA Tenders",
    url: "https://www.tenders.wa.gov.au",
    hasApi: false,
    description: "Western Australian government tenders",
    region: "Western Australia" as const,
    registrationUrl: "https://www.tenders.wa.gov.au/watenders/registration/newOrganisation.do",
    requiredFields: ["email", "password", "companyName", "abn"] as const,
  },
  vendorpanel: {
    name: "VendorPanel",
    url: "https://www.vendorpanel.com",
    hasApi: false,
    description: "Local government and enterprise procurement panels",
    region: "National" as const,
    registrationUrl: "https://www.vendorpanel.com/register",
    requiredFields: ["email", "password", "companyName"] as const,
  },
  tenderlink: {
    name: "TenderLink",
    url: "https://www.tenderlink.com",
    hasApi: false,
    description: "Australia's largest tender notification service",
    region: "National" as const,
    registrationUrl: "https://www.tenderlink.com/register",
    requiredFields: ["email", "password", "companyName"] as const,
  },
} as const;

export const PORTAL_ORDER: SiteKey[] = [
  "austender",
  "nsw_etender",
  "qld_qtenders",
  "vic_tenders",
  "sa_tenders",
  "wa_tenders",
  "vendorpanel",
  "tenderlink",
];

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
