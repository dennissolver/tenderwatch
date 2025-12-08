#!/usr/bin/env python3
"""
TenderWatch Monorepo Scaffold Generator
========================================
Run this script in an empty directory to create the complete project structure.

Usage:
    python scaffold_tenderwatch.py

Or make executable:
    chmod +x scaffold_tenderwatch.py
    ./scaffold_tenderwatch.py
"""

import os
import json
from pathlib import Path
from datetime import datetime

# =============================================================================
# CONFIGURATION
# =============================================================================

PROJECT_NAME = "tenderwatch"
DOMAIN = "tenderwatch.io"

# =============================================================================
# FILE CONTENTS
# =============================================================================

# Root config files
ROOT_PACKAGE_JSON = """{
  "name": "tenderwatch",
  "version": "0.1.0",
  "private": true,
  "description": "AI-powered Australian government tender intelligence",
  "author": "TenderWatch",
  "license": "UNLICENSED",
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "clean": "turbo run clean && rm -rf node_modules",
    "db:generate": "pnpm --filter @tenderwatch/db generate",
    "db:push": "pnpm --filter @tenderwatch/db push",
    "db:studio": "pnpm --filter @tenderwatch/db studio",
    "email:dev": "pnpm --filter @tenderwatch/email dev"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "turbo": "^2.0.0",
    "typescript": "^5.3.0"
  },
  "packageManager": "pnpm@9.0.0",
  "engines": {
    "node": ">=20.0.0"
  }
}
"""

PNPM_WORKSPACE = """packages:
  - "apps/*"
  - "packages/*"
"""

TURBO_JSON = """{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [".env"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "clean": {
      "cache": false
    }
  }
}
"""

ROOT_TSCONFIG = """{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "incremental": true
  },
  "exclude": ["node_modules"]
}
"""

ENV_EXAMPLE = """# =============================================================================
# TenderWatch Environment Configuration
# =============================================================================
# Copy this file to .env.local and fill in your values

# -----------------------------------------------------------------------------
# App
# -----------------------------------------------------------------------------
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=TenderWatch

# -----------------------------------------------------------------------------
# Database (Supabase)
# -----------------------------------------------------------------------------
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres

# Supabase Client
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# -----------------------------------------------------------------------------
# Authentication
# -----------------------------------------------------------------------------
# Used for encrypting session tokens
AUTH_SECRET=generate-a-32-character-secret-here

# -----------------------------------------------------------------------------
# Stripe
# -----------------------------------------------------------------------------
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Stripe Product/Price IDs
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_PRO_YEARLY_PRICE_ID=price_...

# -----------------------------------------------------------------------------
# Email (Resend)
# -----------------------------------------------------------------------------
RESEND_API_KEY=re_...
EMAIL_FROM=TenderWatch <notifications@tenderwatch.io>

# -----------------------------------------------------------------------------
# AI/LLM (Anthropic)
# -----------------------------------------------------------------------------
ANTHROPIC_API_KEY=sk-ant-...

# -----------------------------------------------------------------------------
# Browser Automation (Browserbase)
# -----------------------------------------------------------------------------
BROWSERBASE_API_KEY=bb_...
BROWSERBASE_PROJECT_ID=...

# -----------------------------------------------------------------------------
# Background Jobs (Inngest)
# -----------------------------------------------------------------------------
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...

# -----------------------------------------------------------------------------
# Credential Encryption
# -----------------------------------------------------------------------------
# 32-byte hex key for encrypting user portal credentials
CREDENTIAL_ENCRYPTION_KEY=generate-64-hex-characters

# -----------------------------------------------------------------------------
# Monitoring
# -----------------------------------------------------------------------------
SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=...

# -----------------------------------------------------------------------------
# Analytics (optional)
# -----------------------------------------------------------------------------
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
"""

GITIGNORE = """# Dependencies
node_modules
.pnpm-store

# Build outputs
.next
.turbo
dist
out
build

# Environment files
.env
.env.local
.env.*.local

# IDE
.idea
.vscode
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
pnpm-debug.log*

# Testing
coverage

# Vercel
.vercel

# Misc
*.tsbuildinfo
"""

NVMRC = "20"

README = f"""# TenderWatch

AI-powered Australian government tender intelligence platform.

## Overview

TenderWatch helps Australian businesses discover and win government contracts by:
- **Aggregating** tenders from federal, state, and territory portals
- **Matching** opportunities to your business using AI semantic analysis
- **Summarizing** lengthy tender documents into actionable insights
- **Alerting** you instantly when relevant tenders are published

## Tech Stack

- **Frontend**: Next.js 14 (App Router), Tailwind CSS, shadcn/ui
- **Database**: Supabase (PostgreSQL) + Drizzle ORM
- **Auth**: Supabase Auth
- **Payments**: Stripe
- **Email**: Resend + React Email
- **Jobs**: Inngest
- **Browser Automation**: Browserbase + Playwright
- **AI**: Anthropic Claude API
- **Hosting**: Vercel

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Supabase account
- Stripe account
- Resend account
- Anthropic API key
- Browserbase account

### Installation

```bash
# Clone the repo
git clone https://github.com/yourusername/tenderwatch.git
cd tenderwatch

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your credentials
# Then push the database schema
pnpm db:push

# Start development
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Project Structure

```
tenderwatch/
├── apps/
│   ├── web/          # Next.js application
│   └── email/        # React Email templates
├── packages/
│   ├── db/           # Drizzle schema & queries
│   ├── agent/        # Browser automation
│   ├── processor/    # LLM processing pipeline
│   ├── jobs/         # Inngest background jobs
│   ├── crypto/       # Credential encryption
│   ├── billing/      # Stripe integration
│   └── shared/       # Shared types & utilities
├── .env.example
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## License

Proprietary - All rights reserved.

---

Built for Australian businesses
"""

# =============================================================================
# APPS/WEB
# =============================================================================

WEB_PACKAGE_JSON = """{
  "name": "@tenderwatch/web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "clean": "rm -rf .next .turbo node_modules"
  },
  "dependencies": {
    "@tenderwatch/db": "workspace:*",
    "@tenderwatch/billing": "workspace:*",
    "@tenderwatch/shared": "workspace:*",
    "@supabase/supabase-js": "^2.39.0",
    "@supabase/ssr": "^0.1.0",
    "next": "14.2.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "tailwindcss": "^3.4.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "lucide-react": "^0.300.0",
    "zod": "^3.22.0",
    "react-hook-form": "^7.49.0",
    "@hookform/resolvers": "^3.3.0",
    "sonner": "^1.3.0",
    "date-fns": "^3.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "typescript": "^5.3.0"
  }
}
"""

WEB_TSCONFIG = """{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"],
      "@tenderwatch/db": ["../../packages/db/src"],
      "@tenderwatch/billing": ["../../packages/billing/src"],
      "@tenderwatch/shared": ["../../packages/shared/src"]
    },
    "jsx": "preserve"
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
"""

NEXT_CONFIG = """/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@tenderwatch/db",
    "@tenderwatch/billing",
    "@tenderwatch/shared"
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb"
    }
  }
};

module.exports = nextConfig;
"""

TAILWIND_CONFIG = """/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)"
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
};
"""

POSTCSS_CONFIG = """module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};
"""

# Main layout and page files
ROOT_LAYOUT = """import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "TenderWatch - AI-Powered Tender Intelligence",
    template: "%s | TenderWatch"
  },
  description: "Never miss a government tender again. AI-powered matching and summaries for Australian businesses.",
  keywords: ["government tenders", "australian tenders", "tender alerts", "procurement", "AusTender"],
  authors: [{ name: "TenderWatch" }],
  openGraph: {
    type: "website",
    locale: "en_AU",
    url: "https://tenderwatch.io",
    siteName: "TenderWatch",
    title: "TenderWatch - AI-Powered Tender Intelligence",
    description: "Never miss a government tender again."
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
"""

GLOBALS_CSS = """@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
"""

# Marketing pages
MARKETING_LAYOUT = """import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";

export default function MarketingLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
"""

LANDING_PAGE = """import Link from "next/link";
import { ArrowRight, Search, Bell, FileText, CheckCircle } from "lucide-react";

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Never Miss a{" "}
              <span className="text-primary">Government Tender</span>{" "}
              Again
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              AI-powered tender intelligence for Australian businesses. 
              We scan every portal, match opportunities to your business, 
              and deliver actionable summaries—so you can focus on winning.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition"
              >
                Start Free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-input bg-background hover:bg-accent transition"
              >
                See How It Works
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Free plan includes 3 matches/month. No credit card required.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            How TenderWatch Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Search className="h-8 w-8 text-primary" />}
              title="Connect Your Accounts"
              description="Link your existing tender portal accounts. We search as you—seeing everything you're eligible for."
            />
            <FeatureCard
              icon={<Bell className="h-8 w-8 text-primary" />}
              title="Set Your Watches"
              description="Tell us what you're looking for with keywords, regions, and value ranges. Our AI learns what matters to you."
            />
            <FeatureCard
              icon={<FileText className="h-8 w-8 text-primary" />}
              title="Get Smart Summaries"
              description="Receive personalised digests with AI-analysed summaries highlighting what matters to YOUR business."
            />
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm uppercase tracking-wider text-muted-foreground mb-4">
            Trusted by Australian Businesses
          </p>
          <div className="flex flex-wrap justify-center gap-8 items-center opacity-60">
            {/* Placeholder for logos */}
            <div className="h-8 w-24 bg-muted rounded" />
            <div className="h-8 w-32 bg-muted rounded" />
            <div className="h-8 w-28 bg-muted rounded" />
            <div className="h-8 w-24 bg-muted rounded" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Win More Tenders?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Join hundreds of Australian businesses using TenderWatch to find their next contract.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center px-8 py-4 rounded-lg bg-background text-foreground font-semibold hover:bg-background/90 transition"
          >
            Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}

function FeatureCard({
  icon,
  title,
  description
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-background rounded-xl p-6 shadow-sm border">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
"""

