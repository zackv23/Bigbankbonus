# Changelog

All notable changes to this project will be documented in this file.

---

## [v1.0-stable] — 2026-04-01

This is the stable V1 baseline snapshot captured before the V2.0 upgrade begins.
Tag: `v1.0-stable`

### Features included in this baseline

#### Bank Bonus Discovery
- Live deal scraping from Doctor of Credit (DoC) with automatic categorization by account type (Checking, Savings, Business, etc.)
- Extraction of key offer metadata: bonus amount, pull type (soft/hard), direct deposit requirements, and state restrictions
- Curated internal database of ~7,000 banks and fintechs with EWS status, minimum balance requirements, and ratings
- Search and filtering by bonus amount, return percentage, time-to-bonus, and rating

#### Autopay — Direct Deposit Automation
- Full CC → ACH Push → ACH Pull → CC Refund automation cycle to simulate payroll direct deposits
- Stripe integration for charging the user's card and sending ACH transfers to the target bank
- ROI and APY calculations (1x vs 3x monthly cycles) with real-time fee math

#### AI Financial Agent
- GPT-4o-mini powered chat assistant for bonus strategies and advice
- Server-Sent Events (SSE) for streaming real-time responses

#### Bank Account Management & Tracking
- Plaid integration for linking external bank accounts and monitoring balances/transactions
- Scheduler and calendar for managing deposit/withdrawal timing across multiple accounts
- Analytics dashboard for earned vs. pending bonuses and overall ROI

#### User & Subscription System
- Apple/Google OAuth, biometrics, and PIN-based authentication
- Free and Pro subscription tiers ($9.99/mo or $83.88/yr) managed via Stripe

#### Marketing Website
- React/Vite marketing site with landing page, feature highlights, and onboarding flow

### Technical Stack (V1)
- **Mobile:** Expo (React Native) with TypeScript
- **Backend:** Node.js / Express 5, esbuild, PostgreSQL with Drizzle ORM
- **Web:** React / Vite
- **Integrations:** OpenAI, Stripe, Plaid
- **Monorepo:** pnpm workspaces with TypeScript composite project references

---

## How to restore from this tag

If you need to roll back to the V1 stable baseline, run:

```bash
# View the tag
git show v1.0-stable

# Create a new branch from the tag to inspect or restore
git checkout -b restore/v1.0-stable v1.0-stable

# Or hard-reset the current branch to this tag (destructive — use with care)
git reset --hard v1.0-stable
```

> **Note:** A hard reset is destructive and will discard all uncommitted changes and commits after the tag. Always create a backup branch before resetting.
