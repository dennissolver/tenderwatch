# TenderWatch

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
