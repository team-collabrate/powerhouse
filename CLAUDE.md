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

## Projects CRUD

`/projects` (list, status-tab filters + search via URL params) and
`/projects/[id]` (detail: profit breakdown, time/expenses/milestones/invoices
lists) are server components off `src/lib/queries/projects.ts`.

Mutations: `POST /api/projects`, `PATCH|DELETE /api/projects/[id]`,
`GET|POST /api/clients`. DELETE is a soft close (`status = "closed"`).
Shared API helpers in `src/lib/api.ts` (`requireSession`, `ok`, `fail`,
`validationError`); Zod schemas in `src/lib/validation/`; every mutation
writes an `activity_log` row via `src/lib/activity.ts`.

Create/edit UI is one client component — `ProjectDialog` (render-prop
trigger) — wrapped by `NewProjectButton` / `EditProjectButton`. `ClientSelect`
has inline "new client" creation.

## Going live with real data

Supabase project already connected (ref `njptbivnjllynoiehqrv`). Migrations
applied. Demo login: `demo@meridian.test` / `demodemo1234`.

```
npm run db:migrate                          # after editing schema.prisma
# add SEED_EMAIL="you@example.com" to .env.local first (PowerShell-safe), then:
npm run db:seed                             # fills that agency with demo rows
```
Without `SEED_EMAIL` the seed builds a standalone "Meridian Studio" agency
(no auth user attached — `prisma studio` inspection only).

## Status

Done: Sprint 1 auth · dashboard UI + data layer · Projects CRUD.
Next: time-tracking + expense logging (feeds profit), then invoices/payments,
then RLS policies, analytics, team/settings, client portal.
