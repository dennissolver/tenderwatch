import { BaseSiteAdapter, LoginResult, RegistrationParams, RegistrationResult, TenderListing, TenderDetail, SearchParams } from "./base";

export class NSWeTenderAdapter extends BaseSiteAdapter {
  get siteName() {
    return "NSW eTendering";
  }

  get siteUrl() {
    return "https://buy.nsw.gov.au";
  }

  async login(username: string, password: string): Promise<LoginResult> {
    try {
      // buy.nsw Supplier Hub — login page
      await this.navigateTo("https://suppliers.buy.nsw.gov.au/login");

      const pageTitle = await this.page.title();
      const pageUrl = this.page.url();

      try {
        await this.page.waitForSelector('input[type="password"]', { timeout: 20000 });
      } catch {
        const bodySnippet = await this.page.$eval('body', el => el.innerHTML.substring(0, 2000)).catch(() => 'N/A');
        return { success: false, error: `No password field on ${pageUrl} (title: "${pageTitle}"). HTML: ${bodySnippet.substring(0, 500)}` };
      }

      const emailField = await this.page.$('input[type="email"], input[name*="email" i], input[name*="user" i], input[id*="email" i], #email, #username');
      const passwordField = await this.page.$('input[type="password"]');

      if (!emailField || !passwordField) {
        const inputs = await this.page.$$eval('input:not([type="hidden"])', els => els.map((el) => ({ type: (el as any).type, id: el.id, name: (el as any).name, placeholder: (el as any).placeholder })));
        return { success: false, error: `Could not find login fields on ${pageUrl}. Inputs: ${JSON.stringify(inputs).substring(0, 500)}` };
      }

      await emailField.fill(username);
      await passwordField.fill(password);

      await this.page.click('button[type="submit"], input[type="submit"]');
      await this.page.waitForTimeout(3000);

      const loggedIn = await this.isLoggedIn();

      if (loggedIn) {
        const cookies = await this.page.context().cookies();
        return { success: true, sessionData: { cookies } };
      }

      const errorElement = await this.page.$(".error, .alert-danger, .message-error, [role='alert']");
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
      const logoutLink = await this.page.$('a[href*="logout"], a[href*="Logout"], a[href*="signout"], button:has-text("Sign out"), button:has-text("Log out")');
      return logoutLink !== null;
    } catch {
      return false;
    }
  }

  async register(params: RegistrationParams): Promise<RegistrationResult> {
    try {
      await this.navigateTo("https://suppliers.buy.nsw.gov.au/login/signup/supplier");

      await this.page.waitForTimeout(3000);
      try {
        await this.page.waitForSelector('input:not([type="hidden"])', { timeout: 20000 });
      } catch {
        return { success: false, error: `Registration page did not load at ${this.page.url()}` };
      }

      // Fill all available fields
      await this.fillRegistrationFields(params);

      // Check for CAPTCHA
      if (await this.detectCaptcha()) {
        return { success: false, requiresManualStep: { type: "captcha" } };
      }

      await this.page.click('button[type="submit"], input[type="submit"]').catch(() => {});
      await this.page.waitForTimeout(5000);

      if (await this.detectCaptcha()) {
        return { success: false, requiresManualStep: { type: "captcha" } };
      }

      const hasError = await this.page.$(".error, .alert-danger, .message-error, [role='alert']");
      if (hasError) {
        const errorText = await hasError.textContent();
        return { success: false, error: errorText?.trim() || "Registration failed" };
      }

      const verificationMessage = await this.page.$('text=/verify|confirmation|check your email/i');
      if (verificationMessage) {
        return { success: true, requiresVerification: true };
      }

      if (await this.isLoggedIn()) {
        const cookies = await this.page.context().cookies();
        return { success: true, sessionData: { cookies } };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Registration failed" };
    }
  }

  async search(params: SearchParams): Promise<TenderListing[]> {
    const listings: TenderListing[] = [];

    await this.navigateTo(`${this.siteUrl}/notices`);

    if (params.keywords?.length) {
      const keywordField = await this.page.$('input[name="keyword"], input[name="search"], input[type="search"], #keyword, #search');
      if (keywordField) await keywordField.fill(params.keywords.join(" "));
    }

    await this.page.click('button:has-text("Search"), input[type="submit"]');
    await this.page.waitForTimeout(5000);

    const rows = await this.page.$$("table.listing-table tbody tr, .search-results tr, .notice-item, [data-testid='notice']");

    for (const row of rows) {
      const titleEl = await row.$("td a, a.notice-title, a");
      const buyerEl = await row.$("td:nth-child(2), .buyer, .agency");
      const closesEl = await row.$("td:nth-child(3), .closing-date");

      if (titleEl) {
        const title = await titleEl.textContent();
        const href = await titleEl.getAttribute("href");
        const sourceId = href?.match(/RFTUUID=([^&]+)/i)?.[1] || href?.match(/\/notices\/([^/]+)/)?.[1] || href || "";

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
    await this.navigateTo(`${this.siteUrl}/notices/${sourceId}`);

    const title = await this.page.$eval("h1, h2, .notice-title", (el) => el.textContent?.trim() || "").catch(() => "");
    const description = await this.page.$eval(".notice-description, .description", (el) => el.textContent?.trim() || "").catch(() => "");
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
      await this.page.click('a[href*="logout"], a[href*="signout"], button:has-text("Sign out")');
      await this.page.waitForTimeout(1000);
    } catch {
      // Ignore logout errors
    }
  }
}
