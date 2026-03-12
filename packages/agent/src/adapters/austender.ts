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

      // Capture page state for diagnostics
      const pageTitle = await this.page.title();
      const pageUrl = this.page.url();

      // Wait for password field — handles SPAs that render forms via JS
      try {
        await this.page.waitForSelector('input[type="password"]', { timeout: 20000 });
      } catch {
        const inputs = await this.page.$$eval('input:not([type="hidden"])', els => els.map((el) => ({ type: (el as any).type, id: el.id, name: (el as any).name, placeholder: (el as any).placeholder }))).catch(() => []);
        const bodySnippet = await this.page.$eval('body', el => el.innerHTML.substring(0, 2000)).catch(() => 'N/A');
        return {
          success: false,
          error: `No password field on ${pageUrl} (title: "${pageTitle}"). Inputs: ${JSON.stringify(inputs).substring(0, 300)}. HTML: ${bodySnippet.substring(0, 300)}`
        };
      }

      // Try to find email/username field with broad selectors
      const emailInput = await this.page.$('input[type="email"], input[name*="Email" i], input[name*="email" i], input[name*="user" i], input[id*="Email" i], input[id*="email" i], #Email, #email');
      const passwordInput = await this.page.$('input[type="password"]');

      if (!emailInput || !passwordInput) {
        // Capture all input fields for diagnostics
        const inputs = await this.page.$$eval('input', els =>
          els.map((el) => ({ tag: el.tagName, type: (el as any).type, id: el.id, name: (el as any).name, placeholder: (el as any).placeholder }))
        );
        return { success: false, error: `Could not find login fields. Page: ${pageUrl}. Inputs found: ${JSON.stringify(inputs).substring(0, 500)}` };
      }

      await emailInput.fill(username);
      await passwordInput.fill(password);

      // Submit
      await this.page.click('button[type="submit"], input[type="submit"]');

      // Wait for redirect or error
      await this.page.waitForTimeout(5000);

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

  async register(params: RegistrationParams): Promise<RegistrationResult> {
    try {
      await this.navigateTo(`${this.siteUrl}/RegisteredUser/Register`);

      const pageTitle = await this.page.title();
      const pageUrl = this.page.url();

      // Wait for password field — handles SPAs that render forms via JS
      try {
        await this.page.waitForSelector('input[type="password"]', { timeout: 20000 });
      } catch {
        const inputs = await this.page.$$eval('input:not([type="hidden"])', els => els.map((el) => ({ type: (el as any).type, id: el.id, name: (el as any).name }))).catch(() => []);
        const bodySnippet = await this.page.$eval('body', el => el.innerHTML.substring(0, 2000)).catch(() => 'N/A');
        return {
          success: false,
          error: `No password field on register page ${pageUrl}. Inputs: ${JSON.stringify(inputs).substring(0, 300)}. HTML: ${bodySnippet.substring(0, 300)}`
        };
      }

      const emailInput = await this.page.$('input[type="email"], input[name*="Email" i], input[name*="email" i], input[name*="user" i], input[id*="Email" i], input[id*="email" i], #Email, #email');
      const passwordInput = await this.page.$('input[type="password"]:first-of-type, input[name*="Password" i]:not([name*="Confirm"]):not([name*="confirm"]), #Password, #password');
      const confirmInput = await this.page.$('input[name*="Confirm" i], input[name*="confirm" i], #ConfirmPassword, #confirmPassword');

      if (!emailInput) {
        const inputs = await this.page.$$eval('input', els =>
          els.map((el) => ({ tag: el.tagName, type: (el as any).type, id: el.id, name: (el as any).name, placeholder: (el as any).placeholder }))
        );
        return { success: false, error: `Could not find email field on register page. Inputs found: ${JSON.stringify(inputs).substring(0, 500)}` };
      }

      await emailInput.fill(params.email);
      if (passwordInput) await passwordInput.fill(params.password);
      if (confirmInput) await confirmInput.fill(params.password);

      // Fill company details if fields exist
      const companyField = await this.page.$("#CompanyName");
      if (companyField) {
        await companyField.fill(params.companyName);
      }

      if (params.abn) {
        const abnField = await this.page.$("#ABN");
        if (abnField) {
          await abnField.fill(params.abn);
        }
      }

      // Accept terms if checkbox exists
      const termsCheckbox = await this.page.$('input[type="checkbox"][name*="terms" i], input[type="checkbox"][name*="agree" i]');
      if (termsCheckbox) {
        await termsCheckbox.check();
      }

      await this.page.click('button[type="submit"]');
      await this.page.waitForTimeout(5000);

      // Check for success — some portals redirect, some show confirmation
      const currentUrl = this.page.url();
      const hasError = await this.page.$(".validation-summary-errors, .error-message");

      if (hasError) {
        const errorText = await hasError.textContent();
        return { success: false, error: errorText?.trim() || "Registration failed" };
      }

      // Check if email verification is required
      const verificationMessage = await this.page.$('text=/verify|confirmation|check your email/i');
      if (verificationMessage) {
        return { success: true, requiresVerification: true };
      }

      // Try to extract session if already logged in after registration
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

    // Navigate to search page
    await this.navigateTo(`${this.siteUrl}/Search/TenderSearch`);

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
          url: `${this.siteUrl}${href}`
        });
      }
    }

    return listings;
  }

  async fetchTenderDetail(sourceId: string): Promise<TenderDetail> {
    await this.navigateTo(`${this.siteUrl}/ATM/Show/${sourceId}`);

    // Extract details from page
    const title = await this.page.$eval("h1", el => el.textContent?.trim() || "");
    const description = await this.page.$eval(".description", el => el.textContent?.trim() || "").catch(() => "");
    const buyerOrg = await this.page.$eval(".agency-name", el => el.textContent?.trim() || "").catch(() => "");

    // Extract document links
    const documentUrls: string[] = [];
    const docLinks = await this.page.$$(".documents a[href*='download']");
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