PRICING_PAGE = """import Link from "next/link";
import { Check, X } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-muted-foreground">
            Start free, upgrade when you need more.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <div className="border rounded-xl p-8">
            <h2 className="text-2xl font-bold mb-2">Free</h2>
            <p className="text-muted-foreground mb-6">
              Perfect for getting started
            </p>
            <div className="mb-6">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <Link
              href="/signup"
              className="block w-full text-center py-3 px-4 rounded-lg border border-primary text-primary font-semibold hover:bg-primary/5 transition mb-8"
            >
              Get Started
            </Link>
            <ul className="space-y-3">
              <PricingFeature included>1 watch</PricingFeature>
              <PricingFeature included>3 matches/month</PricingFeature>
              <PricingFeature included>1 linked account</PricingFeature>
              <PricingFeature included>Weekly digest</PricingFeature>
              <PricingFeature included>Keyword matching</PricingFeature>
              <PricingFeature>AI summaries</PricingFeature>
              <PricingFeature>Document downloads</PricingFeature>
              <PricingFeature>Instant alerts</PricingFeature>
            </ul>
          </div>

          {/* Pro Plan */}
          <div className="border-2 border-primary rounded-xl p-8 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-sm font-semibold px-3 py-1 rounded-full">
              Most Popular
            </div>
            <h2 className="text-2xl font-bold mb-2">Pro</h2>
            <p className="text-muted-foreground mb-6">
              For serious tender hunters
            </p>
            <div className="mb-6">
              <span className="text-4xl font-bold">$20</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <Link
              href="/signup?plan=pro"
              className="block w-full text-center py-3 px-4 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition mb-8"
            >
              Start Free Trial
            </Link>
            <ul className="space-y-3">
              <PricingFeature included>Unlimited watches</PricingFeature>
              <PricingFeature included>Unlimited matches</PricingFeature>
              <PricingFeature included>20 linked accounts</PricingFeature>
              <PricingFeature included>Daily or instant alerts</PricingFeature>
              <PricingFeature included>AI semantic matching</PricingFeature>
              <PricingFeature included>AI summaries (standard & deep)</PricingFeature>
              <PricingFeature included>Document downloads</PricingFeature>
              <PricingFeature included>4-hour sync cycle</PricingFeature>
              <PricingFeature included>90-day document storage</PricingFeature>
              <PricingFeature included>CSV export</PricingFeature>
            </ul>
          </div>
        </div>

        <div className="text-center mt-12 text-muted-foreground">
          <p>Annual billing available at $16/month (save 20%)</p>
          <p className="mt-2">7-day money back guarantee on Pro plans</p>
        </div>
      </div>
    </div>
  );
}

function PricingFeature({
  children,
  included = false
}: {
  children: React.ReactNode;
  included?: boolean;
}) {
  return (
    <li className="flex items-center gap-2">
      {included ? (
        <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
      ) : (
        <X className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      )}
      <span className={included ? "" : "text-muted-foreground"}>{children}</span>
    </li>
  );
}
"""

# Dashboard Layout
DASHBOARD_LAYOUT = """import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardNav } from "@/components/dashboard/nav";
import { DashboardSidebar } from "@/components/dashboard/sidebar";

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardNav user={user} />
      <div className="flex">
        <DashboardSidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
"""

DASHBOARD_PAGE = """import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { DashboardStats } from "@/components/dashboard/stats";
import { RecentMatches } from "@/components/dashboard/recent-matches";
import { ActiveWatches } from "@/components/dashboard/active-watches";

export default async function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s what&apos;s happening with your tenders.
        </p>
      </div>

      <Suspense fallback={<div>Loading stats...</div>}>
        <DashboardStats />
      </Suspense>

      <div className="grid lg:grid-cols-2 gap-6">
        <Suspense fallback={<div>Loading matches...</div>}>
          <RecentMatches />
        </Suspense>
        <Suspense fallback={<div>Loading watches...</div>}>
          <ActiveWatches />
        </Suspense>
      </div>
    </div>
  );
}
"""

# Supabase client utilities
SUPABASE_CLIENT_SERVER = """import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Handle cookies in Server Components
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            // Handle cookies in Server Components
          }
        }
      }
    }
  );
}
"""

SUPABASE_CLIENT_BROWSER = """import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
"""

SUPABASE_MIDDLEWARE = """import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options
          });
          response = NextResponse.next({
            request: {
              headers: request.headers
            }
          });
          response.cookies.set({
            name,
            value,
            ...options
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: "",
            ...options
          });
          response = NextResponse.next({
            request: {
              headers: request.headers
            }
          });
          response.cookies.set({
            name,
            value: "",
            ...options
          });
        }
      }
    }
  );

  await supabase.auth.getUser();

  return response;
}
"""

MIDDLEWARE = """import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
  ]
};
"""

# =============================================================================
# PACKAGES/DB
# =============================================================================

DB_PACKAGE_JSON = """{
  "name": "@tenderwatch/db",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "generate": "drizzle-kit generate",
    "push": "drizzle-kit push",
    "studio": "drizzle-kit studio",
    "clean": "rm -rf dist node_modules"
  },
  "dependencies": {
    "drizzle-orm": "^0.29.0",
    "postgres": "^3.4.0"
  },
  "devDependencies": {
    "drizzle-kit": "^0.20.0",
    "typescript": "^5.3.0"
  }
}
"""

DB_DRIZZLE_CONFIG = """import type { Config } from "drizzle-kit";

export default {
  schema: "./src/schema/*",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!
  }
} satisfies Config;
"""

DB_SCHEMA_USERS = """import { pgTable, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const planEnum = pgEnum("plan", ["free", "pro"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "canceled",
  "past_due",
  "unpaid",
  "trialing"
]);

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  email: text("email").notNull().unique(),
  companyName: text("company_name"),
  abn: text("abn"),

  // Subscription
  plan: planEnum("plan").default("free").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: subscriptionStatusEnum("subscription_status"),
  currentPeriodEnd: timestamp("current_period_end"),

  // Onboarding
  onboardingCompleted: boolean("onboarding_completed").default(false),

  // Admin
  isAdmin: boolean("is_admin").default(false),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
"""

DB_SCHEMA_WATCHES = """import { pgTable, text, timestamp, boolean, integer, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { users } from "./users";

export const sensitivityEnum = pgEnum("sensitivity", ["strict", "balanced", "adventurous"]);
export const deliveryMethodEnum = pgEnum("delivery_method", ["instant", "daily", "weekly"]);
export const detailLevelEnum = pgEnum("detail_level", ["headlines", "standard", "deep"]);

export const watches = pgTable("watches", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  name: text("name").notNull(),
  isActive: boolean("is_active").default(true).notNull(),

  // Keywords
  keywordsMust: jsonb("keywords_must").$type<string[]>().default([]),
  keywordsBonus: jsonb("keywords_bonus").$type<string[]>().default([]),
  keywordsExclude: jsonb("keywords_exclude").$type<string[]>().default([]),

  // Filters
  regions: jsonb("regions").$type<string[]>().default([]),
  valueMin: integer("value_min"),
  valueMax: integer("value_max"),
  includeUnspecifiedValue: boolean("include_unspecified_value").default(true),
  tenderTypes: jsonb("tender_types").$type<string[]>().default([]),
  minResponseDays: integer("min_response_days"),

  // Preferences
  preferredSectors: jsonb("preferred_sectors").$type<string[]>().default([]),
  preferredBuyers: jsonb("preferred_buyers").$type<string[]>().default([]),
  certificationsHeld: jsonb("certifications_held").$type<string[]>().default([]),

  // Matching
  sensitivity: sensitivityEnum("sensitivity").default("balanced").notNull(),

  // Delivery
  deliveryMethod: deliveryMethodEnum("delivery_method").default("daily").notNull(),
  detailLevel: detailLevelEnum("detail_level").default("standard").notNull(),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export type Watch = typeof watches.$inferSelect;
export type NewWatch = typeof watches.$inferInsert;
"""

DB_SCHEMA_LINKED_ACCOUNTS = """import { pgTable, text, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { users } from "./users";

export const siteEnum = pgEnum("site", [
  "austender",
  "nsw_etender",
  "qld_qtenders",
  "vic_tenders",
  "sa_tenders",
  "wa_tenders",
  "tas_tenders",
  "nt_tenders",
  "act_tenders",
  "vendorpanel",
  "tenderlink",
  "icn_gateway"
]);

export const accountStatusEnum = pgEnum("account_status", [
  "connected",
  "error",
  "expired",
  "pending"
]);

export const linkedAccounts = pgTable("linked_accounts", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  site: siteEnum("site").notNull(),
  siteUsername: text("site_username").notNull(),
  encryptedCredentials: text("encrypted_credentials").notNull(),

  // Session data (cookies/tokens for maintaining login)
  sessionData: jsonb("session_data"),

  status: accountStatusEnum("status").default("pending").notNull(),
  lastSyncAt: timestamp("last_sync_at"),
  lastError: text("last_error"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export type LinkedAccount = typeof linkedAccounts.$inferSelect;
export type NewLinkedAccount = typeof linkedAccounts.$inferInsert;
"""

