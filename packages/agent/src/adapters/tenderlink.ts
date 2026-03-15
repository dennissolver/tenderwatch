import { BaseSiteAdapter, LoginResult, RegistrationParams, RegistrationResult, TenderListing, TenderDetail, SearchParams } from "./base";

export class TenderLinkAdapter extends BaseSiteAdapter {
  get siteName() {
    return "TenderLink";
  }

  get siteUrl() {
    return "https://illion.tenderlink.com";
  }

  async login(username: string, password: string): Promise<LoginResult> {
    try {
      // TenderLink login is on portal subdomain
      await this.navigateTo("https://portal.tenderlink.com/notification/index.html");

      const pageTitle = await this.page.title();
      const pageUrl = this.page.url();

      try {
        await this.page.waitForSelector('input[type="password"]', { timeout: 20000 });
      } catch {
        const bodySnippet = await this.page.$eval('body', el => el.innerHTML.substring(0, 2000)).catch(() => 'N/A');
        return { success: false, error: `No password field on ${pageUrl} (title: "${pageTitle}"). HTML: ${bodySnippet.substring(0, 500)}` };
      }

      const emailField = await this.page.$('input[type="email"], input[name*="email" i], input[id*="email" i], #email');
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

      const errorElement = await this.page.$(".error, .alert-danger, .alert-error, .login-error");
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
      const logoutLink = await this.page.$('a[href*="logout"], a[href*="sign-out"], .user-menu, .account-menu');
      return logoutLink !== null;
    } catch {
      return false;
    }
  }

  async register(params: RegistrationParams): Promise<RegistrationResult> {
    try {
      // TenderLink subscribe page (paid service)
      await this.navigateTo(`${this.siteUrl}/subscribe-online/`);

      await this.page.waitForTimeout(3000);

      // Look for a plan selection or registration form
      const selectBtn = await this.page.$('a:has-text("Select"), button:has-text("Select"), a:has-text("Continue"), button:has-text("Continue")');
      if (selectBtn) {
        await selectBtn.click();
        await this.page.waitForTimeout(3000);
      }

      try {
        await this.page.waitForSelector('input:not([type="hidden"])', { timeout: 20000 });
      } catch {
        return { success: false, error: `TenderLink registration form did not load at ${this.page.url()}` };
      }

      // Fill all available fields
      await this.fillRegistrationFields(params);

      if (await this.detectCaptcha()) {
        return { success: false, requiresManualStep: { type: "captcha" } };
      }

      await this.page.click('button[type="submit"], input[type="submit"]').catch(() => {});
      await this.page.waitForTimeout(5000);

      if (await this.detectCaptcha()) {
        return { success: false, requiresManualStep: { type: "captcha" } };
      }

      const hasError = await this.page.$(".error, .alert-danger, .alert-error");
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
      return {
        success: false,
        error: error instanceof Error ? error.message : "Registration failed",
      };
    }
  }

  async search(params: SearchParams): Promise<TenderListing[]> {
    const listings: TenderListing[] = [];

    await this.navigateTo(`${this.siteUrl}/search`);

    if (params.keywords?.length) {
      const keywordField = await this.page.$('input[name="keyword"], input[name="search"], input[type="search"], #keyword');
      if (keywordField) await keywordField.fill(params.keywords.join(" "));
    }

    await this.page.click('button:has-text("Search"), input[type="submit"]');
    await this.page.waitForTimeout(5000);

    const items = await this.page.$$(".tender-item, .search-result, table tbody tr");

    for (const item of items) {
      const titleEl = await item.$("a, .tender-title a, .title");
      const buyerEl = await item.$(".buyer, .organisation, td:nth-child(2)");
      const closesEl = await item.$(".closing-date, .close-date, td:nth-child(3)");

      if (titleEl) {
        const title = await titleEl.textContent();
        const href = await titleEl.getAttribute("href");
        const sourceId = href?.match(/\/tender\/([^/]+)/)?.[1] || href || "";

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
    await this.navigateTo(`${this.siteUrl}/tender/${sourceId}`);

    const title = await this.page.$eval("h1, .tender-title", (el) => el.textContent?.trim() || "").catch(() => "");
    const description = await this.page.$eval(".tender-description, .description", (el) => el.textContent?.trim() || "").catch(() => "");
    const buyerOrg = await this.page.$eval(".buyer, .organisation", (el) => el.textContent?.trim() || "").catch(() => "");

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
      regions: [],
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
      await this.page.click('a[href*="logout"], a[href*="sign-out"]');
      await this.page.waitForTimeout(1000);
    } catch {
      // Ignore logout errors
    }
  }
}
