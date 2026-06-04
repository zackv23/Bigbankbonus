# BigBankBonus Website

The frontend application for BigBankBonus.com, built with React, TypeScript, and Vite.

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm (enforced via root package.json)

### Installation

```bash
# From the website directory
pnpm install

# Or from the root to install all workspaces
cd ..
pnpm install
```

### Development

```bash
# Start the dev server (runs on http://localhost:5173 by default)
pnpm run dev

# Type-check
pnpm run typecheck

# Build for production
pnpm run build

# Preview production build locally
pnpm run preview
```

## Project Structure

```
src/
├── main.tsx           # React entry point
├── App.tsx            # Root component with routing
├── App.css            # Main styles
├── index.css          # Global styles
├── components/        # Reusable components
│   └── Navigation.tsx # Navigation bar
└── pages/             # Page components
    └── Home.tsx       # Home page
```

## Key Features

- **React 18** for UI components
- **TypeScript** for type safety
- **Vite** for fast build and dev server
- **CSS** for styling (no CSS-in-JS required for MVP)
- **Responsive design** for mobile and desktop

## Environment Variables

Create a `.env.local` file in this directory:

```env
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key
```

Note: Public variables must be prefixed with `VITE_` to be exposed to the client.

## Integrations

The website can integrate with:
- **api-client-react** - React hooks for API calls
- **integrations-openai-ai-react** - AI features
- **replit-auth-web** - Authentication

These are available in the monorepo at `../lib/`.

## Building for Vercel

```bash
pnpm run build
```

The build output is in the `dist/` directory. Vercel automatically detects this as a Vite project and deploys it.

## Next Steps

- [ ] Add database integration (Supabase)
- [ ] Implement bank/credit card database
- [ ] Add user authentication
- [ ] Connect API client for real data
- [ ] Implement search and filtering
- [ ] Add AI-powered recommendations
- [ ] Mobile app submission preparation
