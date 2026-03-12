export { BaseSiteAdapter } from "./adapters/base";
export type { LoginResult, RegistrationParams, RegistrationResult, TenderListing, TenderDetail, SearchParams } from "./adapters/base";
export { AusTenderAdapter } from "./adapters/austender";
export { NSWeTenderAdapter } from "./adapters/nsw-etender";
export { QLDQTendersAdapter } from "./adapters/qld-qtenders";
export { VICTendersAdapter } from "./adapters/vic-tenders";
export { SATendersAdapter } from "./adapters/sa-tenders";
export { WATendersAdapter } from "./adapters/wa-tenders";
export { TenderLinkAdapter } from "./adapters/tenderlink";

import type { Browser } from "playwright-core";
import { BaseSiteAdapter } from "./adapters/base";
import { AusTenderAdapter } from "./adapters/austender";
import { NSWeTenderAdapter } from "./adapters/nsw-etender";
import { QLDQTendersAdapter } from "./adapters/qld-qtenders";
import { VICTendersAdapter } from "./adapters/vic-tenders";
import { SATendersAdapter } from "./adapters/sa-tenders";
import { WATendersAdapter } from "./adapters/wa-tenders";
import { TenderLinkAdapter } from "./adapters/tenderlink";

export function getAdapter(site: string, browser: Browser, page: any): BaseSiteAdapter {
  switch (site) {
    case "austender":
      return new AusTenderAdapter(browser, page);
    case "nsw_etender":
      return new NSWeTenderAdapter(browser, page);
    case "qld_qtenders":
      return new QLDQTendersAdapter(browser, page);
    case "vic_tenders":
      return new VICTendersAdapter(browser, page);
    case "sa_tenders":
      return new SATendersAdapter(browser, page);
    case "wa_tenders":
      return new WATendersAdapter(browser, page);
    case "tenderlink":
      return new TenderLinkAdapter(browser, page);
    default:
      throw new Error(`Unknown site: ${site}. Supported: austender, nsw_etender, qld_qtenders, vic_tenders, sa_tenders, wa_tenders, tenderlink`);
  }
}