DB_SCHEMA_TENDERS = """import { pgTable, text, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { siteEnum } from "./linked-accounts";

export const tenders = pgTable("tenders", {
  id: text("id").primaryKey().$defaultFn(() => createId()),

  // Source
  source: siteEnum("source").notNull(),
  sourceId: text("source_id").notNull(),
  sourceUrl: text("source_url").notNull(),

  // Basic info
  title: text("title").notNull(),
  description: text("description"),
  fullText: text("full_text"),
  buyerOrg: text("buyer_org"),

  // Classification
  regions: jsonb("regions").$type<string[]>().default([]),
  categories: jsonb("categories").$type<string[]>().default([]), // UNSPSC codes
  tenderType: text("tender_type"),

  // Value
  valueLow: integer("value_low"),
  valueHigh: integer("value_high"),
  valueIsEstimated: boolean("value_is_estimated").default(false),

  // Dates
  publishedAt: timestamp("published_at"),
  closesAt: timestamp("closes_at"),
  briefingAt: timestamp("briefing_at"),

  // Requirements
  certificationsRequired: jsonb("certifications_required").$type<string[]>().default([]),

  // AI Processing
  llmSummary: text("llm_summary"),
  llmExtractedData: jsonb("llm_extracted_data"),

  // Documents
  documentUrls: jsonb("document_urls").$type<string[]>().default([]),
  documentsStoragePath: text("documents_storage_path"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export type Tender = typeof tenders.$inferSelect;
export type NewTender = typeof tenders.$inferInsert;
"""

DB_SCHEMA_MATCHES = """import { pgTable, text, timestamp, integer, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { watches } from "./watches";
import { tenders } from "./tenders";

export const matchTierEnum = pgEnum("match_tier", ["strong", "maybe", "stretch"]);
export const userFeedbackEnum = pgEnum("user_feedback", ["positive", "negative"]);

export const matches = pgTable("matches", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  watchId: text("watch_id").notNull().references(() => watches.id, { onDelete: "cascade" }),
  tenderId: text("tender_id").notNull().references(() => tenders.id, { onDelete: "cascade" }),

  // Scoring
  score: integer("score").notNull(),
  tier: matchTierEnum("tier").notNull(),
  matchedKeywords: jsonb("matched_keywords").$type<string[]>().default([]),

  // AI Analysis
  llmRelevanceScore: integer("llm_relevance_score"),
  llmReasoning: text("llm_reasoning"),
  personalisedSummary: text("personalised_summary"),

  // User interaction
  userFeedback: userFeedbackEnum("user_feedback"),
  feedbackReason: text("feedback_reason"),
  isSaved: boolean("is_saved").default(false),
  isHidden: boolean("is_hidden").default(false),

  notifiedAt: timestamp("notified_at"),

  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Add missing import
import { boolean } from "drizzle-orm/pg-core";

export type Match = typeof matches.$inferSelect;
export type NewMatch = typeof matches.$inferInsert;
"""

DB_SCHEMA_USAGE = """import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { users } from "./users";

export const usage = pgTable("usage", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),

  matchesViewed: integer("matches_viewed").default(0).notNull(),
  documentsDownloaded: integer("documents_downloaded").default(0).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull()
});

export type Usage = typeof usage.$inferSelect;
export type NewUsage = typeof usage.$inferInsert;
"""

DB_SCHEMA_AUDIT = """import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { users } from "./users";

export const auditLog = pgTable("audit_log", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),

  action: text("action").notNull(),
  metadata: jsonb("metadata"),

  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),

  createdAt: timestamp("created_at").defaultNow().notNull()
});

export type AuditLog = typeof auditLog.$inferSelect;
export type NewAuditLog = typeof auditLog.$inferInsert;
"""

DB_INDEX = """export * from "./schema/users";
export * from "./schema/watches";
export * from "./schema/linked-accounts";
export * from "./schema/tenders";
export * from "./schema/matches";
export * from "./schema/usage";
export * from "./schema/audit";

export { db } from "./client";
"""

DB_CLIENT = """import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./index";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);

export const db = drizzle(client, { schema });
"""

# =============================================================================
# PACKAGES/AGENT
# =============================================================================

AGENT_PACKAGE_JSON = """{
  "name": "@tenderwatch/agent",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "test": "vitest",
    "clean": "rm -rf dist node_modules"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.14.0",
    "@browserbasehq/sdk": "^1.0.0",
    "playwright": "^1.40.0",
    "@tenderwatch/crypto": "workspace:*",
    "@tenderwatch/shared": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "vitest": "^1.0.0"
  }
}
"""

AGENT_BASE_ADAPTER = """import type { Page, Browser } from "playwright";

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
"""

AGENT_AUSTENDER_ADAPTER = """import { BaseSiteAdapter, LoginResult, TenderListing, TenderDetail, SearchParams } from "./base";

export class AusTenderAdapter extends BaseSiteAdapter {
  get siteName() {
    return "AusTender";
  }

  get siteUrl() {
    return "https://www.tenders.gov.au";
  }

  async login(username: string, password: string): Promise<LoginResult> {
    try {
      await this.navigateTo(`\${this.siteUrl}/Account/Login`);

      // Wait for login form
      await this.page.waitForSelector("#Email", { timeout: 10000 });

      // Fill credentials
      await this.page.fill("#Email", username);
      await this.page.fill("#Password", password);

      // Submit
      await this.page.click('button[type="submit"]');

      // Wait for redirect or error
      await this.page.waitForTimeout(3000);

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

  async search(params: SearchParams): Promise<TenderListing[]> {
    const listings: TenderListing[] = [];

    // Navigate to search page
    await this.navigateTo(`\${this.siteUrl}/Search/TenderSearch`);

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
        const sourceId = href?.match(/ATM(\\d+)/)?.[1] || "";

        listings.push({
          sourceId,
          title: title?.trim() || "",
          buyerOrg: (await buyerEl?.textContent())?.trim(),
          closesAt: closesEl ? new Date((await closesEl.textContent())?.trim() || "") : undefined,
          valueRange: (await valueEl?.textContent())?.trim(),
          url: `\${this.siteUrl}\${href}`
        });
      }
    }

    return listings;
  }

  async fetchTenderDetail(sourceId: string): Promise<TenderDetail> {
    await this.navigateTo(`\${this.siteUrl}/ATM/Show/\${sourceId}`);

    // Extract details from page
    const title = await this.page.$eval("h1", el => el.textContent?.trim() || "");
    const description = await this.page.$eval(".description", el => el.textContent?.trim() || "").catch(() => "");
    const buyerOrg = await this.page.$eval(".agency-name", el => el.textContent?.trim() || "").catch(() => "");

    // Extract document links
    const documentUrls: string[] = [];
    const docLinks = await this.page.$$(".documents a[href*='download']");
    for (const link of docLinks) {
      const href = await link.getAttribute("href");
      if (href) documentUrls.push(href.startsWith("http") ? href : `\${this.siteUrl}\${href}`);
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
"""

AGENT_INDEX = """export { BaseSiteAdapter } from "./adapters/base";
export type { LoginResult, TenderListing, TenderDetail, SearchParams } from "./adapters/base";
export { AusTenderAdapter } from "./adapters/austender";

// TODO: Add more adapters
// export { NSWeTenderAdapter } from "./adapters/nsw-etender";
// export { QLDTendersAdapter } from "./adapters/qld-qtenders";
// export { VICTendersAdapter } from "./adapters/vic-tenders";

import { Browser } from "playwright";
import { BaseSiteAdapter } from "./adapters/base";
import { AusTenderAdapter } from "./adapters/austender";

export function getAdapter(site: string, browser: Browser, page: any): BaseSiteAdapter {
  switch (site) {
    case "austender":
      return new AusTenderAdapter(browser, page);
    // TODO: Add more cases
    default:
      throw new Error(\`Unknown site: \${site}\`);
  }
}
"""

# =============================================================================
# PACKAGES/PROCESSOR
# =============================================================================

PROCESSOR_PACKAGE_JSON = """{
  "name": "@tenderwatch/processor",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "test": "vitest",
    "clean": "rm -rf dist node_modules"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.14.0",
    "pdf-parse": "^1.1.1",
    "@tenderwatch/shared": "workspace:*"
  },
  "devDependencies": {
    "@types/pdf-parse": "^1.1.4",
    "typescript": "^5.3.0",
    "vitest": "^1.0.0"
  }
}
"""

