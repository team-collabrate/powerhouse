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

The dashboard profit chart (trailing 12 **months**) amortises each non-closed
project's `teamCost` **and its allocated overhead** linearly across its
start→deadline span (fallback: 90 days from `startDate`, else the last 90 days)
and attributes it to the months it overlaps; cost is never recognised past
today, so the current month reads as partial.

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

**Framing is yearly / all-time, not monthly** — this is a low-volume,
project-based business, so a month-to-date view read as mostly zeros.
Revenue KPI = all-time payments received (hint: this-year figure, and % of
`monthlyRevenueTarget × 12` when a target is set). Projects KPI = count of
non-closed projects (`+N` = created this year, hint = `N in progress ·
X% done` where X is contract-weighted mean `progressPercentage` across active
projects, or `all delivered`). Profit Margin KPI = portfolio-weighted
`Σ profit / Σ contract` across every open project (not a simple average, and
not active-only). Top Projects and the under-margin insight also span all
non-closed projects (the insight still skips `delivered`). Profit chart =
trailing 12 months (see Profit calculation). `getDashboardData` pulls **all**
payments + all milestones. `DashboardView.deliverables` (overdue + upcoming
milestones, from the pure `buildMilestoneRollup`) feeds the "Upcoming
deliverables" card.

`npm run test` runs `scripts/check-dashboard.ts` — pure-function assertions
against `buildDashboardView` with synthetic rows, no DB needed.

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
and `ServiceSelect` both have inline create.

**Services** are per-agency rows (`Service` model: `slug`, `name`, `color`,
`position`, `isActive`), not an enum. `Project.serviceType` keeps holding the
slug (the 5 built-in slugs match the old enum, so no project rows moved;
migration `20260910140000_services` backfills them for every agency, and
`ensureDefaultServices` seeds new ones on signup/seed). `src/lib/services.ts`
(pure, client-safe) has the 7-colour palette, the defaults, and
`serviceLabel()` / `serviceColor()` resolvers (fall back to the built-ins,
then the raw slug). `getServices` (cached) for pages/`GET /api/services`;
`fetchServices` (uncached) inside other query builders. Manage in Settings →
Services (`ServicesCard`): add, recolour, hide/show — no hard delete.
`POST /api/services` + `PATCH /api/services/[id]` are gated `project:write`.
`PROJECT_STATUSES` moved to `src/lib/projects-shared.ts` (client-safe) so the
dialog doesn't pull the cache layer.

Milestones (`MilestonesCard` + `MilestoneDialog` on the detail page):
`POST /api/projects/[id]/milestones`, `PATCH|DELETE /api/milestones/[id]`
(gated `project:write`). Statuses pending / in_progress / completed
(`queries/milestones.ts`); moving to "completed" stamps `completedDate`.

## Activity feed

`/activity` (nav item) — `getActivity(agencyId, cursor?)`
(`queries/activity-feed.ts`) reads `activity_log` newest-first, 40/page,
grouped by day, linked to the entity where `activityHref()` can resolve
one. Every mutation already writes a human-readable `description` via
`logActivity()`.

## Global search

Header search box (`HeaderSearch`) → debounced `GET /api/search?q=` →
`searchAgency(agencyId, q)` (`queries/search.ts`): projects by name,
clients by company/contact/email, invoices by number — 6 each,
case-insensitive. Dropdown with ↑/↓/↵ nav; `/` focuses it.

## Notifications

`getNotifications(agencyId)` (`queries/notifications.ts`, cached with the
`agency-data` tag) computes "needs attention" items from current data — no
table. `buildNotifications` fetches + normalises, then the **pure**
classifiers in `src/lib/reports/notifications.ts` (`classifyInvoice`,
`classifyProjectMargin`/`classifyProjectDeadline`, `classifyMilestone`,
`classifyDraftInvoice`, `classifyRevenueShortfall`) each return an item or
`null`; `assembleNotifications` sorts (high severity first), trims to 15, and
counts high-severity for the badge. Kinds: `overdue` invoices, `due_soon`
(≤ 5 days), `under_margin` (active < 15 %), `past_deadline`,
`milestone_overdue`, `milestone_due` (≤ 5 days), `draft_aging` (draft > 14 d,
never sent → `/invoices/[id]/edit`), `revenue_shortfall` (last week of month,
MTD payments < 60 % of `monthlyRevenueTarget` → `/analytics`). The layout
passes it to `<Header>` → `<NotificationsBell>`. Not shown for `client` role.

## Perf / caching

Vercel functions run in Singapore (`sin1`), co-located with the Supabase
`ap-southeast-1` DB — queries are ~5ms, not ~250ms (a single-query page
dropped from ~1.5s to ~0.25s). On top of that, `src/lib/cache.ts` wraps
`getDashboardData`, `getReport`, `getNotifications` in `unstable_cache`
(45–60s) tagged `agency-data`; `logActivity()` → `bustAgencyData()` drops
that tag on every write. `getSessionContext` and `resolveAgencyOverhead`
are wrapped in React `cache()` for per-request dedup.

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
forgot/reset-password · printable invoice PDF · notifications bell ·
global search · activity feed · account page · first-run state · caching ·
DB co-located in Singapore · deployed to Vercel (powerhouse-co.vercel.app) ·
per-agency reply-to · period-scoped /analytics (FY presets + custom range,
prior-period deltas, payment-method mix, GST-by-quarter, aging, DSO,
expense-by-category, client concentration) · cross-project milestones +
notification kinds · invoice viewedDate.
Time tracking is intentionally OUT (see Profit calculation above).
Next: portal "pay now" is parked (payments handled outside the app).

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

