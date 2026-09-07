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

No time tracking — projects are contract + duration based. Team/labour cost is
a single estimated `teamCost` field on the project (manager-entered).

Never a stored DB column (Postgres generated columns can't do cross-table
subqueries). Single source of truth: `src/lib/profit.ts`.
`profit = contract_value - (team_cost + Σ project_expenses + allocated_overhead)`

**Allocated overhead** is derived, not typed in. The `projects.allocated_overhead`
column is now a per-project **override** — `> 0` pins that value; `0` means "use
the agency rule". The rule lives on the agency (`overhead_method` +
`overhead_rate`) and is resolved by `resolveAgencyOverhead(agencyId)`
(`src/lib/queries/overhead.ts`, never throws → no-op resolver on failure) which
feeds the **pure** `allocateOverhead()` in `src/lib/overhead.ts` (unit-tested,
no Prisma). Methods:
- `manual` (default) — override only, i.e. exactly the pre-rule behaviour.
- `percent` — `contract_value × rate` for every non-closed project.
- `even` — the monthly overhead pool split evenly across non-closed, non-pinned
  projects, × each project's duration in months (`clamp(round(days/30), 1, 18)`,
  fallback 3).
- `contract_share` — same, weighted by contract-value share.
The pool = normalised recurring run-rate + trailing-90-day one-off company
expenses / 3 (`overheadMonthlyPool()`). `even`/`contract_share` are
duration-weighted so `Σ allocations ≠ one month's pool` — correct for
whole-project profit. Wired into `listProjects`, `getProject`
(`cost.overheadSource`), `getAnalytics` (`AnalyticsResult.overhead`),
`getClient`, and `buildDashboardView`.

The dashboard profit chart amortises each non-closed project's `teamCost` **and
its allocated overhead** linearly across its start→deadline span (fallback 90
days) to get a daily cost figure.

## Multi-tenancy & permissions

Every tenant-scoped query MUST filter by `agencyId` from the signed-in user
(app layer). **RLS** (migration `20260906140000_row_level_security`) is the
DB-level backstop: the app connects as `postgres` (BYPASSRLS) so Prisma is
unaffected, but every table has RLS on + a SELECT policy scoped by
`public.current_agency_id()`, and no write policy for anon/authenticated —
this closes direct PostgREST access via the public anon key.

**Roles** — `src/lib/permissions.ts` `can(role, capability)`. Matrix:
admin = everything; manager = project/client/expense/invoice/payment writes;
team_member = expense writes only; client = nothing (blocked from the app).
Enforced at the API via `requireCapability(cap)` in `src/lib/api.ts` (every
mutating route) and in the UI via `useCan()` from
`src/components/providers/SessionProvider.tsx` (the `(dashboard)` layout
feeds it `ctx.role`; demo mode = admin).

## Commands

```
npm run dev          # dev server
npm run build        # prod build
npm run typecheck    # tsc --noEmit
npm run lint
npm test             # scripts/check-dashboard.ts — pure-function assertions, no DB
npm run db:migrate   # prisma migrate dev (needs DATABASE_URL + DIRECT_URL)
npm run db:studio
```

CI (`.github/workflows/ci.yml`, on push to main + PRs): `npm ci` →
`next typegen` → typecheck → lint (`--max-warnings 0`) → `npm test` → build.
No DB/secrets needed — every page guards on missing env.

Deploy: Vercel, see `DEPLOY.md`. `vercel-build` = `prisma migrate deploy &&
next build` (migrations apply on every deploy); `binaryTargets` includes the
Vercel runtime; Node pinned to 22.x. Needs the 8 env vars in `DEPLOY.md` +
Supabase Auth redirect URLs + a verified Resend sender.

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

Milestones (`MilestonesCard` + `MilestoneDialog` on the detail page):
`POST /api/projects/[id]/milestones`, `PATCH|DELETE /api/milestones/[id]`
(gated `project:write`). Statuses pending / in_progress / completed
(`queries/milestones.ts`); moving to "completed" stamps `completedDate`.

## Auth pages

`(auth)` route group: `/login`, `/signup`, `/forgot-password`,
`/reset-password`. Reset flow: `resetPasswordForEmail` → link back to
`/reset-password` → `updateUser({ password })`. `proxy.ts` PUBLIC_PATHS
lets those through and does **not** bounce a recovery-session user off
`/reset-password`. Sidebar shows the real session user (name + role);
demo mode (no Supabase env) = "Demo User" / admin.

## Going live with real data

Fill `.env.local` from `.env.example` (Supabase project URL + keys + pooled
DB URLs). Migrations are committed under `prisma/migrations/`.

```
npm run db:migrate                          # after editing schema.prisma
# add SEED_EMAIL="you@example.com" to .env.local first (PowerShell-safe), then:
npm run db:seed                             # fills that agency with demo rows
```
Without `SEED_EMAIL` the seed builds a standalone "Nayan Studio" agency
(no auth user attached — `prisma studio` inspection only). Demo data is
Indian: ₹ figures (`formatCurrency` = INR/en-IN), Indian client/team names,
`money()` scales the authored base units ×40.

