import { BaseSiteAdapter, LoginResult, RegistrationParams, RegistrationResult, TenderListing, TenderDetail, SearchParams } from "./base";

export class AusTenderAdapter extends BaseSiteAdapter {
  get siteName() {
    return "AusTender";
  }

  get siteUrl() {
    return "https://www.tenders.gov.au";
  }

  async login(username: string, password: string): Promise<LoginResult> {
    try {
      await this.navigateTo(`${this.siteUrl}/RegisteredUser/Login`);

      try {
        await this.page.waitForSelector('input[type="password"]', { timeout: 20000 });
      } catch {
        const inputs = await this.page.$$eval('input:not([type="hidden"])', els => els.map((el) => ({ type: (el as any).type, id: el.id, name: (el as any).name }))).catch(() => []);
        // Check for CAPTCHA before giving up
        if (await this.detectCaptcha()) {
          return { success: false, requiresManualStep: { type: "captcha" } };
        }
        return { success: false, error: `No password field. Inputs: ${JSON.stringify(inputs).substring(0, 300)}` };
      }

      const emailInput = await this.page.$('input[type="email"], input[name*="Email" i], #Email, #email');
      const passwordInput = await this.page.$('input[type="password"]');

      if (!emailInput || !passwordInput) {
        return { success: false, error: "Could not find login fields" };
      }

      await emailInput.fill(username);
      await passwordInput.fill(password);

      // Check for CAPTCHA before submitting
      if (await this.detectCaptcha()) {
        return { success: false, requiresManualStep: { type: "captcha" } };
      }

      await this.page.click('button[type="submit"], input[type="submit"]');
      await this.page.waitForTimeout(5000);

      if (await this.isLoggedIn()) {
        const cookies = await this.page.context().cookies();
        return { success: true, sessionData: { cookies } };
      }

      const errorElement = await this.page.$(".validation-summary-errors");
      const error = errorElement ? await errorElement.textContent() : "Login failed";
      return { success: false, error: error?.trim() };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
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

  async register(params: RegistrationParams): Promise<RegistrationResult> {
    try {
      await this.navigateTo(`${this.siteUrl}/RegisteredUser/Register`);

      // Wait for any form content to load
      await this.page.waitForTimeout(3000);
      try {
        await this.page.waitForSelector('input:not([type="hidden"])', { timeout: 20000 });
      } catch {
        return { success: false, error: `Registration page did not load at ${this.page.url()}` };
      }

      // Fill ALL available fields using the base helper
      const { filled } = await this.fillRegistrationFields(params);

      // Check for CAPTCHA — if found, return for manual step (fields are filled)
      if (await this.detectCaptcha()) {
        return { success: false, requiresManualStep: { type: "captcha" } };
      }

      // If we couldn't fill email, report error
      if (!filled.includes("email") && !filled.includes("username")) {
        const inputs = await this.page.$$eval('input:not([type="hidden"])', els =>
          els.map((el) => ({ type: (el as any).type, id: el.id, name: (el as any).name }))
        ).catch(() => []);
        return { success: false, error: `Could not find email field. Inputs: ${JSON.stringify(inputs).substring(0, 500)}` };
      }

      // Submit the form
      const submitBtn = await this.page.$('#mainContent button[type="submit"], form[action*="Register"] button[type="submit"], form[action*="Register"] input[type="submit"], button[type="submit"]');
      if (submitBtn) {
        await submitBtn.click();
      }
      await this.page.waitForTimeout(5000);

      // Check for CAPTCHA after submit attempt
      if (await this.detectCaptcha()) {
        return { success: false, requiresManualStep: { type: "captcha" } };
      }

      const hasError = await this.page.$(".validation-summary-errors, .error-message");
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
    await this.navigateTo(`${this.siteUrl}/Search/TenderSearch`);
    if (params.keywords?.length) {
      await this.page.fill("#Keywords", params.keywords.join(" "));
    }
    await this.page.click("#SearchButton");
    await this.page.waitForSelector(".search-results", { timeout: 30000 });
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
          url: `${this.siteUrl}${href}`
        });
      }
    }
    return listings;
  }

  async fetchTenderDetail(sourceId: string): Promise<TenderDetail> {
    await this.navigateTo(`${this.siteUrl}/ATM/Show/${sourceId}`);
    const title = await this.page.$eval("h1", el => el.textContent?.trim() || "").catch(() => "");
    const description = await this.page.$eval(".description", el => el.textContent?.trim() || "").catch(() => "");
    const buyerOrg = await this.page.$eval(".agency-name", el => el.textContent?.trim() || "").catch(() => "");
    const documentUrls: string[] = [];
    const docLinks = await this.page.$$(".documents a[href*='download']");
    for (const link of docLinks) {
      const href = await link.getAttribute("href");
      if (href) documentUrls.push(href.startsWith("http") ? href : `${this.siteUrl}${href}`);
    }
    return { sourceId, title, description, buyerOrg, regions: [], categories: [], certificationsRequired: [], documentUrls, sourceUrl: this.page.url() };
  }

  async downloadDocument(url: string, _filename: string): Promise<Buffer> {
    const response = await this.page.request.get(url);
    return Buffer.from(await response.body());
  }

  async logout(): Promise<void> {
    try { await this.page.click('a[href*="Logout"]'); await this.page.waitForTimeout(1000); } catch {}
  }
}
