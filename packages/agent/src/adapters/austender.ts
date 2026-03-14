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

      const pageUrl = this.page.url();

      // The page has BOTH a login form (in header) and registration form (main content).
      // We need to target the REGISTRATION form specifically, not the login form.
      // Wait for the main content area to have password fields
      try {
        await this.page.waitForSelector('#mainContent input[type="password"], .registration-form input[type="password"], form[action*="Register"] input[type="password"], #Password, #register-password', { timeout: 20000 });
      } catch {
        // Fallback: look for ANY password field, but skip ones in login forms
        const allPasswords = await this.page.$$('input[type="password"]');
        if (allPasswords.length < 2) {
          const inputs = await this.page.$$eval('input:not([type="hidden"])', els => els.map((el) => ({ type: (el as any).type, id: el.id, name: (el as any).name }))).catch(() => []);
          return {
            success: false,
            error: `No registration password field on ${pageUrl}. Inputs: ${JSON.stringify(inputs).substring(0, 500)}`
          };
        }
      }

      // Target registration form fields — skip login form fields (login-username, login-password)
      // Look for email/username in the main content area, not the login header
      const emailInput = await this.page.$('#mainContent input[type="email"], #mainContent input[name*="Email" i], form[action*="Register"] input[type="email"], form[action*="Register"] input[name*="Email" i], #Email:not(#login-username)');

      // Get all password fields — the login form has 1, registration has 2 (password + confirm)
      const allPasswords = await this.page.$$('input[type="password"]');
      // Skip the first password (login form) if there are 3+ password fields, otherwise use smart matching
      let passwordInput = await this.page.$('#mainContent input[type="password"], form[action*="Register"] input[type="password"], #Password');
      let confirmInput = await this.page.$('#mainContent input[name*="Confirm" i], form[action*="Register"] input[name*="Confirm" i], #ConfirmPassword');

      // Fallback: if we have multiple password fields, use the ones NOT in login form
      if (!passwordInput && allPasswords.length >= 2) {
        // Skip login password fields (id contains "login")
        const regPasswords = [];
        for (const pw of allPasswords) {
          const id = await pw.getAttribute("id") || "";
          if (!id.toLowerCase().includes("login") && !id.toLowerCase().includes("mobile")) {
            regPasswords.push(pw);
          }
        }
        if (regPasswords.length >= 1) passwordInput = regPasswords[0];
        if (regPasswords.length >= 2) confirmInput = regPasswords[1];
      }

      if (!emailInput) {
        const inputs = await this.page.$$eval('input:not([type="hidden"])', els =>
          els.map((el) => ({ type: (el as any).type, id: el.id, name: (el as any).name, placeholder: (el as any).placeholder }))
        );
        return { success: false, error: `Could not find registration email field. Inputs found: ${JSON.stringify(inputs).substring(0, 500)}` };
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
      const termsCheckbox = await this.page.$('#mainContent input[type="checkbox"], form[action*="Register"] input[type="checkbox"]');
      if (termsCheckbox) {
        await termsCheckbox.check();
      }

      // Click submit in the registration form, not the login form
      const submitBtn = await this.page.$('#mainContent button[type="submit"], form[action*="Register"] button[type="submit"], form[action*="Register"] input[type="submit"]');
      if (submitBtn) {
        await submitBtn.click();
      } else {
        await this.page.click('button[type="submit"]');
      }
      await this.page.waitForTimeout(5000);

      const hasError = await this.page.$(".validation-summary-errors, .error-message");
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
