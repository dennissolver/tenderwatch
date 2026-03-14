import { BaseSiteAdapter, LoginResult, RegistrationParams, RegistrationResult, TenderListing, TenderDetail, SearchParams } from "./base";

export class SATendersAdapter extends BaseSiteAdapter {
  get siteName() {
    return "SA Tenders";
  }

  get siteUrl() {
    return "https://www.tenders.sa.gov.au";
  }

  async login(username: string, password: string): Promise<LoginResult> {
    try {
      await this.navigateTo(`${this.siteUrl}/login`);

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

      const errorElement = await this.page.$(".error, .alert-danger, .validation-error");
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

      // SA Tenders may redirect to a terms acceptance page first
      await this.page.waitForTimeout(3000);
      const currentUrl = this.page.url();

      if (currentUrl.includes("/terms")) {
        // Accept the terms and conditions
        const acceptBtn = await this.page.$('button:has-text("Accept"), button:has-text("Agree"), button:has-text("Continue"), input[type="submit"][value*="Accept" i], input[type="submit"][value*="Agree" i], a:has-text("Accept"), a:has-text("I Agree")');
        const termsCheckbox = await this.page.$('input[type="checkbox"]');
        if (termsCheckbox) await termsCheckbox.check();
        if (acceptBtn) {
          await acceptBtn.click();
          await this.page.waitForTimeout(3000);
        } else {
          // Try clicking any submit button on the terms page
          const submitBtn = await this.page.$('button[type="submit"], input[type="submit"]');
          if (submitBtn) {
            await submitBtn.click();
            await this.page.waitForTimeout(3000);
          }
        }
      }

      const pageUrl = this.page.url();

      // SA Tenders: password is SYSTEM-GENERATED and emailed, no password field on form
      try {
        await this.page.waitForSelector('input[type="text"], input[type="email"], input[name*="email" i], input[name*="name" i]', { timeout: 20000 });
      } catch {
        const bodySnippet = await this.page.$eval('body', el => el.innerHTML.substring(0, 2000)).catch(() => 'N/A');
        return { success: false, error: `No registration form fields on ${pageUrl}. HTML: ${bodySnippet.substring(0, 500)}` };
      }

      // Fill trading/business name
      const companyField = await this.page.$('input[name*="trading" i], input[name*="business" i], input[name*="company" i], input[name*="organisation" i], #tradingName, #businessName');
      if (companyField) await companyField.fill(params.companyName);

      // Fill ABN
      if (params.abn) {
        const abnField = await this.page.$('input[name*="abn" i], #abn');
        if (abnField) await abnField.fill(params.abn);
      }

      // Fill username
      const usernameField = await this.page.$('input[name*="username" i], input[name*="user" i], #username');
      if (usernameField) await usernameField.fill(params.email);

      // Fill email
      const emailField = await this.page.$('input[type="email"], input[name*="email" i], input[id*="email" i], #email');
      if (emailField) await emailField.fill(params.email);

      // Fill contact name
      const contactField = await this.page.$('input[name*="contact" i], input[name*="name" i]:not([name*="business"]):not([name*="trading"]):not([name*="user"]), #contactName');
      if (contactField) {
        const contactName = [params.contactFirstName, params.contactLastName].filter(Boolean).join(" ") || params.companyName;
        await contactField.fill(contactName);
      }

      // Fill phone
      if (params.phone) {
        const phoneField = await this.page.$('input[type="tel"], input[name*="phone" i], #phone');
        if (phoneField) await phoneField.fill(params.phone);
      }

      // Fill address fields if present
      if (params.addressLine1) {
        const addressField = await this.page.$('input[name*="address" i], #address');
        if (addressField) await addressField.fill(params.addressLine1);
      }
      if (params.city) {
        const cityField = await this.page.$('input[name*="city" i], input[name*="suburb" i], #city');
        if (cityField) await cityField.fill(params.city);
      }
      if (params.state) {
        const stateField = await this.page.$('input[name*="state" i], select[name*="state" i], #state');
        if (stateField) await stateField.fill(params.state);
      }
      if (params.postcode) {
        const postcodeField = await this.page.$('input[name*="post" i], input[name*="zip" i], #postcode');
        if (postcodeField) await postcodeField.fill(params.postcode);
      }

      const termsCheckbox = await this.page.$('input[type="checkbox"]');
      if (termsCheckbox) await termsCheckbox.check();

      await this.page.click('button[type="submit"], input[type="submit"]');
      await this.page.waitForTimeout(5000);

      const hasError = await this.page.$(".error, .alert-danger, .validation-error");
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
      regions: ["South Australia"],
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
