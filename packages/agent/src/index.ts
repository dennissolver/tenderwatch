export { BaseSiteAdapter } from "./adapters/base";
export type { LoginResult, TenderListing, TenderDetail, SearchParams } from "./adapters/base";
export { AusTenderAdapter } from "./adapters/austender";

// TODO: Add more adapters
// export { NSWeTenderAdapter } from "./adapters/nsw-etender";
// export { QLDTendersAdapter } from "./adapters/qld-qtenders";
// export { VICTendersAdapter } from "./adapters/vic-tenders";

import { Browser } from "playwright";
import { BaseSiteAdapter } from "./adapters/base";
import { AusTenderAdapter } from "./adapters/austender";

export function getAdapter(site: string, browser: Browser, page: any): BaseSiteAdapter {
  switch (site) {
    case "austender":
      return new AusTenderAdapter(browser, page);
    // TODO: Add more cases
    default:
      throw new Error(\`Unknown site: \${site}\`);
  }
}