PROCESSOR_SUMMARIZER = """import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export type DetailLevel = "headlines" | "standard" | "deep";

export interface SummaryContext {
  watchName: string;
  companyName: string;
  keywordsMust: string[];
  keywordsBonus: string[];
  preferredSectors: string[];
  certificationsHeld: string[];
}

export async function generateSummary(
  tender: {
    title: string;
    description: string;
    fullText?: string;
    buyerOrg: string;
    closesAt?: Date;
    valueLow?: number;
    valueHigh?: number;
  },
  context: SummaryContext,
  detailLevel: DetailLevel
): Promise<string> {
  const prompts: Record<DetailLevel, string> = {
    headlines: \`Summarize this tender in ONE sentence (max 20 words). Focus on: what's being procured, value range, and deadline.

Tender: \${tender.title}
Description: \${tender.description?.slice(0, 500)}
Buyer: \${tender.buyerOrg}
Closes: \${tender.closesAt?.toISOString() || "Not specified"}
Value: \${tender.valueLow ? \`$\${tender.valueLow.toLocaleString()} - $\${tender.valueHigh?.toLocaleString() || "TBC"}\` : "Not specified"}

One-line summary:\`,

    standard: \`Create a 3-4 sentence summary of this tender for \${context.companyName}.

They're looking for: \${context.keywordsMust.join(", ")}
Bonus interests: \${context.keywordsBonus.join(", ")}
Sectors: \${context.preferredSectors.join(", ")}

Tender: \${tender.title}
Description: \${tender.description?.slice(0, 2000)}
Buyer: \${tender.buyerOrg}
Closes: \${tender.closesAt?.toISOString() || "Not specified"}
Value: \${tender.valueLow ? \`$\${tender.valueLow.toLocaleString()} - $\${tender.valueHigh?.toLocaleString() || "TBC"}\` : "Not specified"}

Highlight what matters to THIS company. Mention any potential concerns or requirements they should know about. Be direct and actionable.\`,

    deep: \`Provide a detailed analysis of this tender for \${context.companyName}.

Company context:
- Looking for: \${context.keywordsMust.join(", ")}
- Also interested in: \${context.keywordsBonus.join(", ")}
- Sectors: \${context.preferredSectors.join(", ")}
- Certifications held: \${context.certificationsHeld.join(", ") || "None specified"}

Tender details:
Title: \${tender.title}
Buyer: \${tender.buyerOrg}
Closes: \${tender.closesAt?.toISOString() || "Not specified"}
Value: \${tender.valueLow ? \`$\${tender.valueLow.toLocaleString()} - $\${tender.valueHigh?.toLocaleString() || "TBC"}\` : "Not specified"}

Full content:
\${tender.fullText?.slice(0, 8000) || tender.description}

Provide:
1. Executive summary (2-3 sentences)
2. Key requirements and deliverables
3. Evaluation criteria (if mentioned)
4. Potential challenges or red flags
5. Why this might be a good/bad fit for this company
6. Recommended next steps

Be specific and actionable. Don't pad with filler.\`
  };

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: detailLevel === "deep" ? 1500 : 500,
    messages: [
      {
        role: "user",
        content: prompts[detailLevel]
      }
    ]
  });

  const textContent = response.content.find(c => c.type === "text");
  return textContent?.text || "";
}
"""

PROCESSOR_MATCHER = """export interface MatchResult {
  score: number;
  tier: "strong" | "maybe" | "stretch" | "reject";
  matchedKeywords: string[];
  reasoning: string;
}

export interface MatchConfig {
  keywordsMust: string[];
  keywordsBonus: string[];
  keywordsExclude: string[];
  regions: string[];
  valueMin?: number;
  valueMax?: number;
  includeUnspecifiedValue: boolean;
  minResponseDays?: number;
  preferredSectors: string[];
  preferredBuyers: string[];
  certificationsHeld: string[];
  sensitivity: "strict" | "balanced" | "adventurous";
}

export interface TenderForMatching {
  title: string;
  description: string;
  fullText?: string;
  regions: string[];
  categories: string[];
  buyerOrg?: string;
  valueLow?: number;
  valueHigh?: number;
  closesAt?: Date;
  certificationsRequired: string[];
}

export function matchTender(
  tender: TenderForMatching,
  config: MatchConfig
): MatchResult {
  let score = 0;
  const matchedKeywords: string[] = [];
  const reasons: string[] = [];

  const searchText = \`\${tender.title} \${tender.description} \${tender.fullText || ""}\`.toLowerCase();

  // HARD FILTERS - instant rejection

  // Excluded keywords
  for (const keyword of config.keywordsExclude) {
    if (searchText.includes(keyword.toLowerCase())) {
      return {
        score: 0,
        tier: "reject",
        matchedKeywords: [],
        reasoning: \`Contains excluded keyword: "\${keyword}"\`
      };
    }
  }

  // Region filter (if specified)
  if (config.regions.length > 0) {
    const regionMatch = config.regions.some(r => 
      tender.regions.some(tr => tr.toLowerCase().includes(r.toLowerCase()))
    );
    if (!regionMatch) {
      return {
        score: 0,
        tier: "reject",
        matchedKeywords: [],
        reasoning: "Not in target regions"
      };
    }
  }

  // Value range filter
  if (tender.valueLow !== undefined) {
    if (config.valueMin && tender.valueLow < config.valueMin) {
      return {
        score: 0,
        tier: "reject",
        matchedKeywords: [],
        reasoning: \`Value ($\${tender.valueLow.toLocaleString()}) below minimum ($\${config.valueMin.toLocaleString()})\`
      };
    }
    if (config.valueMax && tender.valueHigh && tender.valueHigh > config.valueMax) {
      return {
        score: 0,
        tier: "reject",
        matchedKeywords: [],
        reasoning: \`Value ($\${tender.valueHigh.toLocaleString()}) above maximum ($\${config.valueMax.toLocaleString()})\`
      };
    }
  } else if (!config.includeUnspecifiedValue) {
    return {
      score: 0,
      tier: "reject",
      matchedKeywords: [],
      reasoning: "Value not specified (excluded by preference)"
    };
  }

  // Response time filter
  if (config.minResponseDays && tender.closesAt) {
    const daysUntilClose = Math.floor(
      (tender.closesAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntilClose < config.minResponseDays) {
      return {
        score: 0,
        tier: "reject",
        matchedKeywords: [],
        reasoning: \`Only \${daysUntilClose} days to respond (minimum: \${config.minResponseDays})\`
      };
    }
  }

  // SCORING

  // Must-have keywords (40 points each, max 120)
  let mustMatchCount = 0;
  for (const keyword of config.keywordsMust) {
    if (searchText.includes(keyword.toLowerCase())) {
      mustMatchCount++;
      matchedKeywords.push(keyword);
      if (mustMatchCount <= 3) {
        score += 40;
      }
    }
  }
  if (mustMatchCount > 0) {
    reasons.push(\`Matched \${mustMatchCount} must-have keyword(s)\`);
  }

  // Bonus keywords (15 points each, max 45)
  let bonusMatchCount = 0;
  for (const keyword of config.keywordsBonus) {
    if (searchText.includes(keyword.toLowerCase())) {
      bonusMatchCount++;
      matchedKeywords.push(keyword);
      if (bonusMatchCount <= 3) {
        score += 15;
      }
    }
  }
  if (bonusMatchCount > 0) {
    reasons.push(\`Matched \${bonusMatchCount} bonus keyword(s)\`);
  }

  // Sector match (20 points)
  const sectorMatch = config.preferredSectors.some(s =>
    tender.categories.some(c => c.toLowerCase().includes(s.toLowerCase()))
  );
  if (sectorMatch) {
    score += 20;
    reasons.push("Sector match");
  }

  // Preferred buyer match (25 points)
  if (tender.buyerOrg && config.preferredBuyers.length > 0) {
    const buyerMatch = config.preferredBuyers.some(b =>
      tender.buyerOrg!.toLowerCase().includes(b.toLowerCase())
    );
    if (buyerMatch) {
      score += 25;
      reasons.push("Preferred buyer");
    }
  }

  // Certification match (10 points)
  if (tender.certificationsRequired.length > 0 && config.certificationsHeld.length > 0) {
    const certMatch = tender.certificationsRequired.some(c =>
      config.certificationsHeld.some(h => h.toLowerCase().includes(c.toLowerCase()))
    );
    if (certMatch) {
      score += 10;
      reasons.push("Certification match");
    }
  }

  // Determine tier based on sensitivity
  const thresholds = {
    strict: { strong: 80, maybe: 50, stretch: 30 },
    balanced: { strong: 70, maybe: 40, stretch: 20 },
    adventurous: { strong: 50, maybe: 25, stretch: 10 }
  }[config.sensitivity];

  let tier: "strong" | "maybe" | "stretch" | "reject";
  if (score >= thresholds.strong) {
    tier = "strong";
  } else if (score >= thresholds.maybe) {
    tier = "maybe";
  } else if (score >= thresholds.stretch && config.sensitivity === "adventurous") {
    tier = "stretch";
  } else if (score >= thresholds.stretch && config.sensitivity !== "strict") {
    tier = "stretch";
  } else {
    tier = "reject";
  }

  return {
    score,
    tier,
    matchedKeywords,
    reasoning: reasons.join(". ") || "No significant matches"
  };
}
"""

PROCESSOR_INDEX = """export { generateSummary } from "./summarizer";
export type { DetailLevel, SummaryContext } from "./summarizer";

export { matchTender } from "./matcher";
export type { MatchResult, MatchConfig, TenderForMatching } from "./matcher";
"""

# =============================================================================
# PACKAGES/JOBS
# =============================================================================

