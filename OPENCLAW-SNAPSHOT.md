# TenderWatch — OpenClaw Handoff Snapshot

**Date:** 16 March 2026
**Repo:** https://github.com/dennissolver/tenderwatch
**Live:** https://tenderwatch-alpha.vercel.app
**Stack:** Next.js 14 / Supabase (PostgreSQL) / Inngest / Browserbase + Playwright / Tailwind

---

## What TenderWatch Does

TenderWatch monitors 7 Australian government tender portals from a single dashboard. Users register once, set up keyword/region watches, and receive matched tender alerts — without manually checking each portal.

---

## Current Status

### What's Built & Working

| Area | Status | Detail |
|------|--------|--------|
| **Auth** | Done | Supabase Auth (email/password), protected routes, middleware |
| **Onboarding wizard** | Done | 3-step: business profile → portal registration → summary |
| **Business profile form** | Done | ABN auto-lookup (needs ABR_GUID env var), Mapbox address autocomplete |
| **Portal adapter framework** | Done | Base adapter with `fillRegistrationFields()`, `detectCaptcha()`, `tryFill/tryCheck/trySelect` helpers |
| **7 portal adapters** | Done | AusTender, NSW (buy.nsw), QLD (supply.qld), VIC, SA, WA, TenderLink — each with register/login/search/fetchDetail |
| **Browserbase integration** | Done | `keepAlive` sessions, `solveCaptchas: true`, live debug URL for manual CAPTCHA |
| **Live session embed** | Done | "Action Required" status → "Open Browser Session" button → user solves CAPTCHA in new tab → confirms in TenderWatch |
| **Credential encryption** | Done | AES-256 via `@tenderwatch/crypto`, stored in `encrypted_credentials` column |
| **Accounts management** | Done | Status cards (connected/pending/error/expired/awaiting_user), retry all, remove, reconnect |
| **Watch CRUD** | Done | Create watch with keywords (must/bonus/exclude), regions, value range, sensitivity (strict/balanced/adventurous), delivery method |
| **Tender feed** | Done | Matched tab (scored by tier: strong/maybe/stretch) + All Recent tab, expandable cards, search |
| **Dashboard** | Done | Stats (active watches, new matches, saved tenders, connected portals) + recent matches + active watches |
| **Inngest jobs** | Partial | `validateAccount`, `syncAccount`, `processTender`, `sessionHealthCheck`, `completeManualStep` all built; `sendDigest` stubbed |
| **Session heartbeat** | Done | Cron every 12h: restore cookies → check isLoggedIn → re-login if expired → update session |
| **DB schema** | Done | 6 tables: users, linked_accounts, watches, tenders, matches, audit_log, usage |
| **Matching engine** | Done | `@tenderwatch/processor` package: keyword matching, region filtering, value range, tier scoring |

### What's Broken or Incomplete

| Area | Issue |
|------|-------|
| **ABN auto-lookup** | Needs `ABR_GUID` env var — free registration at https://abr.business.gov.au/Tools/WebServices |
| **Portal registration success rate** | VIC works end-to-end. AusTender/NSW/WA detect CAPTCHA correctly and show manual step UI. QLD Blazor SPA unreliable. SA has system-generated passwords. TenderLink is a paid service. |
| **Tender sync** | `syncAccount` job is built but no cron schedule — tenders don't auto-sync yet |
| **Email digests** | `sendDigest` job is stubbed — no actual email delivery |
| **AI summaries** | `processTender` has placeholder for `personalisedSummary` — no LLM call implemented |
| **Watch editing** | Create works, but no edit page for existing watches |
| **Profile editing** | Profile page exists at `/dashboard/profile` but edit form may be incomplete |
| **Billing/Stripe** | DB columns for Stripe exist, billing page says "Coming soon" |
| **Save/hide tenders** | DB columns exist (`is_saved`, `is_hidden`) but no UI buttons |
| **Real-time updates** | No WebSocket/polling — user must refresh to see status changes |

---

## The Objective

A user should be able to:

1. **Sign up** and enter their business details once
2. **Auto-register on all 7 tender portals** with minimal friction (only CAPTCHA + email verification as manual steps)
3. **Set up watches** with keywords, regions, and value ranges
4. **Receive matched tender alerts** daily/weekly via email, with AI-generated summaries explaining relevance
5. **Review matches** in a dashboard with scoring, save interesting ones, dismiss irrelevant ones
6. **Never touch a tender portal again** — TenderWatch keeps sessions alive and syncs automatically

The experience should feel like: "I signed up, connected my portals in 5 minutes, and now tenders come to me."

---

## The Gap — What OpenClaw Needs to Build

### Priority 1: Make the Core Loop Work End-to-End

**1.1 Scheduled tender sync (critical)**
- Add an Inngest cron job that triggers `account/sync` for all `connected` accounts
- Suggested: every 6 hours (`0 */6 * * *`)
- Each sync: login → search last 7 days → fetch new tender details → insert to DB → emit `tender/process` events
- The `syncAccount` job already exists and works — just needs a cron trigger

**1.2 Email digest delivery (critical)**
- `packages/jobs/src/send-digest.ts` is stubbed
- Implement actual email sending using Resend (RESEND_API_KEY already in env)
- Email templates exist in `apps/email/` (React Email)
- Match user's `delivery_method` (daily/weekly) → aggregate new matches since last notification → send email
- Update `matches.notified_at` after sending

**1.3 AI-powered tender summaries (high value)**
- In `processTender` job, after matching, call Claude API to generate:
  - `personalised_summary`: 2-3 sentence explanation of why this tender matches the user's watch
  - `llm_reasoning`: detailed analysis of relevance
  - `llm_relevance_score`: 0-100 AI confidence score
