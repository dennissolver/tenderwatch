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
        const inputs = await this.page.$$eval('input:not([type="hidden"])', els => els.map((el) => ({ type: (el as any).type, id: el.id, name: (el as any).name, placeholder: (el as any).placeholder }))).catch(() => []);
        const bodySnippet = await this.page.$eval('body', el => el.innerHTML.substring(0, 2000)).catch(() => 'N/A');
        return { success: false, error: `No password field on ${pageUrl} (title: "${pageTitle}"). Inputs: ${JSON.stringify(inputs).substring(0, 300)}. HTML: ${bodySnippet.substring(0, 300)}` };
      }

      const emailField = await this.page.$('input[type="email"], input[type="text"], input[name*="email" i], input[name*="user" i], input[id*="email" i], input[id*="user" i], #email, #username');
      const passwordField = await this.page.$('input[type="password"]');

      if (!emailField || !passwordField) {
        const inputs = await this.page.$$eval('input:not([type="hidden"])', els => els.map((el) => ({ type: (el as any).type, id: el.id, name: (el as any).name, placeholder: (el as any).placeholder })));
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

      // VIC Tenders has a multi-step registration wizard
      // Step 1: Business details (legalName, businessName, ABN)
      try {
        await this.page.waitForSelector('#legalName, input[name="business.legalName"]', { timeout: 20000 });
      } catch {
        const inputs = await this.page.$$eval('input:not([type="hidden"])', els => els.map((el) => ({ type: (el as any).type, id: el.id, name: (el as any).name }))).catch(() => []);
        return { success: false, error: `VIC register step 1: no business fields found. Inputs: ${JSON.stringify(inputs).substring(0, 500)}` };
      }

      // Fill business details
      const legalNameField = await this.page.$('#legalName, input[name="business.legalName"]');
      if (legalNameField) await legalNameField.fill(params.companyName);

      const businessNameField = await this.page.$('#businessName, input[name="business.name"]');
      if (businessNameField) await businessNameField.fill(params.companyName);

      // Fill ABN if available
      if (params.abn) {
        const abnField = await this.page.$('#identifiers0\\.identifier, input[name="identifiers[0].identifier"]');
        if (abnField) await abnField.fill(params.abn);
      }

      // Submit step 1 — look for Next/Continue/Submit button
      const nextButton = await this.page.$('button[type="submit"], input[type="submit"], button:has-text("Next"), button:has-text("Continue"), a:has-text("Next")');
      if (nextButton) await nextButton.click();
      await this.page.waitForTimeout(5000);

      // Step 2: Check what page we're on now — might have user details / credentials
      // Capture current state for diagnostics
      const step2Inputs = await this.page.$$eval('input:not([type="hidden"])', els => els.map((el) => ({ type: (el as any).type, id: el.id, name: (el as any).name }))).catch(() => []);

      // Try to find email field on this or subsequent pages
      const emailField = await this.page.$('input[type="email"], input[name*="email" i], input[id*="email" i], #email');
      if (emailField) await emailField.fill(params.email);

      // Try to find password field
      const passwordField = await this.page.$('input[type="password"]');
      if (passwordField) {
        await passwordField.fill(params.password);
        // Look for confirm password
        const allPasswords = await this.page.$$('input[type="password"]');
        if (allPasswords.length > 1) {
          await allPasswords[1].fill(params.password);
        }
      }

      const termsCheckbox = await this.page.$('input[type="checkbox"]');
      if (termsCheckbox) await termsCheckbox.check();

      // Submit the form
      const submitButton = await this.page.$('button[type="submit"], input[type="submit"], button:has-text("Register"), button:has-text("Submit"), button:has-text("Create")');
      if (submitButton) await submitButton.click();
      await this.page.waitForTimeout(5000);

      // Check for errors
      const hasError = await this.page.$(".error, .alert-danger, .field-validation-error, .alert-error");
      if (hasError) {
        const errorText = await hasError.textContent();
        return { success: false, error: `VIC register error: ${errorText?.trim()}. Step2 inputs were: ${JSON.stringify(step2Inputs).substring(0, 300)}` };
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
