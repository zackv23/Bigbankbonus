# BigBankBonus

Production iOS/Android app for BigBankBonus.com — bank bonus discovery, tracking, and automation platform with AI agent, payment processing, and scheduling.

**Live at:** BigBankBonus.com — Find. Apply. Earn.

## Stack

- **Monorepo**: pnpm workspaces
- **Node.js**: 24 | **TypeScript**: 5.9
- **Mobile**: Expo 54 + React Native
- **API**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **AI**: OpenAI GPT-4o-mini via Replit integration
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **Build**: esbuild (CJS bundle) for API server

## Structure

```
├── artifacts/                    # Deployable applications
│   ├── api-server/               # Express 5 API server
│   ├── mobile/                   # Expo React Native app
│   ├── website/                  # Marketing site (React/Vite)
│   └── mockup-sandbox/           # UI prototyping sandbox
├── lib/                          # Shared libraries
│   ├── api-spec/                 # OpenAPI spec + Orval codegen
│   ├── api-client-react/         # Generated React Query hooks
│   ├── api-zod/                  # Generated Zod schemas
│   ├── db/                       # Drizzle ORM schema + DB connection
│   ├── integrations/             # Third-party integrations
│   ├── integrations-openai-ai-react/   # OpenAI React integration
│   ├── integrations-openai-ai-server/  # OpenAI server integration
│   └── object-storage-web/       # Object storage (Replit/GCS)
├── scripts/                      # Utility scripts
└── app-store-submission/         # App store assets
```

## Key Commands

```bash
# Dev servers
pnpm --filter @workspace/api-server run dev    # API on :3000
pnpm --filter @workspace/website run dev       # Website on :5173
pnpm --filter @workspace/mobile run dev        # Mobile on :8081

# Build & typecheck
pnpm run build          # typecheck + build all packages
pnpm run typecheck      # tsc --build --emitDeclarationOnly

# Database
pnpm --filter @workspace/db run push           # Dev schema push
pnpm --filter @workspace/db run push-force     # Fallback force push

# Codegen (OpenAPI → hooks + Zod schemas)
pnpm --filter @workspace/api-spec run codegen
```

## TypeScript Composite Projects

Every package extends `tsconfig.base.json` (`composite: true`). Always typecheck from root — running `tsc` inside a single package will fail if dependencies haven't been built. Only `.d.ts` files are emitted; JS bundling is handled by esbuild/tsx/vite.

## Packages

- **`artifacts/api-server`** — Express 5 API. Routes in `src/routes/`, uses `@workspace/api-zod` for validation and `@workspace/db` for persistence. Entry: `src/index.ts`, app setup: `src/app.ts`.
- **`lib/db`** — Drizzle ORM + PostgreSQL. Schema models in `src/schema/<model>.ts`. Exports pool, db instance, and schema.
- **`lib/api-spec`** — OpenAPI 3.1 spec (`openapi.yaml`) + Orval config. Codegen outputs to `api-client-react` and `api-zod`.
- **`lib/api-zod`** — Generated Zod schemas from OpenAPI spec.
- **`lib/api-client-react`** — Generated React Query hooks + fetch client.
- **`scripts`** — Utility scripts. Run via `pnpm --filter @workspace/scripts run <script>`.

## Key Features

- Bank Search Engine — 7,000+ banks/fintechs with filters
- AI Agent — GPT-4o-mini with SSE streaming
- Autopay DD Scheduler — 91-day CC→ACH push→pull→refund cycle (Plaid Transfer for ACH, Stripe for fees/refund)
- Stripe payments — $2k credit purchases at 0.75% fee
- Approval-gated billing — Free signup, $6/mo + $99 one-time after admin approval
- Plaid integration — External bank linking, balance monitoring
- EWS & ChexSystems Monitor — 1,004+ endpoints checked every 6 hours
- Command Hub — Plaid card, ChexSystems report, file upload center

## Deployment

### Website — IONOS Deploy Now
- **Platform**: IONOS Deploy Now (static hosting, Apache)
- **Config**: `.ionos/config.yaml` — build command, output dir
- **Output dir**: `artifacts/website/dist/public`
- **Build command** (CI): `corepack enable && pnpm install --frozen-lockfile && pnpm --filter @workspace/website... run build`
- **SPA routing**: `artifacts/website/public/.htaccess` (Vite copies to dist) — rewrites all paths to `index.html`
- **ENV vars**: `PORT` and `BASE_PATH` are only required for `dev`/`preview`, not `build`
- **Domain**: bigbankbonus.com + www — bind in IONOS Deploy Now Domains tab
- **API proxy**: `/api/*` must be reverse-proxied to the API server host; Deploy Now static cannot serve it
- **Trust proxy**: The API server sets `trust proxy = 1` (one proxy hop). If there are multiple proxy layers (e.g. CDN → LB → app), increase the value to match the number of trusted hops so `req.ip` resolves to the real client IP for rate limiting and logging.

### Website build (local)
```bash
pnpm --filter @workspace/website... run build
# outputs to artifacts/website/dist/public/
```

## Security

### Rate limiting (`artifacts/api-server/src/app.ts`)
- **Global**: 200 req/min per IP (all routes). Skipped outside production.
- **Strict**: 10 req/min per IP on `/api/auth`, `/api/subscriptions/subscribe`, `/api/deposit/initiate`, `/api/autopay/create`. Each path gets its own independent `rateLimit()` instance via `createStrictLimiter()` factory — counters are **not** shared across endpoints.
- **Helmet**: Security headers enabled. `crossOriginEmbedderPolicy` disabled for Stripe.js iframes. CSP disabled in dev.
- **CORS**: Strict origin whitelist (`bigbankbonus.com`, `www.bigbankbonus.com`, localhost in dev). Null-origin requests allowed for mobile native, webhooks, and curl.

### Stripe webhook verification (`artifacts/api-server/src/routes/webhooks.ts`)
- Lightweight HMAC-SHA256 verification of `Stripe-Signature` header against `STRIPE_WEBHOOK_SECRET`.
- Uses `crypto.timingSafeEqual()` for constant-time comparison to prevent timing side-channel attacks.
- Falls back to unverified in dev/demo mode when `STRIPE_WEBHOOK_SECRET` is not set.

## Version History

- **v1.0-stable** (2026-04-01) — V1 baseline before V2.0 upgrade
- Rollback: `git checkout -b restore/v1.0-stable v1.0-stable`
- See [CHANGELOG.md](./CHANGELOG.md) for full history