JOBS_PACKAGE_JSON = """{
  "name": "@tenderwatch/jobs",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "dev": "inngest-cli dev",
    "clean": "rm -rf dist node_modules"
  },
  "dependencies": {
    "inngest": "^3.0.0",
    "@tenderwatch/db": "workspace:*",
    "@tenderwatch/agent": "workspace:*",
    "@tenderwatch/processor": "workspace:*",
    "@tenderwatch/crypto": "workspace:*",
    "@tenderwatch/shared": "workspace:*"
  },
  "devDependencies": {
    "inngest-cli": "^0.28.0",
    "typescript": "^5.3.0"
  }
}
"""

JOBS_CLIENT = """import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "tenderwatch",
  eventKey: process.env.INNGEST_EVENT_KEY
});
"""

JOBS_SYNC_ACCOUNT = """import { inngest } from "./client";
import { db } from "@tenderwatch/db";
import { linkedAccounts, tenders } from "@tenderwatch/db";
import { eq } from "drizzle-orm";
import { getAdapter } from "@tenderwatch/agent";
import { decrypt } from "@tenderwatch/crypto";

export const syncAccount = inngest.createFunction(
  {
    id: "sync-account",
    retries: 3,
    concurrency: {
      limit: 5 // Max 5 accounts syncing at once
    }
  },
  { event: "account/sync" },
  async ({ event, step }) => {
    const { accountId } = event.data;

    // Get account details
    const account = await step.run("get-account", async () => {
      const result = await db.query.linkedAccounts.findFirst({
        where: eq(linkedAccounts.id, accountId)
      });
      if (!result) throw new Error(\`Account not found: \${accountId}\`);
      return result;
    });

    // Decrypt credentials
    const credentials = await step.run("decrypt-credentials", async () => {
      return decrypt(account.encryptedCredentials);
    });

    // Spin up browser and sync
    const discoveredTenders = await step.run("sync-portal", async () => {
      // TODO: Initialize Browserbase session
      // const browser = await browserbase.connect();
      // const page = await browser.newPage();
      // const adapter = getAdapter(account.site, browser, page);

      // For now, return empty array
      console.log(\`Would sync \${account.site} for user \${account.userId}\`);
      return [];
    });

    // Update account status
    await step.run("update-status", async () => {
      await db.update(linkedAccounts)
        .set({
          lastSyncAt: new Date(),
          status: "connected",
          lastError: null,
          updatedAt: new Date()
        })
        .where(eq(linkedAccounts.id, accountId));
    });

    // Trigger processing for each new tender
    for (const tender of discoveredTenders) {
      await step.sendEvent("queue-processing", {
        name: "tender/process",
        data: { tenderId: tender.id, accountId }
      });
    }

    return { discovered: discoveredTenders.length };
  }
);
"""

JOBS_PROCESS_TENDER = """import { inngest } from "./client";
import { db } from "@tenderwatch/db";
import { tenders, watches, matches } from "@tenderwatch/db";
import { eq } from "drizzle-orm";
import { matchTender, generateSummary } from "@tenderwatch/processor";

export const processTender = inngest.createFunction(
  {
    id: "process-tender",
    retries: 2
  },
  { event: "tender/process" },
  async ({ event, step }) => {
    const { tenderId } = event.data;

    // Get tender
    const tender = await step.run("get-tender", async () => {
      const result = await db.query.tenders.findFirst({
        where: eq(tenders.id, tenderId)
      });
      if (!result) throw new Error(\`Tender not found: \${tenderId}\`);
      return result;
    });

    // Get all active watches
    const activeWatches = await step.run("get-watches", async () => {
      return db.query.watches.findMany({
        where: eq(watches.isActive, true)
      });
    });

    // Match against each watch
    const matchResults = await step.run("match-watches", async () => {
      const results = [];

      for (const watch of activeWatches) {
        const matchResult = matchTender(
          {
            title: tender.title,
            description: tender.description || "",
            fullText: tender.fullText || undefined,
            regions: tender.regions || [],
            categories: tender.categories || [],
            buyerOrg: tender.buyerOrg || undefined,
            valueLow: tender.valueLow || undefined,
            valueHigh: tender.valueHigh || undefined,
            closesAt: tender.closesAt || undefined,
            certificationsRequired: tender.certificationsRequired || []
          },
          {
            keywordsMust: watch.keywordsMust || [],
            keywordsBonus: watch.keywordsBonus || [],
            keywordsExclude: watch.keywordsExclude || [],
            regions: watch.regions || [],
            valueMin: watch.valueMin || undefined,
            valueMax: watch.valueMax || undefined,
            includeUnspecifiedValue: watch.includeUnspecifiedValue ?? true,
            minResponseDays: watch.minResponseDays || undefined,
            preferredSectors: watch.preferredSectors || [],
            preferredBuyers: watch.preferredBuyers || [],
            certificationsHeld: watch.certificationsHeld || [],
            sensitivity: watch.sensitivity
          }
        );

        if (matchResult.tier !== "reject") {
          results.push({
            watchId: watch.id,
            ...matchResult
          });
        }
      }

      return results;
    });

    // Save matches and generate summaries
    for (const result of matchResults) {
      await step.run(\`save-match-\${result.watchId}\`, async () => {
        // Get watch for summary context
        const watch = activeWatches.find(w => w.id === result.watchId)!;

        // Generate personalised summary if Pro user
        // TODO: Check user plan
        let summary: string | undefined;

        // Insert match
        await db.insert(matches).values({
          watchId: result.watchId,
          tenderId: tender.id,
          score: result.score,
          tier: result.tier,
          matchedKeywords: result.matchedKeywords,
          llmReasoning: result.reasoning,
          personalisedSummary: summary
        });
      });
    }

    return { matchCount: matchResults.length };
  }
);
"""

JOBS_SEND_DIGEST = """import { inngest } from "./client";
import { db } from "@tenderwatch/db";
import { users, matches, watches, tenders } from "@tenderwatch/db";
import { eq, and, isNull, gte } from "drizzle-orm";

export const sendDigest = inngest.createFunction(
  {
    id: "send-digest",
    retries: 2
  },
  { cron: "0 7 * * *" }, // 7 AM daily
  async ({ step }) => {
    // Get users who need daily digests
    const usersToNotify = await step.run("get-users", async () => {
      return db.query.users.findMany({
        where: eq(users.onboardingCompleted, true)
      });
    });

    let sentCount = 0;

    for (const user of usersToNotify) {
      await step.run(\`send-digest-\${user.id}\`, async () => {
        // Get user's watches with daily delivery
        const userWatches = await db.query.watches.findMany({
          where: and(
            eq(watches.userId, user.id),
            eq(watches.isActive, true),
            eq(watches.deliveryMethod, "daily")
          )
        });

        if (userWatches.length === 0) return;

        const watchIds = userWatches.map(w => w.id);

        // Get unnotified matches from past 24 hours
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // TODO: Query matches and send email
        console.log(\`Would send digest to \${user.email} for \${watchIds.length} watches\`);
        sentCount++;
      });
    }

    return { sent: sentCount };
  }
);
"""

JOBS_INDEX = """export { inngest } from "./client";
export { syncAccount } from "./sync-account";
export { processTender } from "./process-tender";
export { sendDigest } from "./send-digest";

// Export all functions for Inngest serve
import { syncAccount } from "./sync-account";
import { processTender } from "./process-tender";
import { sendDigest } from "./send-digest";

export const functions = [syncAccount, processTender, sendDigest];
"""

# =============================================================================
# PACKAGES/CRYPTO
# =============================================================================

CRYPTO_PACKAGE_JSON = """{
  "name": "@tenderwatch/crypto",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "test": "vitest",
    "clean": "rm -rf dist node_modules"
  },
  "dependencies": {
    "libsodium-wrappers": "^0.7.13"
  },
  "devDependencies": {
    "@types/libsodium-wrappers": "^0.7.13",
    "typescript": "^5.3.0",
    "vitest": "^1.0.0"
  }
}
"""

CRYPTO_INDEX = """import sodium from "libsodium-wrappers";

let initialized = false;

async function ensureInit() {
  if (!initialized) {
    await sodium.ready;
    initialized = true;
  }
}

function getKey(): Uint8Array {
  const keyHex = process.env.CREDENTIAL_ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64) {
    throw new Error("CREDENTIAL_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)");
  }
  return sodium.from_hex(keyHex);
}

export interface EncryptedData {
  nonce: string;
  ciphertext: string;
}

export async function encrypt(plaintext: string): Promise<string> {
  await ensureInit();

  const key = getKey();
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const message = sodium.from_string(plaintext);

  const ciphertext = sodium.crypto_secretbox_easy(message, nonce, key);

  const data: EncryptedData = {
    nonce: sodium.to_base64(nonce),
    ciphertext: sodium.to_base64(ciphertext)
  };

  return JSON.stringify(data);
}

export async function decrypt(encryptedJson: string): Promise<string> {
  await ensureInit();

  const key = getKey();
  const data: EncryptedData = JSON.parse(encryptedJson);

  const nonce = sodium.from_base64(data.nonce);
  const ciphertext = sodium.from_base64(data.ciphertext);

  const plaintext = sodium.crypto_secretbox_open_easy(ciphertext, nonce, key);

  return sodium.to_string(plaintext);
}

export function generateKey(): string {
  // Helper to generate a new encryption key
  const key = sodium.randombytes_buf(sodium.crypto_secretbox_KEYBYTES);
  return sodium.to_hex(key);
}
"""

# =============================================================================
# PACKAGES/BILLING
# =============================================================================

