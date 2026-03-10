import { BaseSiteAdapter, LoginResult, RegistrationParams, RegistrationResult, TenderListing, TenderDetail, SearchParams } from "./base";

export class TenderLinkAdapter extends BaseSiteAdapter {
  get siteName() {
    return "TenderLink";
  }

  get siteUrl() {
    return "https://www.tenderlink.com";
  }

  async login(username: string, password: string): Promise<LoginResult> {
    try {
      await this.navigateTo(`${this.siteUrl}/login`);

      await this.page.waitForSelector('input[name="email"], input[type="email"], #email', { timeout: 10000 });

      const emailField = await this.page.$('input[name="email"], input[type="email"], #email');
      if (emailField) await emailField.fill(username);

      const passwordField = await this.page.$('input[name="password"], #password');
      if (passwordField) await passwordField.fill(password);

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
      await this.navigateTo(`${this.siteUrl}/register`);

      await this.page.waitForSelector('input[name="email"], input[type="email"], #email', { timeout: 10000 });

      const emailField = await this.page.$('input[name="email"], input[type="email"], #email');
      if (emailField) await emailField.fill(params.email);

      const passwordField = await this.page.$('input[name="password"], #password');
      if (passwordField) await passwordField.fill(params.password);

      const confirmField = await this.page.$('input[name="password_confirmation"], input[name="confirmPassword"], #password_confirmation');
      if (confirmField) await confirmField.fill(params.password);

      const companyField = await this.page.$('input[name="company"], input[name="organisation"], input[name="companyName"], #company');
      if (companyField) await companyField.fill(params.companyName);

      const termsCheckbox = await this.page.$('input[type="checkbox"]');
      if (termsCheckbox) await termsCheckbox.check();

      await this.page.click('button[type="submit"], input[type="submit"]');
      await this.page.waitForTimeout(5000);

      const hasError = await this.page.$(".error, .alert-danger, .alert-error");
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
