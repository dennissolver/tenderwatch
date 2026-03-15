import type { Page, Browser } from "playwright-core";

export interface ManualStepRequired {
  type: "captcha" | "email_verification";
}

export interface LoginResult {
  success: boolean;
  error?: string;
  requiresManualStep?: ManualStepRequired;
  sessionData?: Record<string, unknown>;
}

export interface TenderListing {
  sourceId: string;
  title: string;
  buyerOrg?: string;
  closesAt?: Date;
  valueRange?: string;
  url: string;
}

export interface TenderDetail {
  sourceId: string;
  title: string;
  description: string;
  fullText?: string;
  buyerOrg: string;
  regions: string[];
  categories: string[];
  tenderType?: string;
  valueLow?: number;
  valueHigh?: number;
  publishedAt?: Date;
  closesAt?: Date;
  briefingAt?: Date;
  certificationsRequired: string[];
  documentUrls: string[];
  sourceUrl: string;
}

export interface RegistrationParams {
  email: string;
  password: string;
  companyName: string;
  abn?: string;
  acn?: string;
  legalName?: string;
  businessName?: string;
  orgType?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  phone?: string;
  contactFirstName?: string;
  contactLastName?: string;
  contactPosition?: string;
}

export interface RegistrationResult {
  success: boolean;
  error?: string;
  requiresVerification?: boolean;
  requiresManualStep?: ManualStepRequired;
  sessionData?: Record<string, unknown>;
}

export abstract class BaseSiteAdapter {
  protected page: Page;
  protected browser: Browser;

  constructor(browser: Browser, page: Page) {
    this.browser = browser;
    this.page = page;
  }

  abstract get siteName(): string;
  abstract get siteUrl(): string;

  abstract login(username: string, password: string): Promise<LoginResult>;
  abstract isLoggedIn(): Promise<boolean>;
  abstract register(params: RegistrationParams): Promise<RegistrationResult>;
  abstract search(params: SearchParams): Promise<TenderListing[]>;
  abstract fetchTenderDetail(sourceId: string): Promise<TenderDetail>;
  abstract downloadDocument(url: string, filename: string): Promise<Buffer>;
  abstract logout(): Promise<void>;

  async navigateTo(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: "networkidle" });
  }

  async screenshot(path: string): Promise<void> {
    await this.page.screenshot({ path, fullPage: true });
  }

  async detectCaptcha(): Promise<boolean> {
    const captcha = await this.page.$(
      'iframe[src*="recaptcha"], iframe[src*="hcaptcha"], .g-recaptcha, .h-captcha, #captcha, [class*="captcha" i], iframe[title*="captcha" i]'
    );
    return captcha !== null;
  }

  /**
   * Try to fill a field using multiple selectors. Returns true if filled.
   */
  protected async tryFill(selectors: string, value: string | undefined): Promise<boolean> {
    if (!value) return false;
    try {
      const el = await this.page.$(selectors);
      if (el) {
        await el.fill(value);
        return true;
      }
    } catch {
      // Field not found or not fillable — skip
    }
    return false;
  }

  /**
   * Try to check a checkbox using multiple selectors.
   */
  protected async tryCheck(selectors: string): Promise<boolean> {
    try {
      const el = await this.page.$(selectors);
      if (el) {
        await el.check();
        return true;
      }
    } catch {
      // Checkbox not found — skip
    }
    return false;
  }

  /**
   * Try to select a dropdown value.
   */
  protected async trySelect(selectors: string, value: string | undefined): Promise<boolean> {
    if (!value) return false;
    try {
      const el = await this.page.$(selectors);
      if (el) {
        await el.selectOption({ label: value }).catch(() =>
          el.selectOption(value).catch(() => {})
        );
        return true;
      }
    } catch {
      // Select not found — skip
    }
    return false;
  }

  /**
   * Fill all standard registration fields that can be found on the current page.
   * Fields that don't exist on this portal are silently skipped.
   */
  async fillRegistrationFields(params: RegistrationParams): Promise<{ filled: string[]; missing: string[] }> {
    const filled: string[] = [];
    const missing: string[] = [];

    const fields: [string, string, string | undefined][] = [
      ["email", 'input[type="email"], input[name*="email" i], input[id*="email" i], #email, #Email', params.email],
      ["username", 'input[name*="user" i]:not([type="hidden"]), input[id*="user" i], #username, #Username', params.email],
      ["password", 'input[type="password"]:first-of-type, #Password, #password', params.password],
      ["confirmPassword", 'input[name*="confirm" i][type="password"], input[name*="retype" i][type="password"], #ConfirmPassword, #confirmPassword, input[type="password"]:nth-of-type(2)', params.password],
      ["companyName", 'input[name*="company" i], input[name*="organisation" i], input[name*="organization" i], #CompanyName, #companyName, #organisationName', params.companyName],
      ["legalName", 'input[name*="legal" i], #legalName, #LegalName, input[name="business.legalName"]', params.legalName || params.companyName],
      ["businessName", 'input[name*="business" i]:not([name*="email"]):not([name*="phone"]), input[name*="trading" i], #businessName, #BusinessName, input[name="business.name"]', params.businessName || params.companyName],
      ["abn", 'input[name*="abn" i], #abn, #ABN', params.abn],
      ["acn", 'input[name*="acn" i], #acn, #ACN', params.acn],
      ["addressLine1", 'input[name*="address" i]:not([name*="email"]), input[name*="street" i], #address, #Address, #addressLine1', params.addressLine1],
      ["city", 'input[name*="city" i], input[name*="suburb" i], input[name*="locality" i], #city, #City', params.city],
      ["state", 'input[name*="state" i]:not([type="hidden"]), #state, #State', params.state],
      ["postcode", 'input[name*="post" i], input[name*="zip" i], #postcode, #Postcode, #zipCode', params.postcode],
      ["phone", 'input[type="tel"], input[name*="phone" i], #phone, #Phone', params.phone],
      ["firstName", 'input[name*="first" i], input[name*="given" i], #firstName, #FirstName', params.contactFirstName],
      ["lastName", 'input[name*="last" i], input[name*="surname" i], input[name*="family" i], #lastName, #LastName', params.contactLastName],
      ["position", 'input[name*="position" i], input[name*="title" i]:not([type="hidden"]), #position, #Position', params.contactPosition],
    ];

    for (const [name, selectors, value] of fields) {
      if (await this.tryFill(selectors, value)) {
        filled.push(name);
      } else if (value) {
        missing.push(name);
      }
    }

    // Try country dropdown
    if (params.country) {
      if (await this.trySelect('select[name*="country" i], #country, #Country', params.country)) {
        filled.push("country");
      } else {
        await this.tryFill('input[name*="country" i], #country', params.country);
      }
    }

    // Try org type dropdown
    if (params.orgType) {
      if (await this.trySelect('select[name*="org" i], select[name*="type" i], #orgType, #organisationType', params.orgType)) {
        filled.push("orgType");
      }
    }

    // Try state dropdown (some portals use select instead of input)
    if (params.state) {
      await this.trySelect('select[name*="state" i], #state, #State', params.state);
    }

    // Try terms checkbox
    await this.tryCheck('input[type="checkbox"][name*="terms" i], input[type="checkbox"][name*="agree" i], input[type="checkbox"][name*="accept" i], input[type="checkbox"]:not([name*="alert"])');

    return { filled, missing };
  }
}

export interface SearchParams {
  keywords?: string[];
  regions?: string[];
  categories?: string[];
  valueMin?: number;
  valueMax?: number;
  publishedAfter?: Date;
  closingAfter?: Date;
}