BILLING_PACKAGE_JSON = """{
  "name": "@tenderwatch/billing",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "clean": "rm -rf dist node_modules"
  },
  "dependencies": {
    "stripe": "^14.0.0",
    "@tenderwatch/db": "workspace:*",
    "@tenderwatch/shared": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.3.0"
  }
}
"""

BILLING_STRIPE = """import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16"
});
"""

BILLING_LIMITS = """import { db } from "@tenderwatch/db";
import { users, usage, watches, linkedAccounts } from "@tenderwatch/db";
import { eq, and, gte, lte, count } from "drizzle-orm";

export type LimitType = "watches" | "matches" | "accounts" | "documents";
export type Plan = "free" | "pro";

const LIMITS: Record<Plan, Record<LimitType, number>> = {
  free: {
    watches: 1,
    matches: 3,      // per month
    accounts: 1,
    documents: 0     // no downloads
  },
  pro: {
    watches: Infinity,
    matches: Infinity,
    accounts: 20,
    documents: Infinity
  }
};

export interface LimitCheck {
  allowed: boolean;
  current: number;
  limit: number;
  plan: Plan;
}

export async function checkLimit(
  userId: string,
  limitType: LimitType
): Promise<LimitCheck> {
  // Get user's plan
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId)
  });

  if (!user) {
    throw new Error("User not found");
  }

  const plan = user.plan as Plan;
  const limit = LIMITS[plan][limitType];

  let current: number;

  switch (limitType) {
    case "watches":
      const watchCount = await db
        .select({ count: count() })
        .from(watches)
        .where(eq(watches.userId, userId));
      current = watchCount[0]?.count || 0;
      break;

    case "accounts":
      const accountCount = await db
        .select({ count: count() })
        .from(linkedAccounts)
        .where(eq(linkedAccounts.userId, userId));
      current = accountCount[0]?.count || 0;
      break;

    case "matches":
    case "documents":
      // Get current period usage
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const usageRecord = await db.query.usage.findFirst({
        where: and(
          eq(usage.userId, userId),
          gte(usage.periodStart, periodStart),
          lte(usage.periodEnd, periodEnd)
        )
      });

      current = limitType === "matches"
        ? usageRecord?.matchesViewed || 0
        : usageRecord?.documentsDownloaded || 0;
      break;

    default:
      current = 0;
  }

  return {
    allowed: current < limit,
    current,
    limit: limit === Infinity ? -1 : limit,
    plan
  };
}

export async function incrementUsage(
  userId: string,
  type: "matches" | "documents"
): Promise<void> {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Get or create usage record
  let usageRecord = await db.query.usage.findFirst({
    where: and(
      eq(usage.userId, userId),
      gte(usage.periodStart, periodStart),
      lte(usage.periodEnd, periodEnd)
    )
  });

  if (!usageRecord) {
    const [newRecord] = await db.insert(usage).values({
      userId,
      periodStart,
      periodEnd,
      matchesViewed: 0,
      documentsDownloaded: 0
    }).returning();
    usageRecord = newRecord;
  }

  // Increment
  const field = type === "matches" ? "matchesViewed" : "documentsDownloaded";
  await db.update(usage)
    .set({
      [field]: (usageRecord[field] || 0) + 1
    })
    .where(eq(usage.id, usageRecord.id));
}

export type Feature = 
  | "ai_summaries"
  | "semantic_matching"
  | "document_downloads"
  | "instant_alerts"
  | "csv_export";

const PRO_FEATURES: Feature[] = [
  "ai_summaries",
  "semantic_matching",
  "document_downloads",
  "instant_alerts",
  "csv_export"
];

export async function canUseFeature(
  userId: string,
  feature: Feature
): Promise<boolean> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId)
  });

  if (!user) return false;

  if (user.plan === "pro") return true;

  return !PRO_FEATURES.includes(feature);
}
"""

BILLING_INDEX = """export { stripe } from "./stripe";
export { checkLimit, incrementUsage, canUseFeature } from "./limits";
export type { LimitType, LimitCheck, Feature, Plan } from "./limits";
"""

# =============================================================================
# PACKAGES/SHARED
# =============================================================================

SHARED_PACKAGE_JSON = """{
  "name": "@tenderwatch/shared",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "clean": "rm -rf dist node_modules"
  },
  "dependencies": {
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0"
  }
}
"""

SHARED_CONSTANTS = """export const SITES = {
  austender: {
    name: "AusTender",
    url: "https://www.tenders.gov.au",
    hasApi: true
  },
  nsw_etender: {
    name: "NSW eTendering",
    url: "https://tenders.nsw.gov.au",
    hasApi: true
  },
  qld_qtenders: {
    name: "QLD QTenders",
    url: "https://qtenders.epw.qld.gov.au",
    hasApi: false
  },
  vic_tenders: {
    name: "VIC Tenders",
    url: "https://www.tenders.vic.gov.au",
    hasApi: false
  },
  sa_tenders: {
    name: "SA Tenders",
    url: "https://www.tenders.sa.gov.au",
    hasApi: false
  },
  wa_tenders: {
    name: "WA Tenders",
    url: "https://www.tenders.wa.gov.au",
    hasApi: false
  },
  vendorpanel: {
    name: "VendorPanel",
    url: "https://www.vendorpanel.com",
    hasApi: false
  },
  tenderlink: {
    name: "TenderLink",
    url: "https://www.tenderlink.com",
    hasApi: false
  }
} as const;

export type SiteKey = keyof typeof SITES;

export const REGIONS = [
  "National",
  "New South Wales",
  "Victoria",
  "Queensland",
  "Western Australia",
  "South Australia",
  "Tasmania",
  "Northern Territory",
  "Australian Capital Territory"
] as const;

export type Region = typeof REGIONS[number];

export const TENDER_TYPES = [
  "Open Tender",
  "Select Tender",
  "Multi-Use List",
  "Panel",
  "Pre-qualification",
  "Expression of Interest",
  "Request for Quote"
] as const;

export type TenderType = typeof TENDER_TYPES[number];

export const MATCH_TIERS = ["strong", "maybe", "stretch"] as const;
export type MatchTier = typeof MATCH_TIERS[number];
"""

SHARED_TYPES = """import { z } from "zod";

// Watch schemas
export const createWatchSchema = z.object({
  name: z.string().min(1).max(100),
  keywordsMust: z.array(z.string()).default([]),
  keywordsBonus: z.array(z.string()).default([]),
  keywordsExclude: z.array(z.string()).default([]),
  regions: z.array(z.string()).default([]),
  valueMin: z.number().int().positive().optional(),
  valueMax: z.number().int().positive().optional(),
  includeUnspecifiedValue: z.boolean().default(true),
  tenderTypes: z.array(z.string()).default([]),
  minResponseDays: z.number().int().positive().optional(),
  preferredSectors: z.array(z.string()).default([]),
  preferredBuyers: z.array(z.string()).default([]),
  certificationsHeld: z.array(z.string()).default([]),
  sensitivity: z.enum(["strict", "balanced", "adventurous"]).default("balanced"),
  deliveryMethod: z.enum(["instant", "daily", "weekly"]).default("daily"),
  detailLevel: z.enum(["headlines", "standard", "deep"]).default("standard")
});

export type CreateWatchInput = z.infer<typeof createWatchSchema>;

// Linked account schemas
export const linkAccountSchema = z.object({
  site: z.string(),
  username: z.string().min(1),
  password: z.string().min(1)
});

export type LinkAccountInput = z.infer<typeof linkAccountSchema>;

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
"""

SHARED_INDEX = """export * from "./constants";
export * from "./types";
"""

# =============================================================================
# APPS/EMAIL
# =============================================================================

EMAIL_PACKAGE_JSON = """{
  "name": "@tenderwatch/email",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "email dev --port 3001",
    "build": "tsc",
    "clean": "rm -rf dist node_modules"
  },
  "dependencies": {
    "@react-email/components": "^0.0.15",
    "react": "^18.2.0",
    "react-email": "^2.0.0",
    "resend": "^2.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "typescript": "^5.3.0"
  }
}
"""

EMAIL_WELCOME = """import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text
} from "@react-email/components";
import * as React from "react";

interface WelcomeEmailProps {
  userName: string;
  companyName?: string;
}

export default function WelcomeEmail({
  userName = "there",
  companyName
}: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to TenderWatch - Let's find your next contract</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to TenderWatch! 🎉</Heading>

          <Text style={text}>
            Hi {userName},
          </Text>

          <Text style={text}>
            {companyName
              ? \`Great to have \${companyName} on board!\`
              : "Great to have you on board!"
            } You've just taken the first step towards never missing a relevant government tender again.
          </Text>

          <Section style={buttonContainer}>
            <Link
              href="https://tenderwatch.io/dashboard"
              style={button}
            >
              Go to Dashboard
            </Link>
          </Section>

          <Text style={text}>
            <strong>Here's what to do next:</strong>
          </Text>

          <Text style={text}>
            1. <strong>Create your first Watch</strong> - Tell us what you're looking for with keywords and filters
          </Text>

          <Text style={text}>
            2. <strong>Link your accounts</strong> - Connect your AusTender, state portals, or VendorPanel accounts
          </Text>

          <Text style={text}>
            3. <strong>Sit back</strong> - We'll scan every portal and email you when we find matches
          </Text>

          <Text style={text}>
            Questions? Just reply to this email - we're here to help.
          </Text>

          <Text style={footer}>
            — The TenderWatch Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "560px"
};

const h1 = {
  color: "#1a1a1a",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "1.25",
  marginBottom: "24px"
};

const text = {
  color: "#4a4a4a",
  fontSize: "16px",
  lineHeight: "1.5",
  marginBottom: "16px"
};

const buttonContainer = {
  textAlign: "center" as const,
  marginTop: "24px",
  marginBottom: "24px"
};

const button = {
  backgroundColor: "#2563eb",
  borderRadius: "6px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "16px",
  fontWeight: "600",
  padding: "12px 24px",
  textDecoration: "none"
};

const footer = {
  color: "#8898aa",
  fontSize: "14px",
  marginTop: "32px"
};
"""

