import type { Page, Browser } from "playwright";

export interface LoginResult {
  success: boolean;
  error?: string;
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
