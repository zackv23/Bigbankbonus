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

## Version History

- **v1.0-stable** (2026-04-01) — V1 baseline before V2.0 upgrade
- Rollback: `git checkout -b restore/v1.0-stable v1.0-stable`
- See [CHANGELOG.md](./CHANGELOG.md) for full history
