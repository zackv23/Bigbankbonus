# BigBankBonus — Mobile App + Marketing Website

## Overview

Production-ready iOS/Android app for BigBankBonus.com built with Expo React Native + Node.js/Express API. A full bank bonus discovery, tracking, and automation platform with AI agent, payment processing, and scheduling. Includes a marketing website artifact at `/website/`.

**Live at:** BigBankBonus.com — Find. Apply. Earn.

## Features

- **Bank Search Engine** — 7,000+ banks/fintechs with EWS, minimum balance, bonus amount/%, and time-to-bonus filters
- **AI Agent** — OpenAI GPT-4o-mini powered assistant with streaming SSE responses for bonus strategy
- **Deposit/Withdrawal Calendar Scheduler** — Auto-schedules direct deposits across accounts
- **Stripe Payment Processing** — $2k credit purchases at 0.75% fee
- **Autopay DD Scheduler** — Per-offer autopay button with account/routing modal, ROIC/APY display (1× and 3× monthly), full Stripe ACH cycle: CC charge → ACH push (5 biz days) → ACH pull → CC refund
- **Account & Routing Number Management** — Double-entry verified account number, routing validation, masked display
- **Performance Analytics** — ROI, earned/pending bonuses, deployment metrics
- **Chrome Extension AutoFill Template** — Downloadable JSON for bank signup form autofill
- **Apple/Google Auth + Biometrics + PIN** — Complete auth flow with expo-local-authentication
- **Instagram Gradient Theme** — #833AB4 → #E1306C → #F77737 throughout
- **Approval-Gated Billing** — Sign-up is always free (no CC). Billing ($6/mo + $99 one-time service fee) activates only after admin marks a user account as approved. Admin endpoint: `POST /api/admin/accounts/:id/approval` (requires ADMIN_SECRET env var). Subscription creation gated server-side on `approvalStatus = approved`.
- **Subscription Model** — Free / Pro Monthly $6/mo; `/api/subscriptions/*` routes; `subscriptionsTable` DB schema; full in-app upgrade screen at `/subscription`; pricing endpoint at `/api/subscriptions/prices`
- **One-Free-Account Enforcement** — Server-side: `POST /api/accounts` blocks second active account per user with `ONE_FREE_ACCOUNT_LIMIT` error. Client-side: AccountsContext also enforces this locally.
- **Post-Approval Checklist** — 8-step "What To Do Next" screen at `/checklist` (mobile). Persistent state via AsyncStorage. Accessible from the Accounts tab when an account is approved.
- **Marketing Website** — Static React/Vite landing page at `/website/` with hero, stats, features, pricing, testimonials, FAQ, framer-motion animations. Pricing shows approval-gated $6/mo + $99 model.
- **EWS & ChexSystems Policy Monitor** — Backend monitoring engine checking 1,004+ public endpoints (CFPB, Reddit, DoC, bank newsrooms, federal/state regulators, aggregators) every 6 hours. Stores events in `monitor_events` table, run history in `monitor_runs`, and source health in `source_health`. Gated behind Pro subscription. Exposed via `/api/monitor/*` routes. Dashboard visible in mobile Monitor tab and website Monitor section.
- **Command Hub** — Unified hub screen (mobile "Hub" tab + website `/hub` route) with: Plaid Primary Bank Card (live balance, account list, refresh), ChexSystems Report Card (free report link, tips), and File Upload Center (PDF/image upload to Replit Object Storage, file list with delete). Auth-gated: website shows login prompt for unauthenticated users; all upload/storage API routes require `Authorization: Bearer <userId>` header.
- **Object Storage** — Replit App Storage (GCS-backed) for user file uploads; presigned URL flow via `POST /api/storage/uploads/request-url`; file metadata tracked in `file_uploads` DB table; DELETE removes both DB row and backing storage object.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Mobile**: Expo 54 + React Native
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **AI**: OpenAI GPT-4o-mini via Replit integration
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **Build**: esbuild (CJS bundle) for API server

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   └── api-server/         # Express API server
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health` (full path: `/api/health`)
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas (no models definitions exist right now)
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.

## Version History & Rollback

The codebase was snapshotted before V2.0 development began. See [CHANGELOG.md](./CHANGELOG.md) for the full V1 feature inventory and git rollback instructions.

- **Tag:** `v1.0-stable` — V1 stable baseline (2026-04-01)
- **Rollback:** `git checkout -b restore/v1.0-stable v1.0-stable`
