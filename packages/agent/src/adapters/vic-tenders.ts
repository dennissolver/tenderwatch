import { BaseSiteAdapter, LoginResult, RegistrationParams, RegistrationResult, TenderListing, TenderDetail, SearchParams } from "./base";

export class VICTendersAdapter extends BaseSiteAdapter {
  get siteName() {
    return "VIC Tenders";
  }

  get siteUrl() {
    return "https://www.tenders.vic.gov.au";
  }

  async login(username: string, password: string): Promise<LoginResult> {
    try {
      await this.navigateTo(`${this.siteUrl}/login`);

      const pageTitle = await this.page.title();
      const pageUrl = this.page.url();

      // VIC Tenders is a SPA — wait for password field which only appears after JS renders
      try {
        await this.page.waitForSelector('input[type="password"]', { timeout: 20000 });
      } catch {
        // Dump all non-hidden inputs for diagnostics
        const inputs = await this.page.$$eval('input:not([type="hidden"])', els => els.map(el => ({ type: el.type, id: el.id, name: el.name, placeholder: el.placeholder }))).catch(() => []);
        const bodySnippet = await this.page.$eval('body', el => el.innerHTML.substring(0, 2000)).catch(() => 'N/A');
        return { success: false, error: `No password field on ${pageUrl} (title: "${pageTitle}"). Inputs: ${JSON.stringify(inputs).substring(0, 300)}. HTML: ${bodySnippet.substring(0, 300)}` };
      }

      const emailField = await this.page.$('input[type="email"], input[type="text"], input[name*="email" i], input[name*="user" i], input[id*="email" i], input[id*="user" i], #email, #username');
      const passwordField = await this.page.$('input[type="password"]');

      if (!emailField || !passwordField) {
        const inputs = await this.page.$$eval('input:not([type="hidden"])', els => els.map(el => ({ type: el.type, id: el.id, name: el.name, placeholder: el.placeholder })));
        return { success: false, error: `Could not find login fields on ${pageUrl}. Visible inputs: ${JSON.stringify(inputs).substring(0, 500)}` };
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

      const errorElement = await this.page.$(".error, .alert-danger, .field-validation-error");
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
      const logoutLink = await this.page.$('a[href*="logout"], a[href*="Logout"], a[href*="signout"]');
      return logoutLink !== null;
    } catch {
      return false;
    }
  }

  async register(params: RegistrationParams): Promise<RegistrationResult> {
    try {
      await this.navigateTo(`${this.siteUrl}/register`);

      const pageUrl = this.page.url();

      // VIC Tenders is a SPA — wait for password field which only appears after JS renders
      try {
        await this.page.waitForSelector('input[type="password"]', { timeout: 20000 });
      } catch {
        const inputs = await this.page.$$eval('input:not([type="hidden"])', els => els.map(el => ({ type: el.type, id: el.id, name: el.name }))).catch(() => []);
        const bodySnippet = await this.page.$eval('body', el => el.innerHTML.substring(0, 2000)).catch(() => 'N/A');
        return { success: false, error: `No password field on register page ${pageUrl}. Inputs: ${JSON.stringify(inputs).substring(0, 300)}. HTML: ${bodySnippet.substring(0, 300)}` };
      }

      const emailField = await this.page.$('input[type="email"], input[type="text"], input[name*="email" i], input[id*="email" i], #email');
      if (!emailField) {
        const inputs = await this.page.$$eval('input:not([type="hidden"])', els => els.map(el => ({ type: el.type, id: el.id, name: el.name })));
        return { success: false, error: `No email field on register page. Visible inputs: ${JSON.stringify(inputs).substring(0, 500)}` };
      }
      await emailField.fill(params.email);

      const passwordField = await this.page.$('input[type="password"]:first-of-type');
      if (passwordField) await passwordField.fill(params.password);

      const confirmField = await this.page.$('input[name*="confirm" i], input[name*="Confirm" i], #confirmPassword');
      if (confirmField) await confirmField.fill(params.password);

      const companyField = await this.page.$('input[name*="company" i], input[name*="organisation" i], #companyName');
      if (companyField) await companyField.fill(params.companyName);

      const termsCheckbox = await this.page.$('input[type="checkbox"]');
      if (termsCheckbox) await termsCheckbox.check();

      await this.page.click('button[type="submit"], input[type="submit"]');
      await this.page.waitForTimeout(5000);

      const hasError = await this.page.$(".error, .alert-danger, .field-validation-error");
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

    await this.navigateTo(`${this.siteUrl}/search`);

    if (params.keywords?.length) {
      const keywordField = await this.page.$('input[name="keyword"], input[name="search"], #keyword');
      if (keywordField) await keywordField.fill(params.keywords.join(" "));
    }

    await this.page.click('button:has-text("Search"), input[type="submit"]');
    await this.page.waitForTimeout(5000);

    const rows = await this.page.$$("table tbody tr, .search-results-item, .tender-item");

    for (const row of rows) {
      const titleEl = await row.$("a, .tender-title a");
      const buyerEl = await row.$(".buyer, .agency, td:nth-child(2)");
      const closesEl = await row.$(".closing-date, td:nth-child(3)");

      if (titleEl) {
        const title = await titleEl.textContent();
        const href = await titleEl.getAttribute("href");
        const sourceId = href?.match(/\/tender\/(\d+)/)?.[1] || href || "";

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

    const title = await this.page.$eval("h1, h2, .tender-title", (el) => el.textContent?.trim() || "").catch(() => "");
    const description = await this.page.$eval(".tender-description, .description", (el) => el.textContent?.trim() || "").catch(() => "");
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
      regions: ["Victoria"],
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
      await this.page.click('a[href*="logout"], a[href*="signout"]');
      await this.page.waitForTimeout(1000);
    } catch {
      // Ignore logout errors
    }
  }
}
