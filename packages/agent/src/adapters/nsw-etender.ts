import { BaseSiteAdapter, LoginResult, RegistrationParams, RegistrationResult, TenderListing, TenderDetail, SearchParams } from "./base";

export class NSWeTenderAdapter extends BaseSiteAdapter {
  get siteName() {
    return "NSW eTendering";
  }

  get siteUrl() {
    return "https://tenders.nsw.gov.au";
  }

  async login(username: string, password: string): Promise<LoginResult> {
    try {
      await this.navigateTo(`${this.siteUrl}/?event=public.login`);

      await this.page.waitForSelector('input[name="userid"]', { timeout: 10000 });

      await this.page.fill('input[name="userid"]', username);
      await this.page.fill('input[name="password"]', password);

      await this.page.click('input[type="submit"][value="Login"]');
      await this.page.waitForTimeout(3000);

      const loggedIn = await this.isLoggedIn();

      if (loggedIn) {
        const cookies = await this.page.context().cookies();
        return { success: true, sessionData: { cookies } };
      }

      const errorElement = await this.page.$(".error, .alert-danger, .message-error");
      const error = errorElement ? await errorElement.textContent() : "Login failed";
      return { success: false, error: error?.trim() };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async isLoggedIn(): Promise<boolean> {
    try {
      const logoutLink = await this.page.$('a[href*="logout"], a[href*="Logout"]');
      return logoutLink !== null;
    } catch {
      return false;
    }
  }

  async register(params: RegistrationParams): Promise<RegistrationResult> {
    try {
      await this.navigateTo(`${this.siteUrl}/?event=public.registrant.show`);

      await this.page.waitForSelector('input[name="email"], #email', { timeout: 10000 });

      // Fill registration fields
      const emailField = await this.page.$('input[name="email"], #email');
      if (emailField) await emailField.fill(params.email);

      const passwordField = await this.page.$('input[name="password"], #password');
      if (passwordField) await passwordField.fill(params.password);

      const confirmField = await this.page.$('input[name="confirmPassword"], input[name="password2"], #confirmPassword');
      if (confirmField) await confirmField.fill(params.password);

      const companyField = await this.page.$('input[name="organisationName"], input[name="companyName"], #organisationName');
      if (companyField) await companyField.fill(params.companyName);

      if (params.abn) {
        const abnField = await this.page.$('input[name="abn"], #abn');
        if (abnField) await abnField.fill(params.abn);
      }

      // Accept terms
      const termsCheckbox = await this.page.$('input[type="checkbox"]');
      if (termsCheckbox) await termsCheckbox.check();

      await this.page.click('input[type="submit"], button[type="submit"]');
      await this.page.waitForTimeout(5000);

      const hasError = await this.page.$(".error, .alert-danger, .message-error");
      if (hasError) {
        const errorText = await hasError.textContent();
        return { success: false, error: errorText?.trim() || "Registration failed" };
      }

      const verificationMessage = await this.page.$('text=/verify|confirmation|check your email/i');
      if (verificationMessage) {
        return { success: true, requiresVerification: true };
      }

      const loggedIn = await this.isLoggedIn();
      if (loggedIn) {
        const cookies = await this.page.context().cookies();
        return { success: true, sessionData: { cookies } };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Registration failed",
      };
    }
  }

  async search(params: SearchParams): Promise<TenderListing[]> {
    const listings: TenderListing[] = [];

    await this.navigateTo(`${this.siteUrl}/?event=public.advancedSearch.show`);

    if (params.keywords?.length) {
      const keywordField = await this.page.$('input[name="keyword"], #keyword');
      if (keywordField) await keywordField.fill(params.keywords.join(" "));
    }

    await this.page.click('input[type="submit"][value="Search"], button:has-text("Search")');
    await this.page.waitForTimeout(5000);

    const rows = await this.page.$$("table.listing-table tbody tr, .search-results tr");

    for (const row of rows) {
      const titleEl = await row.$("td a");
      const buyerEl = await row.$("td:nth-child(2)");
      const closesEl = await row.$("td:nth-child(3)");

      if (titleEl) {
        const title = await titleEl.textContent();
        const href = await titleEl.getAttribute("href");
        const sourceId = href?.match(/RFTUUID=([^&]+)/i)?.[1] || href || "";

        listings.push({
          sourceId,
          title: title?.trim() || "",
          buyerOrg: (await buyerEl?.textContent())?.trim(),
          closesAt: closesEl ? new Date((await closesEl.textContent())?.trim() || "") : undefined,
          url: href?.startsWith("http") ? href : `${this.siteUrl}${href}`,
        });
      }
    }

    return listings;
  }

  async fetchTenderDetail(sourceId: string): Promise<TenderDetail> {
    await this.navigateTo(
      `${this.siteUrl}/?event=public.rft.show&RFTUUID=${sourceId}`
    );

    const title = await this.page.$eval("h1, h2, .rft-title", (el) => el.textContent?.trim() || "").catch(() => "");
    const description = await this.page.$eval(".rft-description, .description", (el) => el.textContent?.trim() || "").catch(() => "");
    const buyerOrg = await this.page.$eval(".agency, .buyer, .organisation", (el) => el.textContent?.trim() || "").catch(() => "");

    const documentUrls: string[] = [];
    const docLinks = await this.page.$$('a[href*="download"], a[href*="document"], a[href*="attachment"]');
    for (const link of docLinks) {
      const href = await link.getAttribute("href");
      if (href) documentUrls.push(href.startsWith("http") ? href : `${this.siteUrl}${href}`);
    }

    return {
      sourceId,
      title,
      description,
      buyerOrg,
      regions: ["New South Wales"],
      categories: [],
      certificationsRequired: [],
      documentUrls,
      sourceUrl: this.page.url(),
    };
  }

  async downloadDocument(url: string, _filename: string): Promise<Buffer> {
    const response = await this.page.request.get(url);
    return Buffer.from(await response.body());
  }

  async logout(): Promise<void> {
    try {
      await this.page.click('a[href*="logout"], a[href*="Logout"]');
      await this.page.waitForTimeout(1000);
    } catch {
      // Ignore logout errors
    }
  }
}