EMAIL_DIGEST = """import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text
} from "@react-email/components";
import * as React from "react";

interface TenderMatch {
  id: string;
  title: string;
  buyerOrg: string;
  closesAt: string;
  tier: "strong" | "maybe" | "stretch";
  summary: string;
  url: string;
}

interface DigestEmailProps {
  userName: string;
  matches: TenderMatch[];
  watchName: string;
  date: string;
}

export default function DigestEmail({
  userName = "there",
  matches = [],
  watchName = "My Watch",
  date = new Date().toLocaleDateString()
}: DigestEmailProps) {
  const strongMatches = matches.filter(m => m.tier === "strong");
  const maybeMatches = matches.filter(m => m.tier === "maybe");

  return (
    <Html>
      <Head />
      <Preview>
        {matches.length} new tender{matches.length !== 1 ? "s" : ""} matching "{watchName}"
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Your Tender Digest</Heading>

          <Text style={text}>
            Hi {userName}, here's what we found for <strong>"{watchName}"</strong> today.
          </Text>

          {strongMatches.length > 0 && (
            <Section>
              <Heading as="h2" style={h2}>
                🎯 Strong Matches ({strongMatches.length})
              </Heading>
              {strongMatches.map(match => (
                <TenderCard key={match.id} match={match} />
              ))}
            </Section>
          )}

          {maybeMatches.length > 0 && (
            <Section>
              <Hr style={hr} />
              <Heading as="h2" style={h2}>
                🤔 Worth a Look ({maybeMatches.length})
              </Heading>
              {maybeMatches.map(match => (
                <TenderCard key={match.id} match={match} />
              ))}
            </Section>
          )}

          {matches.length === 0 && (
            <Text style={text}>
              No new matches today. We'll keep looking!
            </Text>
          )}

          <Hr style={hr} />

          <Section style={buttonContainer}>
            <Link
              href="https://tenderwatch.io/dashboard"
              style={button}
            >
              View All Matches
            </Link>
          </Section>

          <Text style={footer}>
            You're receiving this because you have a Watch set up on TenderWatch.
            <br />
            <Link href="https://tenderwatch.io/settings/notifications" style={footerLink}>
              Manage notifications
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

function TenderCard({ match }: { match: TenderMatch }) {
  return (
    <Section style={card}>
      <Link href={match.url} style={cardTitle}>
        {match.title}
      </Link>
      <Text style={cardMeta}>
        {match.buyerOrg} • Closes {match.closesAt}
      </Text>
      <Text style={cardSummary}>{match.summary}</Text>
    </Section>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "600px"
};

const h1 = {
  color: "#1a1a1a",
  fontSize: "24px",
  fontWeight: "600",
  marginBottom: "16px"
};

const h2 = {
  color: "#1a1a1a",
  fontSize: "18px",
  fontWeight: "600",
  marginTop: "24px",
  marginBottom: "16px"
};

const text = {
  color: "#4a4a4a",
  fontSize: "16px",
  lineHeight: "1.5"
};

const hr = {
  borderColor: "#e6e6e6",
  margin: "24px 0"
};

const card = {
  backgroundColor: "#f8fafc",
  borderRadius: "8px",
  padding: "16px",
  marginBottom: "12px"
};

const cardTitle = {
  color: "#2563eb",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none"
};

const cardMeta = {
  color: "#64748b",
  fontSize: "14px",
  margin: "4px 0 8px"
};

const cardSummary = {
  color: "#4a4a4a",
  fontSize: "14px",
  lineHeight: "1.4",
  margin: "0"
};

const buttonContainer = {
  textAlign: "center" as const,
  marginTop: "24px"
};

const button = {
  backgroundColor: "#2563eb",
  borderRadius: "6px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "16px",
  fontWeight: "600",
  padding: "12px 24px",
  textDecoration: "none"
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  marginTop: "32px",
  textAlign: "center" as const
};

const footerLink = {
  color: "#8898aa"
};
"""

# =============================================================================
# COMPONENT STUBS
# =============================================================================

MARKETING_NAV = """import Link from "next/link";

export function MarketingNav() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl">
          TenderWatch
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/how-it-works" className="text-muted-foreground hover:text-foreground">
            How It Works
          </Link>
          <Link href="/pricing" className="text-muted-foreground hover:text-foreground">
            Pricing
          </Link>
          <Link href="/login" className="text-muted-foreground hover:text-foreground">
            Login
          </Link>
          <Link
            href="/signup"
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90"
          >
            Get Started
          </Link>
        </nav>
      </div>
    </header>
  );
}
"""

MARKETING_FOOTER = """import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="border-t py-12 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold mb-4">TenderWatch</h3>
            <p className="text-sm text-muted-foreground">
              AI-powered tender intelligence for Australian businesses.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/how-it-works">How It Works</Link></li>
              <li><Link href="/pricing">Pricing</Link></li>
              <li><Link href="/security">Security</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/about">About</Link></li>
              <li><Link href="/blog">Blog</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/terms">Terms of Service</Link></li>
              <li><Link href="/privacy">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} TenderWatch. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
"""

DASHBOARD_NAV = """import Link from "next/link";
import { User } from "@supabase/supabase-js";

export function DashboardNav({ user }: { user: User }) {
  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/dashboard" className="font-bold text-xl">
          TenderWatch
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {user.email}
          </span>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
"""

DASHBOARD_SIDEBAR = """import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Search, Eye, Link2, Settings } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/tenders", label: "Tenders", icon: Search },
  { href: "/dashboard/watches", label: "Watches", icon: Eye },
  { href: "/dashboard/accounts", label: "Accounts", icon: Link2 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings }
];

export function DashboardSidebar() {
  return (
    <aside className="w-64 border-r min-h-[calc(100vh-4rem)] p-4">
      <nav className="space-y-1">
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition"
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
"""

DASHBOARD_STATS = """export async function DashboardStats() {
  // TODO: Fetch real stats
  const stats = {
    activeWatches: 2,
    newMatches: 5,
    savedTenders: 12,
    linkedAccounts: 3
  };

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Active Watches" value={stats.activeWatches} />
      <StatCard label="New Matches" value={stats.newMatches} highlight />
      <StatCard label="Saved Tenders" value={stats.savedTenders} />
      <StatCard label="Linked Accounts" value={stats.linkedAccounts} />
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className={`p-6 rounded-xl border ${highlight ? "bg-primary/5 border-primary/20" : "bg-background"}`}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${highlight ? "text-primary" : ""}`}>
        {value}
      </p>
    </div>
  );
}
"""

DASHBOARD_RECENT_MATCHES = """export async function RecentMatches() {
  // TODO: Fetch real matches
  const matches: any[] = [];

  return (
    <div className="border rounded-xl p-6">
      <h2 className="text-lg font-semibold mb-4">Recent Matches</h2>
      {matches.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No matches yet. Create a Watch to start finding tenders.
        </p>
      ) : (
        <ul className="space-y-4">
          {matches.map(match => (
            <li key={match.id} className="border-b pb-4 last:border-0">
              {/* Match details */}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
"""

DASHBOARD_ACTIVE_WATCHES = """import Link from "next/link";

export async function ActiveWatches() {
  // TODO: Fetch real watches
  const watches: any[] = [];

  return (
    <div className="border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Active Watches</h2>
        <Link
          href="/dashboard/watches/new"
          className="text-sm text-primary hover:underline"
        >
          + Create Watch
        </Link>
      </div>
      {watches.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No watches yet. Create one to start monitoring for tenders.
        </p>
      ) : (
        <ul className="space-y-3">
          {watches.map(watch => (
            <li key={watch.id} className="flex items-center justify-between">
              {/* Watch details */}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
"""


# =============================================================================
# DIRECTORY STRUCTURE
# =============================================================================

def create_directory_structure():
    """Define all directories to create"""
    return [
        # Root
        ".github/workflows",

        # Apps
        "apps/web/src/app/(marketing)",
        "apps/web/src/app/(auth)",
        "apps/web/src/app/(onboarding)",
        "apps/web/src/app/(dashboard)/dashboard",
        "apps/web/src/app/(dashboard)/dashboard/tenders",
        "apps/web/src/app/(dashboard)/dashboard/watches",
        "apps/web/src/app/(dashboard)/dashboard/accounts",
        "apps/web/src/app/(dashboard)/dashboard/settings",
        "apps/web/src/app/admin",
        "apps/web/src/app/api/webhooks/stripe",
        "apps/web/src/app/api/webhooks/inngest",
        "apps/web/src/app/api/auth",
        "apps/web/src/components/marketing",
        "apps/web/src/components/dashboard",
        "apps/web/src/components/ui",
        "apps/web/src/lib/supabase",
        "apps/web/src/lib/actions",
        "apps/web/public",

        "apps/email/emails",

        # Packages
        "packages/db/src/schema",
        "packages/db/drizzle",

        "packages/agent/src/adapters",

        "packages/processor/src",

        "packages/jobs/src",

        "packages/crypto/src",

        "packages/billing/src",

        "packages/shared/src",
    ]