### Analytics (`/analytics`, any signed-in user) — the reporting hub

**Period-scoped.** `src/lib/period.ts` (pure, client-safe) `resolvePeriod`
turns `?period=` (`this_month` | `last_month` | `this_quarter` |
`last_quarter` | `this_fy` | `last_fy` | `ytd` | `last_12_months` | `custom`
with `?from=&to=`) into a `[from, to)` window on the **Indian FY (Apr–Mar)**
plus the comparable prior window and a `cacheKey`. `parsePeriodParams`
(`src/lib/period-params.ts`) reads the search params; `<PeriodSelect>` writes
them. **Cached adapters take `PeriodInput` (strings), never a `Date`** — the
`unstable_cache` key would otherwise explode.

`getReport(agencyId, periodInput)` (`src/lib/queries/report.ts`,
`cacheAgencyRead(fetchReport, ["report"], 60)`) does ONE fetch over
`[prev.from, to)` and calls the **pure builders** in `src/lib/reports/`:
- `period-summary` — money in / out / net + margin, each with a vs-prior delta
  (`deltaPct: null` when the prior window is empty → render "—")
- `payment-methods` — mix by method over the window
- `gst` — tax collected by FY quarter + this-period total; `tax = amount −
  amount/(1+rate/100)` on the tax-inclusive `invoices.amount` (reconciled
  against `invoiceTotals` in a test)
- `aging` — outstanding receivables in current / 1-30 / 31-60 / 61-90 / 90+,
  worst clients
- `dso` — days from issue to payment for invoices paid in the window (mean /
  median / ₹-weighted, slowest)
- `expense-categories` — project & company spend by category + a company trend
- `client-ranking` — revenue concentration (share, cumulative %, top-N, HHI)
- `milestone-rollup` (via `getMilestoneRollup`) — completed in period +
  on-time rate

`src/lib/queries/analytics.ts` is now **pure helpers only** (`buildProfitability`,
`serviceMixByContract`, `profitabilityCsv` — CSV has a Progress column, honours
`?period=`). No more `AnalyticsPeriod` / `AnalyticsPeriodSelect`.

### Settings (`/settings`, `settings:manage` = admin only)

- Agency form (name, monthly revenue target, brand colour, logo URL,
  reply-to email) → `PATCH /api/settings`. The revenue target drives the
  "% of target" hint + progress bar on the dashboard Revenue KPI
  (`KpiView.hint` / `.progress`). Brand colour + logo are stored only — they
  don't restyle the dashboard. **Reply-to email** (`agencies.reply_to_email`,
  nullable) is the address a client's reply lands in — outbound invoice /
  invite mail still sends `from` the platform `RESEND_FROM`, but carries this
  as the `replyTo` header. Blank → `RESEND_REPLY_TO` env fallback (also
  optional). Resolved in `src/lib/email.ts` (`resolveReplyTo`).
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
→ auto "paid" when Σpayments ≥ amount.

**Itemised invoices**: `InvoiceLineItem` rows + a single `Invoice.taxRatePct`.
`invoices.amount` is the computed total (`invoiceTotals()` in
`src/lib/invoice-total.ts`, pure) written on save, so every existing read
is unchanged. "New invoice" makes a draft shell then opens the editor.
`/invoices/[id]/edit` (`InvoiceEditor`, draft-only) — line-item rows on the
left, live `<InvoiceDocument>` preview on the right; "Save & send" saves
then hits `/send`. `PATCH /api/invoices/[id]` branches on `body.lineItems`:
present → full editor save (draft only, replaces items, recomputes amount);
absent → light edit (due date / notes, any non-cancelled status).
Migration `20260908120000_invoice_line_items` backfills one line item per
existing invoice.

**PDF**: `renderInvoicePdf(printData)` in `src/lib/invoice-pdf.tsx`
(`@react-pdf/renderer`, bundled Roboto in `src/assets/fonts/` — currency is
`"Rs. 1,23,456"`, that font has no ₹ glyph; `next.config.ts`
`outputFileTracingIncludes` bundles the fonts into `/api/invoices/**`).
`GET /api/invoices/[id]/pdf` streams it (`inline`); "Send" renders it and
attaches it to the Resend email (best-effort — a render failure still
sends with the portal link). `/print/invoice/[id]` is the HTML/OS-print
view, shares `<InvoiceDocument>`. `@react-pdf` doesn't import under `tsx`
(hyphenate subpath) so it's not in `smoke:live` — verify PDFs by hitting
the route. `src/lib/invoice-sync.ts` keeps the stored `status`
in step with payments; `src/lib/invoice-status.ts` `displayInvoiceStatus()`
is the single source of truth for the badge (draft/sent/partial/overdue/
paid/cancelled) and is used by the dashboard, project detail, and invoice
pages. Invoice numbers: `INV-YYYY-NNN`, unique per agency, allocated by
`nextInvoiceNumber()` with retry-on-conflict.
Amount/issue date lock once an invoice leaves draft. Cancel is blocked
while payments exist; only drafts can be hard-deleted.
`Invoice.viewedDate` is stamped by `getPortalData()` on the client's first
portal view (best-effort `updateMany`); shown on the invoice detail timeline
as "Viewed by client …".
