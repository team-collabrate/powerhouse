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

## Dashboard

`/dashboard` is a server component. Data flow:
`getSessionContext()` → `getDashboardData(agencyId, name)` in
`src/lib/queries/dashboard.ts`. That fetches agency-scoped rows via Prisma,
adapts them to `DashInputs`, and calls the **pure** `buildDashboardView()`
(all the aggregation math — bucketing, margins, %, deltas, insight rules).

If Supabase/DB isn't configured, nobody's signed in, or a query throws, the
page falls back to `DEMO_DASHBOARD` (`src/lib/demo-data.ts`) and shows a
"Sample data" chip. Same `DashboardView` shape either way.

Charts are hand-built inline SVG in `src/components/dashboard/` (no chart
lib); every component takes a typed slice of `DashboardView` as props.

`npm run test` runs `scripts/check-dashboard.ts` — 20 assertions against
`buildDashboardView` with synthetic rows, no DB needed.

Aesthetic rules: purple accent only on primary action / active nav / primary
chart series; green only on positive deltas & paid state; hairline borders,
minimal shadow, `.tnum` on every number.

## Going live with real data

```
# 1. create a Supabase project, fill .env.local (see .env.example)
npm run db:migrate        # creates tables (needs DIRECT_URL)
# 2. sign up in the app  -> provisions your agency + admin user
SEED_EMAIL=you@example.com npm run db:seed   # fills that agency with demo rows
```
Without `SEED_EMAIL` the seed builds a standalone "Meridian Studio" agency
that no auth user is attached to (useful for `prisma studio` inspection only).

## Status

Sprint 1 (auth) + dashboard UI + dashboard data layer done. Not yet done:
run migrations against a real Supabase project, RLS policies, and
projects/invoices/clients CRUD pages (Sprint 3+).