## Status

Done: Sprint 1 auth · dashboard · Projects · Expenses · Invoices+payments ·
RLS+roles · Clients · Settings · Analytics · Client portal · Invoice email ·
CI · team invites · overhead→project allocation · milestones CRUD ·
forgot/reset-password · printable invoice PDF · deployed to Vercel
(powerhouse-co.vercel.app).
Time tracking is intentionally OUT (see Profit calculation above).
Next: notifications (overdue reminders) · first-run empty states ·
portal "pay now" · DB region co-location (Vercel iad1 ↔ Supabase Singapore).

### Client portal + invoice email

- `Client.portalToken` (nullable unique). `/portal/[token]` — no auth (proxy
  excludes `/portal`), no sidebar; branded (agency name/logo/brandColor)
  read-only view of that client's invoices + project progress. NO cost /
  profit / margin. Invalid token → 404. `getPortalData()` in
  `src/lib/portal.ts`.
- Token managed from the client detail page (`PortalLinkCard`): generate /
  copy / regenerate → `POST /api/clients/[id]/portal-token`.
- Invoice **Send** (`/api/invoices/[id]/send`) now emails the client via
  Resend (`src/lib/email.ts`) with a link to `/portal/[token]` (lazily
  generating the token if missing). Without `RESEND_API_KEY` it still flips
  the status and returns a note. Needs `RESEND_FROM` (verified sender) +
  `NEXT_PUBLIC_APP_URL` for real delivery.

### Analytics (`/analytics`, any signed-in user)

`src/lib/queries/analytics.ts` `getAnalytics(agencyId, months)` — months is
3/6/12 (`?months=`). Cash flow = payments received vs (project expenses +
company overhead) by month, both by date (team cost has no date so it's
excluded from the monthly view — that view is cash movement, the
profitability table below is full cost). Profitability table = every project
with the full cost breakdown, ranked by margin, CSV via
`GET /api/analytics/export` (`profitabilityCsv()` is pure + unit-tested).

### Settings (`/settings`, `settings:manage` = admin only)

- Agency form (name, monthly revenue target, brand colour, logo URL) →
  `PATCH /api/settings`. The revenue target drives the "% of target" hint +
  progress bar on the dashboard Revenue KPI (`KpiView.hint` / `.progress`).
  Brand colour + logo are stored only — they don't restyle the dashboard.
- Company overhead CRUD (`company_expenses` table): `GET/POST
  /api/company-expenses`, `PATCH/DELETE /api/company-expenses/[id]`.
  Shows normalised $/mo recurring + last-month total.
- Overhead allocation card (`OverheadAllocationCard`): picks the agency
  `overhead_method` (+ `overhead_rate` % when `percent`) → `PATCH /api/settings`
  (`{overheadMethod, overheadRatePct}`; `overheadRatePct` is 0–100, stored ÷100).
  See "Profit calculation" for the rule. The analytics monthly cash-flow view
  still books `company_expenses` by date and is unchanged — no double count.
- Team (`TeamCard`): admins (`team:manage`) invite teammates, change roles
  inline, and deactivate/reactivate members. Assignable roles: admin /
  manager / team_member. Guards: can't change your own role, can't demote or
  deactivate the last active admin (`countActiveAdmins()`).
- Invites: `POST /api/team/invites` creates an `invites` row (random token)
  and emails a link via `sendInviteEmail()` (falls back to a copyable link
  without `RESEND_API_KEY`). `DELETE /api/team/invites/[id]` revokes a
  pending one. `/invite/[token]` is public (proxy excludes `/invite`) —
  shows the agency brand + role, collects name + password, then
  `POST /api/invite/[token]/accept` provisions a confirmed Supabase auth
  user via the service-role client (`src/lib/supabase/admin.ts`), creates
  the `users` row + marks the invite accepted in one transaction (rolls
  back the auth user on failure), and signs them in. Needs
  `SUPABASE_SERVICE_ROLE_KEY`.

### Invoices

`/invoices` (status-tab filters, outstanding/overdue totals) and
`/invoices/[id]` off `src/lib/queries/invoices.ts`. Lifecycle:
draft → send (`/api/invoices/[id]/send`, emails via Resend — see Client
portal + invoice email) → record payments (`/api/invoices/[id]/payments`)
→ auto "paid" when Σpayments ≥ amount. Printable PDF at
`/print/invoice/[id]` (`getInvoicePrintData()`, OS print-to-PDF, no lib). `src/lib/invoice-sync.ts` keeps the stored `status`
in step with payments; `src/lib/invoice-status.ts` `displayInvoiceStatus()`
is the single source of truth for the badge (draft/sent/partial/overdue/
paid/cancelled) and is used by the dashboard, project detail, and invoice
pages. Invoice numbers: `INV-YYYY-NNN`, unique per agency, allocated by
`nextInvoiceNumber()` with retry-on-conflict.
Amount/issue date lock once an invoice leaves draft. Cancel is blocked
while payments exist; only drafts can be hard-deleted.
