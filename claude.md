# BigBankBonus.com - Project Documentation

## Project Overview

**BigBankBonus.com** is a FinTech platform for bank churning and credit card bonuses. It's a monorepo workspace managed with pnpm, combining a frontend website (Vite-based) with multiple libraries for API integration, database management, and third-party service integrations.

- **Primary Repo**: https://github.com/zackv23/Bigbankbonus
- **Phase 1 Deadline**: June 15, 2026
- **Public Launch**: October 1, 2026
- **Tech Stack**: Next.js 15, FastAPI, Docker, TypeScript, React, Vite

---

## Directory Structure

```
Bigbankbonuscom/
├── website/                           # Frontend application (Vite + React)
├── lib/                              # Shared libraries
│   ├── api-client-react/             # React client for API interactions
│   ├── api-spec/                     # API specification definitions
│   ├── api-zod/                      # Zod schemas for API validation
│   ├── db/                           # Database utilities and models
│   ├── integrations/                 # Third-party integrations base
│   │   └── openai_ai_integrations/   # OpenAI AI integration implementations
│   ├── integrations-openai-ai-react/ # React components for OpenAI integration
│   ├── integrations-openai-ai-server/# Server-side OpenAI integration
│   ├── object-storage-web/           # Object storage utilities for web
│   └── replit-auth-web/              # Replit authentication for web
├── scripts/                           # Utility scripts and tasks
│   └── src/                          # Script source files
├── app-store-submission/             # App store submission materials
├── attached_assets/                  # Branding and asset files
├── artifacts/                        # Build output and artifacts
│
├── Configuration Files
├── .env                              # Environment variables (secrets)
├── .replit                           # Replit configuration
├── .gitignore                        # Git ignore rules
├── .npmrc                            # NPM configuration
├── tsconfig.json                     # TypeScript configuration (root)
├── tsconfig.base.json                # TypeScript base config for workspace
├── package.json                      # Workspace root package
├── pnpm-workspace.yaml               # pnpm workspace definition
├── pnpm-lock.yaml                    # Dependency lock file
├── skills-lock.json                  # Claude Code skills lock
└── .claude/                          # Claude Code configuration
    └── worktrees/                    # Git worktree management
```

---

## Key Files & Configuration

### Root Configuration

- **package.json**: Workspace root with build scripts and shared devDependencies
  - Scripts: `build`, `typecheck`, `typecheck:libs`
  - DevDeps: TypeScript 5.9.2, Prettier 3.8.1, Nodemailer types
  
- **pnpm-workspace.yaml**: Defines workspace structure and dependency overrides
  - Security overrides: `follow-redirects`, `esbuild`, `@tootallnate/once`

- **tsconfig.json & tsconfig.base.json**: TypeScript configuration for monorepo
  - Configured for Node.js and browser targets

### Environment & Secrets

- **.env**: Contains critical configuration
  ```
  ENCRYPTION_KEY=...           # Data encryption key
  DATABASE_URL=...             # Supabase PostgreSQL connection
  STRIPE_SECRET_KEY=...        # Stripe payment integration
  STRIPE_WEBHOOK_SECRET=...    # Stripe webhook signing
  PLAID_CLIENT_ID=...          # Plaid banking data integration
  PLAID_SECRET=...             # Plaid authentication
  PLAID_ENV=sandbox            # Plaid environment (sandbox/production)
  CONNECTED_STRIPE_ACCOUNT_ID=... # Connected Stripe account
  ```

### Third-Party Integrations

- **Stripe**: Payment processing and subscription management
- **Plaid**: Banking data aggregation (sandbox environment)
- **Supabase**: PostgreSQL database with authentication
- **OpenAI**: AI integration for intelligent features

---

## Library Breakdown

### API Layer
- **api-spec/**: Defines API contract and types
- **api-zod/**: Zod validation schemas (mirrors API spec)
- **api-client-react/**: React hooks and utilities for API calls

### Data & Storage
- **db/**: Database models, migrations, and query utilities
- **object-storage-web/**: Web-based object/file storage integration

### Integrations
- **integrations/**: Base integration framework
- **integrations-openai-ai-server/**: Server-side OpenAI AI features
- **integrations-openai-ai-react/**: Client-side AI components and hooks
- **replit-auth-web/**: Replit-specific authentication

### Website
- **website/**: Main frontend application
  - Built with Vite (fast build tool)
  - React-based UI
  - Connects to API via api-client-react

---

## Development Workflow

### Installation & Setup
```bash
pnpm install                 # Install all dependencies
pnpm run typecheck           # Type-check all TypeScript
pnpm run build              # Build all packages
```

### Running the Website
```bash
cd website
pnpm run dev                # Start dev server (typically http://localhost:5173)
pnpm run build              # Build for production
```

### Scripts
```bash
cd scripts
pnpm run hello              # Example script
pnpm run typecheck          # Check script types
```

---

## Architecture Notes

1. **Monorepo Structure**: All packages share TypeScript configuration and can reference each other
2. **Type Safety**: Heavy use of Zod for runtime validation and TypeScript for compile-time checks
3. **API-Driven**: Centralized API spec with generated types in api-zod and React hooks in api-client-react
4. **Third-Party Dependencies**:
   - Payments: Stripe
   - Banking: Plaid (sandbox for development)
   - Database: Supabase (PostgreSQL)
   - AI: OpenAI
   - Frontend Build: Vite

---

## Important Notes

- **Secrets in .env**: Contains production credentials; never commit to version control
- **pnpm**: Required package manager (enforced in preinstall hook)
- **Lock File**: pnpm-lock.yaml must be committed for reproducible installs
- **Node Modules**: Stored in root; shared across workspace via pnpm
- **Type Checking**: Always run `pnpm run typecheck` before committing
- **Phase 1 Deadline**: June 15, 2026 – focus on core MVP features
- **Public Launch**: October 1, 2026 – date for production deployment

---

## Common Tasks

### Adding a new library
```bash
mkdir lib/new-package
cd lib/new-package
npm init (or pnpm init)
# Update pnpm-workspace.yaml if needed
pnpm install
```

### Updating dependencies
```bash
pnpm update
pnpm install  # Re-install after lock changes
```

### Building for production
```bash
pnpm run build            # Builds all packages
cd website && pnpm run build  # Creates optimized website build
```

---

## Current Status

- **Repository**: Initialized with multiple subrepl remotes (Replit-based development)
- **Primary Branch**: main (no commits yet as of last check)
- **Build System**: pnpm workspace with TypeScript cross-compilation
- **Deployment**: Configured for Docker containerization
