import { BaseSiteAdapter, LoginResult, TenderListing, TenderDetail, SearchParams } from "./base";

export class AusTenderAdapter extends BaseSiteAdapter {
  get siteName() {
    return "AusTender";
  }

  get siteUrl() {
    return "https://www.tenders.gov.au";
  }

  async login(username: string, password: string): Promise<LoginResult> {
    try {
      await this.navigateTo(`\${this.siteUrl}/Account/Login`);

      // Wait for login form
      await this.page.waitForSelector("#Email", { timeout: 10000 });

      // Fill credentials
      await this.page.fill("#Email", username);
      await this.page.fill("#Password", password);

      // Submit
      await this.page.click('button[type="submit"]');

      // Wait for redirect or error
      await this.page.waitForTimeout(3000);

      // Check if logged in
      const loggedIn = await this.isLoggedIn();

      if (loggedIn) {
        // Extract session cookies
        const cookies = await this.page.context().cookies();
        return {
          success: true,
          sessionData: { cookies }
        };
      }

      // Check for error message
      const errorElement = await this.page.$(".validation-summary-errors");
      const error = errorElement ? await errorElement.textContent() : "Login failed";

      return { success: false, error: error?.trim() };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  async isLoggedIn(): Promise<boolean> {
    try {
      const logoutLink = await this.page.$('a[href*="Logout"]');
      return logoutLink !== null;
    } catch {
      return false;
    }
  }

  async search(params: SearchParams): Promise<TenderListing[]> {
    const listings: TenderListing[] = [];

    // Navigate to search page
    await this.navigateTo(`\${this.siteUrl}/Search/TenderSearch`);

    // Apply filters
    if (params.keywords?.length) {
      await this.page.fill("#Keywords", params.keywords.join(" "));
    }

    // Submit search
    await this.page.click("#SearchButton");
    await this.page.waitForSelector(".search-results", { timeout: 30000 });

    // Parse results
    const rows = await this.page.$$(".search-results tbody tr");

    for (const row of rows) {
      const titleEl = await row.$("td:nth-child(1) a");
      const buyerEl = await row.$("td:nth-child(2)");
      const closesEl = await row.$("td:nth-child(4)");
      const valueEl = await row.$("td:nth-child(5)");

      if (titleEl) {
        const title = await titleEl.textContent();
        const href = await titleEl.getAttribute("href");
        const sourceId = href?.match(/ATM(\d+)/)?.[1] || "";

        listings.push({
          sourceId,
          title: title?.trim() || "",
          buyerOrg: (await buyerEl?.textContent())?.trim(),
          closesAt: closesEl ? new Date((await closesEl.textContent())?.trim() || "") : undefined,
          valueRange: (await valueEl?.textContent())?.trim(),
          url: `\${this.siteUrl}\${href}`
        });
      }
    }

    return listings;
  }

  async fetchTenderDetail(sourceId: string): Promise<TenderDetail> {
    await this.navigateTo(`\${this.siteUrl}/ATM/Show/\${sourceId}`);

    // Extract details from page
    const title = await this.page.$eval("h1", el => el.textContent?.trim() || "");
    const description = await this.page.$eval(".description", el => el.textContent?.trim() || "").catch(() => "");
    const buyerOrg = await this.page.$eval(".agency-name", el => el.textContent?.trim() || "").catch(() => "");

    // Extract document links
    const documentUrls: string[] = [];
    const docLinks = await this.page.$$(".documents a[href*='download']");
    for (const link of docLinks) {
      const href = await link.getAttribute("href");
      if (href) documentUrls.push(href.startsWith("http") ? href : `\${this.siteUrl}\${href}`);
    }

    return {
      sourceId,
      title,
      description,
      buyerOrg,
      regions: [],
      categories: [],
      certificationsRequired: [],
      documentUrls,
      sourceUrl: this.page.url()
    };
  }

  async downloadDocument(url: string, filename: string): Promise<Buffer> {
    const response = await this.page.request.get(url);
    return Buffer.from(await response.body());
  }

  async logout(): Promise<void> {
    try {
      await this.page.click('a[href*="Logout"]');
      await this.page.waitForTimeout(1000);
    } catch {
      // Ignore logout errors
    }
  }
}
