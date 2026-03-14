import { BaseSiteAdapter, LoginResult, RegistrationParams, RegistrationResult, TenderListing, TenderDetail, SearchParams } from "./base";

export class QLDQTendersAdapter extends BaseSiteAdapter {
  get siteName() {
    return "QLD QTenders";
  }

  get siteUrl() {
    return "https://qtenders.hpw.qld.gov.au";
  }

  async login(username: string, password: string): Promise<LoginResult> {
    try {
      await this.navigateTo(`${this.siteUrl}`);

      const pageTitle = await this.page.title();
      const pageUrl = this.page.url();

      try {
        await this.page.waitForSelector('input[type="password"]', { timeout: 20000 });
      } catch {
        const bodySnippet = await this.page.$eval('body', el => el.innerHTML.substring(0, 2000)).catch(() => 'N/A');
        return { success: false, error: `No password field on ${pageUrl} (title: "${pageTitle}"). HTML: ${bodySnippet.substring(0, 500)}` };
      }

      const usernameField = await this.page.$('input[name="username"], input[type="email"], input[name*="email" i], input[name*="user" i], #username, #email');
      const passwordField = await this.page.$('input[type="password"]');

      if (!usernameField || !passwordField) {
        const inputs = await this.page.$$eval('input:not([type="hidden"])', els => els.map((el) => ({ type: (el as any).type, id: el.id, name: (el as any).name, placeholder: (el as any).placeholder })));
        return { success: false, error: `Could not find login fields on ${pageUrl}. Inputs: ${JSON.stringify(inputs).substring(0, 500)}` };
      }

      await usernameField.fill(username);
      await passwordField.fill(password);

      await this.page.click('input[type="submit"], button[type="submit"]');
      await this.page.waitForTimeout(3000);

      const loggedIn = await this.isLoggedIn();

      if (loggedIn) {
        const cookies = await this.page.context().cookies();
        return { success: true, sessionData: { cookies } };
      }

      const errorElement = await this.page.$(".error, .alert-danger, .errorMessage");
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
      const logoutLink = await this.page.$('a[href*="logout"], a[href*="Logout"], .logout');
      return logoutLink !== null;
    } catch {
      return false;
    }
  }

  async register(params: RegistrationParams): Promise<RegistrationResult> {
    try {
      // QLD is migrating from QTenders Blazor SPA to VendorPanel-based Supplier Portal
      await this.navigateTo("https://www.supply.qld.gov.au/");

      const pageUrl = this.page.url();

      // Wait for page to load and look for register/signup options
      try {
        await this.page.waitForSelector('input[type="password"], input[type="email"], a[href*="register" i], a[href*="signup" i], button:has-text("Register"), a:has-text("Register"), a:has-text("Sign up"), a:has-text("Create account")', { timeout: 20000 });
      } catch {
        const bodySnippet = await this.page.$eval('body', el => el.innerHTML.substring(0, 2000)).catch(() => 'N/A');
        return { success: false, error: `No registration options found on QLD Supplier Portal at ${pageUrl}. HTML: ${bodySnippet.substring(0, 500)}` };
      }

      // Click register/signup link if on landing page
      const registerLink = await this.page.$('a[href*="register" i], a[href*="signup" i], a:has-text("Register"), a:has-text("Sign up"), a:has-text("Create account"), button:has-text("Register")');
      if (registerLink) {
        await registerLink.click();
        await this.page.waitForTimeout(3000);
      }

      // Wait for registration form fields
      try {
        await this.page.waitForSelector('input[type="password"], input[type="email"]', { timeout: 20000 });
      } catch {
        const bodySnippet = await this.page.$eval('body', el => el.innerHTML.substring(0, 2000)).catch(() => 'N/A');
        return { success: false, error: `No registration form on QLD Supplier Portal ${this.page.url()}. HTML: ${bodySnippet.substring(0, 500)}` };
      }

      const emailField = await this.page.$('input[type="email"], input[name*="email" i], input[id*="email" i], #email');
      if (!emailField) {
        const inputs = await this.page.$$eval('input:not([type="hidden"])', els => els.map((el) => ({ type: (el as any).type, id: el.id, name: (el as any).name })));
        return { success: false, error: `No email field on register page. Inputs: ${JSON.stringify(inputs).substring(0, 500)}` };
      }
      await emailField.fill(params.email);

      const passwordField = await this.page.$('input[type="password"]:first-of-type');
      if (passwordField) await passwordField.fill(params.password);

      const confirmField = await this.page.$('input[name*="confirm" i], input[name*="retype" i], #confirmPassword');
      if (confirmField) await confirmField.fill(params.password);

      const companyField = await this.page.$('input[name*="organisation" i], input[name*="org" i], #organisationName');
      if (companyField) await companyField.fill(params.companyName);

      if (params.abn) {
        const abnField = await this.page.$('input[name*="abn" i], #abn');
        if (abnField) await abnField.fill(params.abn);
      }

      const termsCheckbox = await this.page.$('input[type="checkbox"]');
      if (termsCheckbox) await termsCheckbox.check();

      await this.page.click('input[type="submit"], button[type="submit"]');
      await this.page.waitForTimeout(5000);

      const hasError = await this.page.$(".error, .alert-danger, .errorMessage");
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

    await this.navigateTo(`${this.siteUrl}/qtenders/search`);

    if (params.keywords?.length) {
      const keywordField = await this.page.$('input[name="keyword"], input[name="searchText"], #keyword');
      if (keywordField) await keywordField.fill(params.keywords.join(" "));
    }

    await this.page.click('input[type="submit"], button:has-text("Search")');
    await this.page.waitForTimeout(5000);

    const rows = await this.page.$$("table tbody tr, .search-results tr");

    for (const row of rows) {
      const titleEl = await row.$("td a");
      const buyerEl = await row.$("td:nth-child(2)");
      const closesEl = await row.$("td:nth-child(3)");
      const valueEl = await row.$("td:nth-child(4)");

      if (titleEl) {
        const title = await titleEl.textContent();
        const href = await titleEl.getAttribute("href");
        const sourceId = href?.match(/id=(\d+)/)?.[1] || href || "";

        listings.push({
          sourceId,
          title: title?.trim() || "",
          buyerOrg: (await buyerEl?.textContent())?.trim(),
          closesAt: closesEl ? new Date((await closesEl.textContent())?.trim() || "") : undefined,
          valueRange: (await valueEl?.textContent())?.trim(),
          url: href?.startsWith("http") ? href : `${this.siteUrl}${href}`,
        });
      }
    }

    return listings;
  }

  async fetchTenderDetail(sourceId: string): Promise<TenderDetail> {
    await this.navigateTo(`${this.siteUrl}/qtenders/tender/display?id=${sourceId}`);

    const title = await this.page.$eval("h1, h2, .tender-title", (el) => el.textContent?.trim() || "").catch(() => "");
    const description = await this.page.$eval(".tender-description, .description, .details", (el) => el.textContent?.trim() || "").catch(() => "");
    const buyerOrg = await this.page.$eval(".agency, .buyer, .department", (el) => el.textContent?.trim() || "").catch(() => "");

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
      regions: ["Queensland"],
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
