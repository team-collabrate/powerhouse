@AGENTS.md

# Agency Dashboard

SaaS for contract-based agencies to track real-time project profitability.
Full blueprint lives in `docs/` (start with `docs/README.md`).

## Stack (decided)

- **Next.js 16** (App Router, `src/`, Turbopack), React 19, TypeScript strict
- **One app, no separate backend** — API in `src/app/api/**/route.ts`
- **Supabase Auth** for auth (do NOT hand-roll JWT / password hashing)
- **Prisma 6** + PostgreSQL (Supabase). Schema: `prisma/schema.prisma`
- **Tailwind v4** (CSS tokens in `src/app/globals.css`), TanStack Query, Zustand,
  React Hook Form + Zod, `react-feather` icons

## Design tokens (LOCKED — from docs/design/DASHBOARD_DESIGN_SPECIFICATION.md)

- Primary green `#5cd65c` (growth/profit), accent purple `#9933ff` (actions/buttons)
- Font **Inter**. Light mode only (dark mode = Phase 2)
- Radii 8px (inputs/buttons) / 12px (cards). Use the CSS vars, not raw hex.
- `docs/design/DESIGN_DECISIONS_FINAL.md` is STALE on color/font (says blue/Inter-only) —
  the green+purple spec won. Everything else in that file still applies.

## Profit calculation

Never a stored DB column (Postgres generated columns can't do cross-table
subqueries). Single source of truth: `src/lib/profit.ts`.
`profit = contract_value - (team_cost + expenses + allocated_overhead)`

## Multi-tenancy

Every tenant-scoped query MUST filter by `agencyId` from the signed-in user.
Enforce in the API layer; add Supabase RLS policies as defense-in-depth.

## Commands

```
npm run dev          # dev server
npm run build        # prod build
npm run typecheck    # tsc --noEmit
npm run lint
npm run db:migrate   # prisma migrate dev (needs DATABASE_URL + DIRECT_URL)
npm run db:studio
```

## Status

Sprint 1 (Foundation & Auth) scaffolded: design tokens, Prisma schema,
Supabase auth wiring, `(auth)` login/signup, `(dashboard)` shell with
Sidebar + Header, `/api/auth/signup`. Not yet done: real Supabase project,
migrations run, RLS policies, projects/invoices CRUD (Sprint 3+).