- Anthropic API key already in env (`ANTHROPIC_API_KEY`)
- Use watch keywords + tender description as context

### Priority 2: Portal Registration Reliability

**2.1 Fix remaining portal adapters**
- Each adapter's `register()` uses `fillRegistrationFields()` (broad CSS selectors) + `detectCaptcha()`
- Need to verify actual field IDs/names on each portal by opening them in Browserbase and inspecting
- AusTender registration page has login form in header — selectors must target `#mainContent` or `form[action*="Register"]`
- NSW buy.nsw: verify `suppliers.buy.nsw.gov.au/login/signup/supplier` loads a form
- QLD: Blazor SPA is unreliable — may need to use `supply.qld.gov.au` VendorPanel instead
- SA: no password field (system-generated) — adapter handles this but needs testing
- WA: multi-step wizard — adapter advances through steps but needs field ID verification
- TenderLink: paid subscription, may not be automatable

**2.2 Improve CAPTCHA handling**
- Browserbase has `solveCaptchas: true` which auto-solves reCAPTCHA/hCaptcha in many cases
- When auto-solve fails, the "Open Browser Session" button opens a new tab for manual solving
- Need to verify the `debuggerFullscreenUrl` from `bb.sessions.debug()` actually works and shows the pre-filled form
- Consider: if Browserbase can't solve and manual step fails, show clear error with "try again" option

**2.3 Email verification flow**
- After registration, many portals send a verification email
- Current flow: show "I've Verified My Email" → trigger `completeManualStep` → try login
- Need to verify this works for each portal
- Consider: watch the user's inbox via Supabase edge function? Or just prompt them clearly.

### Priority 3: UX Polish

**3.1 Watch editing**
- Build edit page at `/dashboard/watches/[id]/edit` (reuse `new-watch-form.tsx`)
- Add `updateWatch()` server action
- Link from watches list (settings icon already rendered)

**3.2 Save/hide/dismiss tenders**
- Add save (bookmark) and hide (dismiss) buttons to tender cards
- `saveTender(matchId)` and `hideTender(matchId)` server actions
- Filter hidden from feed, show saved in separate tab

**3.3 Real-time status updates**
- Polling or Supabase Realtime subscription for account status changes
- When `validateAccount` job completes, UI updates without page refresh
- Same for tender sync completion

**3.4 Profile editing**
- Build edit form at `/dashboard/profile` (reuse `profile-form.tsx` from onboarding)
- Allow changing company details, contact info, address after onboarding

**3.5 Billing**
- Implement Stripe Checkout for Pro plan ($399/mo)
- Enforce free tier limits (10 compliance runs / basic features)
- Stripe webhook handler for subscription lifecycle events
- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` already in env

### Priority 4: Reliability & Monitoring

**4.1 Error recovery**
- Retry failed portal registrations with exponential backoff
- Alert user when a portal has been in error state for >24h
- Auto-retry expired sessions before marking them expired

**4.2 Observability**
- Sentry is configured (`SENTRY_DSN` in env) — ensure all Inngest jobs have error tracking
- PostHog analytics configured — add event tracking for key user actions
- Audit log table exists — populate it with login/register/sync events

**4.3 Rate limiting**
- Browserbase sessions cost money — rate limit per user
- Prevent runaway retries (current: 2-3 retries per job)
- Track Browserbase session usage in `usage` table

---

## Key Files Reference

```
apps/web/src/
  app/(onboarding)/welcome/     — Onboarding wizard
  app/(dashboard)/dashboard/    — Dashboard, tenders, watches, accounts, settings
  components/onboarding/        — Profile form, portal forms, live session embed, address autocomplete
  components/dashboard/         — Stats, recent matches, active watches, sidebar
  lib/actions/portal-linking.ts — Server actions for all portal operations
  lib/supabase/                 — Supabase client (server + browser)
  app/api/abn-lookup/           — ABN lookup proxy (needs ABR_GUID)
  app/api/webhooks/inngest/     — Inngest webhook handler

packages/
  agent/src/adapters/           — 7 portal adapters + base class
  agent/src/index.ts            — Adapter factory (getAdapter)
  jobs/src/                     — 6 Inngest jobs
  db/src/schema/                — Drizzle schema (6 tables)
  crypto/                       — AES-256 encrypt/decrypt
  processor/                    — Tender matching engine
  shared/src/constants.ts       — Portal registry, types, enums
  billing/                      — Stripe integration (scaffold)

.env.local                      — All secrets (Supabase, Stripe, Anthropic, Browserbase, Sentry, Resend, Mapbox)
```

---

## Environment Variables Needed

| Variable | Status | Purpose |
|----------|--------|---------|
| `ABR_GUID` | **MISSING** | ABN lookup — register free at abr.business.gov.au |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Set | Address autocomplete |
| `ANTHROPIC_API_KEY` | Set | AI summaries (not yet used in tender processing) |
| `BROWSERBASE_API_KEY` | Set | Browser automation |
| `RESEND_API_KEY` | Set | Email delivery (not yet used in digest) |
| `STRIPE_SECRET_KEY` | Set | Billing (not yet implemented) |
| All others | Set | See `.env.local` |

---

## Success Criteria

When complete, a new user should:
1. Sign up → enter ABN → all company details auto-fill (< 1 min)
2. Auto-register on 7 portals → solve CAPTCHAs inline → verify emails (< 10 min)
3. Create a watch with keywords/regions (< 2 min)
4. See matched tenders within 6 hours with AI summaries
5. Receive daily email digest of new matches
6. Never log into a tender portal directly again