def create_files():
    """Define all files to create with their contents"""
    return {
        # Root configs
        "package.json": ROOT_PACKAGE_JSON,
        "pnpm-workspace.yaml": PNPM_WORKSPACE,
        "turbo.json": TURBO_JSON,
        "tsconfig.json": ROOT_TSCONFIG,
        ".env.example": ENV_EXAMPLE,
        ".gitignore": GITIGNORE,
        ".nvmrc": NVMRC,
        "README.md": README,

        # Web app
        "apps/web/package.json": WEB_PACKAGE_JSON,
        "apps/web/tsconfig.json": WEB_TSCONFIG,
        "apps/web/next.config.js": NEXT_CONFIG,
        "apps/web/tailwind.config.js": TAILWIND_CONFIG,
        "apps/web/postcss.config.js": POSTCSS_CONFIG,
        "apps/web/src/middleware.ts": MIDDLEWARE,
        "apps/web/src/app/layout.tsx": ROOT_LAYOUT,
        "apps/web/src/app/globals.css": GLOBALS_CSS,
        "apps/web/src/app/(marketing)/layout.tsx": MARKETING_LAYOUT,
        "apps/web/src/app/(marketing)/page.tsx": LANDING_PAGE,
        "apps/web/src/app/(marketing)/pricing/page.tsx": PRICING_PAGE,
        "apps/web/src/app/(dashboard)/layout.tsx": DASHBOARD_LAYOUT,
        "apps/web/src/app/(dashboard)/dashboard/page.tsx": DASHBOARD_PAGE,
        "apps/web/src/lib/supabase/server.ts": SUPABASE_CLIENT_SERVER,
        "apps/web/src/lib/supabase/client.ts": SUPABASE_CLIENT_BROWSER,
        "apps/web/src/lib/supabase/middleware.ts": SUPABASE_MIDDLEWARE,
        "apps/web/src/components/marketing/nav.tsx": MARKETING_NAV,
        "apps/web/src/components/marketing/footer.tsx": MARKETING_FOOTER,
        "apps/web/src/components/dashboard/nav.tsx": DASHBOARD_NAV,
        "apps/web/src/components/dashboard/sidebar.tsx": DASHBOARD_SIDEBAR,
        "apps/web/src/components/dashboard/stats.tsx": DASHBOARD_STATS,
        "apps/web/src/components/dashboard/recent-matches.tsx": DASHBOARD_RECENT_MATCHES,
        "apps/web/src/components/dashboard/active-watches.tsx": DASHBOARD_ACTIVE_WATCHES,

        # Email app
        "apps/email/package.json": EMAIL_PACKAGE_JSON,
        "apps/email/emails/welcome.tsx": EMAIL_WELCOME,
        "apps/email/emails/digest.tsx": EMAIL_DIGEST,

        # Database package
        "packages/db/package.json": DB_PACKAGE_JSON,
        "packages/db/drizzle.config.ts": DB_DRIZZLE_CONFIG,
        "packages/db/src/index.ts": DB_INDEX,
        "packages/db/src/client.ts": DB_CLIENT,
        "packages/db/src/schema/users.ts": DB_SCHEMA_USERS,
        "packages/db/src/schema/watches.ts": DB_SCHEMA_WATCHES,
        "packages/db/src/schema/linked-accounts.ts": DB_SCHEMA_LINKED_ACCOUNTS,
        "packages/db/src/schema/tenders.ts": DB_SCHEMA_TENDERS,
        "packages/db/src/schema/matches.ts": DB_SCHEMA_MATCHES,
        "packages/db/src/schema/usage.ts": DB_SCHEMA_USAGE,
        "packages/db/src/schema/audit.ts": DB_SCHEMA_AUDIT,

        # Agent package
        "packages/agent/package.json": AGENT_PACKAGE_JSON,
        "packages/agent/src/index.ts": AGENT_INDEX,
        "packages/agent/src/adapters/base.ts": AGENT_BASE_ADAPTER,
        "packages/agent/src/adapters/austender.ts": AGENT_AUSTENDER_ADAPTER,

        # Processor package
        "packages/processor/package.json": PROCESSOR_PACKAGE_JSON,
        "packages/processor/src/index.ts": PROCESSOR_INDEX,
        "packages/processor/src/summarizer.ts": PROCESSOR_SUMMARIZER,
        "packages/processor/src/matcher.ts": PROCESSOR_MATCHER,

        # Jobs package
        "packages/jobs/package.json": JOBS_PACKAGE_JSON,
        "packages/jobs/src/index.ts": JOBS_INDEX,
        "packages/jobs/src/client.ts": JOBS_CLIENT,
        "packages/jobs/src/sync-account.ts": JOBS_SYNC_ACCOUNT,
        "packages/jobs/src/process-tender.ts": JOBS_PROCESS_TENDER,
        "packages/jobs/src/send-digest.ts": JOBS_SEND_DIGEST,

        # Crypto package
        "packages/crypto/package.json": CRYPTO_PACKAGE_JSON,
        "packages/crypto/src/index.ts": CRYPTO_INDEX,

        # Billing package
        "packages/billing/package.json": BILLING_PACKAGE_JSON,
        "packages/billing/src/index.ts": BILLING_INDEX,
        "packages/billing/src/stripe.ts": BILLING_STRIPE,
        "packages/billing/src/limits.ts": BILLING_LIMITS,

        # Shared package
        "packages/shared/package.json": SHARED_PACKAGE_JSON,
        "packages/shared/src/index.ts": SHARED_INDEX,
        "packages/shared/src/constants.ts": SHARED_CONSTANTS,
        "packages/shared/src/types.ts": SHARED_TYPES,
    }


# =============================================================================
# MAIN EXECUTION
# =============================================================================

def main():
    print(f"""
================================================================
   TenderWatch Monorepo Scaffold Generator
   Domain: {DOMAIN}
================================================================
    """)

    base_path = Path.cwd()

    # Check if directory is empty (except for this script)
    existing_files = [f for f in base_path.iterdir() if f.name != Path(__file__).name]
    if existing_files:
        print(f"[!] Warning: Directory is not empty. Found {len(existing_files)} items.")
        response = input("Continue anyway? (y/n): ")
        if response.lower() != 'y':
            print("Aborted.")
            return

    print("\n[DIR] Creating directory structure...")
    for directory in create_directory_structure():
        dir_path = base_path / directory
        dir_path.mkdir(parents=True, exist_ok=True)
        print(f"   [OK] {directory}")

    print("\n[FILE] Creating files...")
    files = create_files()
    for file_path, content in files.items():
        full_path = base_path / file_path
        full_path.parent.mkdir(parents=True, exist_ok=True)
        full_path.write_text(content.strip() + "\n", encoding="utf-8")
        print(f"   [OK] {file_path}")

    # Create placeholder files for missing pages
    placeholder_pages = [
        "apps/web/src/app/(marketing)/how-it-works/page.tsx",
        "apps/web/src/app/(marketing)/blog/page.tsx",
        "apps/web/src/app/(marketing)/terms/page.tsx",
        "apps/web/src/app/(marketing)/privacy/page.tsx",
        "apps/web/src/app/(marketing)/security/page.tsx",
        "apps/web/src/app/(marketing)/contact/page.tsx",
        "apps/web/src/app/(auth)/login/page.tsx",
        "apps/web/src/app/(auth)/signup/page.tsx",
        "apps/web/src/app/(auth)/forgot-password/page.tsx",
        "apps/web/src/app/(onboarding)/welcome/page.tsx",
        "apps/web/src/app/(dashboard)/dashboard/tenders/page.tsx",
        "apps/web/src/app/(dashboard)/dashboard/watches/page.tsx",
        "apps/web/src/app/(dashboard)/dashboard/watches/new/page.tsx",
        "apps/web/src/app/(dashboard)/dashboard/accounts/page.tsx",
        "apps/web/src/app/(dashboard)/dashboard/settings/page.tsx",
        "apps/web/src/app/(dashboard)/dashboard/settings/billing/page.tsx",
        "apps/web/src/app/admin/page.tsx",
    ]

    print("\n[FILE] Creating placeholder pages...")
    for page_path in placeholder_pages:
        full_path = base_path / page_path
        full_path.parent.mkdir(parents=True, exist_ok=True)
        page_name = full_path.parent.name.replace("-", " ").title()
        placeholder = f'''export default function {page_name.replace(" ", "")}Page() {{
  return (
    <div className="container mx-auto px-4 py-20">
      <h1 className="text-3xl font-bold">{page_name}</h1>
      <p className="text-muted-foreground mt-2">Coming soon...</p>
    </div>
  );
}}
'''
        full_path.write_text(placeholder, encoding="utf-8")
        print(f"   [OK] {page_path}")

    print(f"""
================================================================
   SCAFFOLD COMPLETE!
================================================================

   Next steps:
   1. cd {PROJECT_NAME}
   2. pnpm install
   3. cp .env.example .env.local
   4. Fill in your environment variables
   5. pnpm db:push
   6. pnpm dev

================================================================
    """)


if __name__ == "__main__":
    main()