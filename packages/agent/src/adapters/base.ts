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
