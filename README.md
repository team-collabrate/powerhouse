# Powerhouse

Real-time project profitability tracking for contract-based agencies — every
invoice, expense, and margin in one place. Built with Next.js 16 (App
Router), Prisma 6, and Supabase (Auth + Postgres + Storage), deployed on
Vercel.

## Docs

- **[CLAUDE.md](./CLAUDE.md)** — the living reference for how this app is
  built: stack decisions, data model, every feature area (dashboard,
  projects, invoices, analytics, settings, auth), and the conventions to
  follow when changing it.
- **[DEPLOY.md](./DEPLOY.md)** — deploying to Vercel from scratch (env vars,
  Supabase Auth config, Resend email setup).
- **[docs/](./docs)** — the original product/design/engineering blueprint
  this app was built from.

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in your Supabase + Resend values
npm run db:migrate           # apply migrations
npm run db:seed              # optional: seed demo data
npm run dev
```

Without a configured `.env.local`, the app still runs and falls back to
read-only demo data on every page.

## Commands

```bash
npm run dev          # dev server
npm run build        # production build
npm run typecheck    # tsc --noEmit
npm run lint
npm test             # pure-function checks, no DB needed
npm run smoke:live   # exercises every query against your real DB
npm run db:studio    # Prisma Studio
```

CI (`.github/workflows/ci.yml`) runs typecheck → lint → test → build on
every push/PR to `main`, with no database or secrets required.
