# Engineering Plan
# Agency Revenue & Project Control Dashboard

**Version:** 1.0  
**Date:** September 2026  
**Status:** Ready for Sprint Planning  
**Duration:** 12-16 weeks (MVP)

---

## PART 1: PROJECT OVERVIEW

### Vision
Build a fast, reliable, profitable SaaS for contract-based agencies to:
1. Track real-time project profitability
2. Manage fixed-price projects without hourly billing
3. Log team time (internal costing only, not billed to clients)
4. Invoice milestones (fixed amounts)
5. Record payments manually (no payment processor)
6. See cash flow and profit instantly
7. Optional: white-label to other agencies (Phase 2)

### Technical Stack (Locked)

**Frontend:**
- React 18 (hooks, context)
- Next.js 13+ (SSR, API routes, file-based routing)
- TypeScript (strict mode)
- Tailwind CSS (with Outfit font)
- Zustand (state management, lightweight)
- TanStack Query (React Query, data fetching + caching)
- React Hook Form (form handling)
- Zod (runtime schema validation)

**Backend:**
- Node.js 18+ (LTS)
- Express.js (REST API)
- TypeScript (strict mode)
- Prisma ORM (database access)
- Supabase Auth (JWT-based)
- Supabase RLS (row-level security)
- Winston (logging)
- Zod (API validation)

**Database:**
- PostgreSQL 14+ (Supabase managed)
- Prisma migrations
- RLS policies (multi-tenant isolation)

**Hosting:**
- Frontend: Vercel (free tier, auto-deploy from GitHub)
- Backend: Railway ($7/mo) or Hetzner VPS ($5/mo)
- Database: Supabase (free tier, 500MB storage)
- File Storage: Supabase Storage (free, for receipts/logos)
- Email: Resend or SendGrid (free tier)

**DevOps & Monitoring:**
- GitHub (version control, CI/CD)
- GitHub Actions (CI/CD pipeline)
- Sentry (error tracking, free tier)
- Pino (structured logging)
- Swagger/OpenAPI (API documentation)

### Success Criteria (MVP)

✅ **Functional:**
- Users can create agencies, projects, log hours, add expenses
- Profit calculated real-time (no page refresh)
- Invoices linked to milestones, can be sent/paid
- Dashboard shows revenue, profit, cash flow, alerts
- Multi-tenant isolation (RLS enforced)
- Client portal (read-only)

✅ **Performance:**
- Dashboard loads < 2 seconds
- Form submissions < 1 second
- Profit recalculates < 500ms
- 99.9% uptime
- 4 concurrent users can work simultaneously (MVP scale)

✅ **Security:**
- All passwords bcrypt hashed (12 rounds)
- JWT tokens (2-week expiry)
- HTTPS everywhere
- RLS policies enforced on all tables
- No SQL injection, XSS, CSRF
- Rate limiting on API endpoints
- Audit log captures all actions

✅ **UX:**
- Zero page refreshes (SPA)
- Responsive (desktop + mobile)
- Keyboard accessible (WCAG AA)
- Toast notifications for feedback
- Form validation errors inline
- Loading states (skeleton, spinner)
- Empty states with CTA

---

## PART 2: PHASE BREAKDOWN (MVP ONLY)

### Phase 1: MVP (Weeks 1-12)

**Goal:** Fully functional agency dashboard with projects, hours, expenses, invoices, payments.

#### Sprint 1-2: Foundation & Auth (Weeks 1-2)

**Backend:**
- [ ] Setup Node.js + Express + TypeScript + Prisma
- [ ] Create PostgreSQL schema (Supabase)
- [ ] Implement Supabase Auth (JWT, signup, login, password reset)
- [ ] Create user roles middleware (admin, manager, team_member, client)
- [ ] Setup RLS policies (agency_id isolation)
- [ ] Create activity logging (triggers for all changes)
- [ ] Setup error handling middleware
- [ ] Setup Winston logging

**Frontend:**
- [ ] Setup Next.js + TypeScript + Tailwind + Zustand
- [ ] Create folder structure (/pages, /components, /lib, /styles)
- [ ] Implement auth context (login, logout, session)
- [ ] Create login page (email/password form)
- [ ] Create signup page (agency name, email, password)
- [ ] Create password reset flow (forgot → email → reset → login)
- [ ] Protected routes (redirect to login if not authenticated)
- [ ] Setup TanStack Query (API client, cache)
- [ ] Setup error boundaries

**DevOps:**
- [ ] GitHub repo setup
- [ ] GitHub Actions CI/CD (lint, type-check, build)
- [ ] Vercel deployment (auto-deploy on push)
- [ ] Railway/VPS setup + environment variables
- [ ] Supabase setup + RLS enabled
- [ ] Sentry setup (error tracking)

**Deliverable:** Fully functional auth, users can signup/login

---

#### Sprint 3: Dashboard & Project Management (Weeks 3-4)

**Backend:**
- [ ] Create Agency routes (GET, POST, PATCH)
- [ ] Create Project routes (GET all, GET by id, POST, PATCH, DELETE soft)
- [ ] Create Client routes (GET, POST, PATCH)
- [ ] Implement profit calculation (real-time via generated columns)
- [ ] Create ProjectHours routes (POST, GET, DELETE)
- [ ] Create ProjectExpense routes (POST, GET, DELETE)
- [ ] Add input validation (Zod schemas)
- [ ] Add API error handling (consistent error format)
- [ ] Write unit tests for routes (50% coverage minimum)

**Frontend:**
- [ ] Create Dashboard page (metrics cards, project cards, invoice table)
- [ ] Create Projects page (list, filters, search)
- [ ] Create Project Detail page (all sections: team, expenses, milestones, invoices, profit)
- [ ] Create Project Create/Edit modal (form validation)
- [ ] Create Log Hours modal (form, validation)
- [ ] Create Add Expense modal (form, categories, receipt upload)
- [ ] Create Clients page (list, filter)
- [ ] Create Client Detail page (projects, invoices, financial summary)
- [ ] Implement real-time profit updates (no page refresh)
- [ ] Add loading states (skeleton cards, spinners)
- [ ] Add empty states (with CTAs)
- [ ] Add error handling (toast alerts)

**Deliverable:** Full dashboard, create projects, log hours, add expenses, see profit

---

#### Sprint 4: Invoicing & Payments (Weeks 5-6)

**Backend:**
- [ ] Create Invoice routes (GET, POST, PATCH status)
- [ ] Create Milestone routes (GET, POST, PATCH status)
- [ ] Create Payment routes (POST, GET)
- [ ] Implement invoice numbering (INV-2026-001)
- [ ] Implement invoice PDF generation (via Puppeteer or similar)
- [ ] Implement email sending (Resend API for invoice PDFs)
- [ ] Create invoice status logic (draft → sent → viewed → paid → overdue)
- [ ] Implement payment recording (track date, method, reference)
- [ ] Update dashboard cash flow queries
- [ ] Write integration tests (invoice → payment flow)

**Frontend:**
- [ ] Create Invoices page (list, filters, search)
- [ ] Create Invoice Detail page (view, send, mark paid)
- [ ] Create Create Invoice modal (select milestone, custom amount)
- [ ] Create Mark Paid modal (amount, date, method)
- [ ] Implement invoice PDF preview
- [ ] Add "Send Invoice" button (triggers email to client)
- [ ] Add "Mark as Paid" button (records payment)
- [ ] Show invoice status badges (draft, sent, viewed, paid, overdue)
- [ ] Add payment history in invoice detail
- [ ] Add send reminder button (for overdue invoices)

**Deliverable:** Complete invoice workflow, send to clients, record payments

---

#### Sprint 5: Analytics & Reports (Weeks 7-8)

**Backend:**
- [ ] Create Analytics routes (GET profitability by project, by client)
- [ ] Create Reports routes (GET cash flow, revenue trend)
- [ ] Implement profitability ranking query
- [ ] Implement cash flow analysis query
- [ ] Implement team utilization query (hours logged vs capacity)
- [ ] Create CSV export endpoint
- [ ] Create PDF report generation

**Frontend:**
- [ ] Create Analytics page (profit charts, metrics, filters)
- [ ] Create profitability table (projects ranked by profit margin)
- [ ] Create cash flow chart (revenue in vs expenses out)
- [ ] Create revenue trend chart (monthly)
- [ ] Create team utilization chart (hours booked vs capacity)
- [ ] Add date range selector
- [ ] Add download CSV button
- [ ] Add download PDF button

**Deliverable:** Analytics dashboard with charts, reports exportable

---

#### Sprint 6: Team Management & Settings (Weeks 9-10)

**Backend:**
- [ ] Create Team routes (GET members, POST invite, PATCH role, DELETE remove)
- [ ] Create Settings routes (GET, PATCH agency settings)
- [ ] Implement team invitation email
- [ ] Implement role-based access control (middleware)
- [ ] Create Company Expenses routes (GET, POST overhead)

**Frontend:**
- [ ] Create Team page (list members, invite form, manage roles)
- [ ] Create Settings page (agency name, logo, brand color, revenue target)
- [ ] Create Company Expenses section (rent, utilities, etc.)
- [ ] Implement logo upload (Supabase Storage)
- [ ] Add color picker for brand color
- [ ] Add revenue target input
- [ ] Implement invite email sending

**Deliverable:** Team management, settings, company expenses tracking

---

#### Sprint 7: Client Portal & Accessibility (Weeks 11-12)

**Backend:**
- [ ] Create Portal routes (GET public project view)
- [ ] Create Portal auth (token-based, no login required)
- [ ] Implement portal access tokens (generate unique token per project)
- [ ] Create portal email link (send to client with token)

**Frontend:**
- [ ] Create Portal layout (read-only, no forms)
- [ ] Create Portal Project page (status, milestones, hours/effort, invoices)
- [ ] Implement token-based access (no login)
- [ ] Implement token expiry handling
- [ ] Add accessibility audit (WCAG AA)
- [ ] Test keyboard navigation
- [ ] Test screen reader (Axe DevTools)
- [ ] Fix contrast issues (all text ≥ 4.5:1)
- [ ] Test mobile responsiveness

**QA & Testing:**
- [ ] End-to-end tests (Cypress, 20+ scenarios)
- [ ] Manual QA (sign up, create project, log hours, invoice, pay)
- [ ] Load testing (k6, 100 concurrent users)
- [ ] Security testing (OWASP Top 10 check)
- [ ] Browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile testing (iPhone, Android)

**Deliverable:** MVP complete, fully tested, ready for launch

---

## PART 3: TECHNICAL ARCHITECTURE

### Backend Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                       EXPRESS.JS SERVER                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────┐  ┌──────────────────────┐         │
│  │   Auth Middleware    │  │  Error Handler       │         │
│  │ (JWT validation)     │  │ (consistent format)  │         │
│  └──────────────────────┘  └──────────────────────┘         │
│                                                              │
│  ┌──────────────────────────────────────────────┐           │
│  │           ROUTE HANDLERS (Express)           │           │
│  ├──────────────────────────────────────────────┤           │
│  │ /auth    (login, signup, password reset)     │           │
│  │ /agencies (GET, POST, PATCH settings)       │           │
│  │ /projects (CRUD)                            │           │
│  │ /clients (CRUD)                             │           │
│  │ /hours (log time)                           │           │
│  │ /expenses (add project costs)               │           │
│  │ /milestones (CRUD)                          │           │
│  │ /invoices (CRUD, send, mark paid)          │           │
│  │ /payments (record payment)                  │           │
│  │ /analytics (reports, charts)                │           │
│  │ /portal (read-only project view)            │           │
│  └──────────────────────────────────────────────┘           │
│                                                              │
│  ┌──────────────────────────────────────────────┐           │
│  │          SERVICE LAYER (Business Logic)      │           │
│  ├──────────────────────────────────────────────┤           │
│  │ • ProfitCalculator (contract - costs)       │           │
│  │ • InvoiceGenerator (link milestones)        │           │
│  │ • EmailSender (send invoice PDFs)           │           │
│  │ • ReportGenerator (export CSV/PDF)          │           │
│  │ • PDFGenerator (invoice + reports)          │           │
│  └──────────────────────────────────────────────┘           │
│                                                              │
│  ┌──────────────────────────────────────────────┐           │
│  │       PRISMA ORM (Data Access Layer)         │           │
│  ├──────────────────────────────────────────────┤           │
│  │ • User.findUnique()                         │           │
│  │ • Project.findMany() + calculate profit     │           │
│  │ • Invoice.findUnique() + status logic       │           │
│  │ • ActivityLog.create() (audit)              │           │
│  └──────────────────────────────────────────────┘           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────┴───────────────────┐
        ▼                                       ▼
┌──────────────────────┐            ┌──────────────────────┐
│   PostgreSQL via     │            │  Supabase Storage    │
│   Supabase (RLS)     │            │  (receipts, logos)   │
└──────────────────────┘            └──────────────────────┘
```

### Frontend Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    NEXT.JS 13+ (SSR/SPA)                    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────┐           │
│  │          PAGES (File-based routing)          │           │
│  ├──────────────────────────────────────────────┤           │
│  │ /                (landing)                  │           │
│  │ /login           (auth)                     │           │
│  │ /signup          (auth)                     │           │
│  │ /dashboard       (metrics + overview)       │           │
│  │ /projects        (list)                     │           │
│  │ /projects/[id]   (detail)                   │           │
│  │ /invoices        (list)                     │           │
│  │ /invoices/[id]   (detail)                   │           │
│  │ /clients         (list)                     │           │
│  │ /analytics       (reports)                  │           │
│  │ /settings        (team, agency config)      │           │
│  │ /portal/[token]  (read-only project)        │           │
│  └──────────────────────────────────────────────┘           │
│                                                              │
│  ┌──────────────────────────────────────────────┐           │
│  │     COMPONENTS (Reusable UI Elements)        │           │
│  ├──────────────────────────────────────────────┤           │
│  │ • MetricCard (displays number + trend)      │           │
│  │ • ProjectCard (shows profit + status)       │           │
│  │ • Modal (form container)                    │           │
│  │ • Table (invoice list)                      │           │
│  │ • Button (primary, secondary, danger)       │           │
│  │ • Input (text, select, checkbox)            │           │
│  │ • Badge (status indicator)                  │           │
│  │ • Toast (notification)                      │           │
│  │ • Skeleton (loading placeholder)            │           │
│  └──────────────────────────────────────────────┘           │
│                                                              │
│  ┌──────────────────────────────────────────────┐           │
│  │     STATE MANAGEMENT (Zustand + React Query) │           │
│  ├──────────────────────────────────────────────┤           │
│  │ • useAuthStore (user, token, login)        │           │
│  │ • useProjectStore (current project)        │           │
│  │ • useQuery (fetch projects, invoices)      │           │
│  │ • useMutation (create, update, delete)     │           │
│  │ • useInfiniteQuery (pagination)            │           │
│  └──────────────────────────────────────────────┘           │
│                                                              │
│  ┌──────────────────────────────────────────────┐           │
│  │       HOOKS (Custom Business Logic)          │           │
│  ├──────────────────────────────────────────────┤           │
│  │ • useProjects() (fetch + cache)            │           │
│  │ • useInvoices() (fetch + cache)            │           │
│  │ • useProfitCalculation() (real-time)       │           │
│  │ • useAuth() (user state)                   │           │
│  │ • useApi() (error handling)                │           │
│  └──────────────────────────────────────────────┘           │
│                                                              │
│  ┌──────────────────────────────────────────────┐           │
│  │        UTILITIES & HELPERS                   │           │
│  ├──────────────────────────────────────────────┤           │
│  │ • formatCurrency($)                        │           │
│  │ • formatDate()                             │           │
│  │ • calculateProfit()                        │           │
│  │ • validateEmail()                          │           │
│  │ • apiClient (fetch wrapper)                │           │
│  └──────────────────────────────────────────────┘           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────┴───────────────────┐
        ▼                                       ▼
┌──────────────────────┐            ┌──────────────────────┐
│   TanStack Query     │            │   Zustand Store      │
│   (API fetching,     │            │   (App state)        │
│    caching)          │            │                      │
└──────────────────────┘            └──────────────────────┘
                                           ↓
                            ┌──────────────────────────┐
                            │    Supabase Auth         │
                            │    (JWT tokens)          │
                            └──────────────────────────┘
```

---

## PART 4: API SPECIFICATION (Overview)

### REST Endpoints (40+ total)

**Authentication:**
```
POST   /api/auth/signup           (email, password, agency_name)
POST   /api/auth/login            (email, password)
POST   /api/auth/logout           (invalidate token)
POST   /api/auth/forgot-password  (email)
POST   /api/auth/reset-password   (token, new_password)
GET    /api/auth/me               (current user info)
```

**Agencies:**
```
GET    /api/agencies/:id          (get agency settings)
PATCH  /api/agencies/:id          (update name, logo, brand color, revenue target)
GET    /api/agencies/:id/users    (list team members)
```

**Projects:**
```
GET    /api/projects              (list all, with filters & pagination)
POST   /api/projects              (create new project)
GET    /api/projects/:id          (get detail: hours, expenses, milestones, profit)
PATCH  /api/projects/:id          (update name, status, progress)
DELETE /api/projects/:id          (soft delete)
```

**Hours (Time Tracking):**
```
GET    /api/projects/:id/hours    (list hours logged)
POST   /api/projects/:id/hours    (log hours)
PATCH  /api/hours/:id             (update hours)
DELETE /api/hours/:id             (delete entry)
```

**Expenses:**
```
GET    /api/projects/:id/expenses (list expenses)
POST   /api/projects/:id/expenses (add expense)
DELETE /api/expenses/:id          (delete)
```

**Milestones:**
```
GET    /api/projects/:id/milestones       (list milestones)
POST   /api/projects/:id/milestones       (create milestone)
PATCH  /api/milestones/:id                (mark complete, update status)
DELETE /api/milestones/:id                (soft delete)
```

**Invoices:**
```
GET    /api/invoices              (list all invoices)
POST   /api/invoices              (create invoice from milestone)
GET    /api/invoices/:id          (get invoice detail)
PATCH  /api/invoices/:id          (update status, notes)
POST   /api/invoices/:id/send     (send to client via email)
POST   /api/invoices/:id/mark-paid (record payment)
DELETE /api/invoices/:id          (soft cancel)
```

**Payments:**
```
GET    /api/invoices/:id/payments (payment history)
POST   /api/payments              (record payment)
PATCH  /api/payments/:id          (edit payment)
DELETE /api/payments/:id          (delete)
```

**Clients:**
```
GET    /api/clients               (list all clients)
POST   /api/clients               (create new client)
GET    /api/clients/:id           (get client detail + projects + invoices)
PATCH  /api/clients/:id           (update contact info)
DELETE /api/clients/:id           (soft delete)
```

**Team:**
```
GET    /api/team                  (list team members)
POST   /api/team/invite           (send invite email)
PATCH  /api/team/:id              (update role, rate)
DELETE /api/team/:id              (remove member)
```

**Analytics:**
```
GET    /api/analytics/dashboard   (metrics, charts data)
GET    /api/analytics/profitability (projects ranked by profit)
GET    /api/analytics/cash-flow   (revenue vs expenses)
GET    /api/analytics/utilization (team hours vs capacity)
GET    /api/reports/export-csv    (download CSV)
GET    /api/reports/export-pdf    (download PDF report)
```

**Portal (Read-Only):**
```
GET    /api/portal/projects/:token (view project without login)
GET    /api/portal/invoices/:token (view invoices without login)
```

### API Response Format

```json
{
  "success": true,
  "status": 200,
  "data": {
    "id": "uuid",
    "name": "Website Redesign",
    "contractValue": 10000,
    "profit": 4200,
    ...
  },
  "meta": {
    "timestamp": "2026-09-06T10:30:00Z",
    "page": 1,
    "total": 42,
    "limit": 20
  }
}
```

### Error Format

```json
{
  "success": false,
  "status": 400,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      {
        "field": "contractValue",
        "issue": "Must be greater than 0"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-09-06T10:30:00Z",
    "requestId": "req-123456"
  }
}
```

---

## PART 5: DATABASE SETUP & DEPLOYMENT

### Supabase Setup (Free Tier)

```bash
# 1. Create Supabase project
# 2. Create database user (service_role)
# 3. Enable RLS on all tables
# 4. Create RLS policies (agency_id isolation)
# 5. Create storage bucket (receipts, logos)
# 6. Enable email auth

DATABASE_URL=postgresql://[user]:[pass]@[host]:[port]/[db]
SUPABASE_ANON_KEY=[public_anon_key]
SUPABASE_SERVICE_KEY=[service_role_key]
```

### Prisma Migration

```bash
# 1. Create schema.prisma (all 12 tables + relationships)
npm install @prisma/client
npx prisma migrate dev --name init

# 2. Verify schema
npx prisma studio

# 3. Seed test data (optional)
npx ts-node prisma/seed.ts
```

### Environment Variables

```bash
# Backend (.env)
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=super-secret-key-min-32-chars
JWT_EXPIRY=14d
RESEND_API_KEY=re_xxxxx
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=ey...
SENTRY_DSN=https://...
PORT=3001
LOG_LEVEL=info

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ey...
```

### GitHub Actions CI/CD

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel (frontend)
        run: npx vercel --prod
      - name: Deploy to Railway (backend)
        run: npx railway up
```

---

## PART 6: TESTING STRATEGY

### Unit Tests (40% coverage minimum)

```bash
# Testing framework: Jest + @testing-library/react
npm install jest @testing-library/react @testing-library/jest-dom

# Backend tests
npm run test:unit -- src/services/

# Frontend tests
npm run test:unit -- src/components/
```

**What to test:**
- Profit calculation logic
- Invoice number generation
- Date validations
- Currency formatting
- API error handling
- Form validation
- Permission checks (RLS)

### Integration Tests (25% coverage)

```bash
# Backend API integration
npm run test:integration -- src/routes/

# Database with Prisma
npm run test:db
```

**Scenarios:**
- Create project → log hours → profit updates
- Create invoice → send → mark paid
- Multi-tenant isolation (Agency A can't see Agency B)
- Permission checks (TeamMember can't create invoice)

### End-to-End Tests (Cypress)

```bash
npm install cypress
npx cypress open
```

**Flows to test (20+ scenarios):**
1. Signup → login → create agency ✓
2. Create project → log hours → see profit ✓
3. Add expense → profit decreases ✓
4. Create milestone → create invoice → send ✓
5. Mark invoice paid → dashboard updates ✓
6. Login as different role → verify permissions ✓
7. Portal access with token (no login) ✓
8. Mobile: all flows work on mobile ✓

### Load Testing (k6)

```bash
npm install -D k6

npx k6 run load-test.js
```

**Scenarios:**
- 100 concurrent users browsing dashboard
- 50 concurrent invoices being created
- Payment processing (high load)
- Report generation (CPU-heavy)

### Security Testing

```bash
# OWASP Top 10 check
✓ SQL injection (use Prisma, prepared statements)
✓ XSS (React escapes by default, DOMPurify for rich text)
✓ CSRF (CORS configured, no credentials in URLs)
✓ Authentication (JWT, secure HTTP-only cookies)
✓ Authorization (RLS policies enforced)
✓ Sensitive data exposure (HTTPS, no secrets in logs)
✓ XML External Entities (N/A, JSON only)
✓ Broken access control (RLS tested)
✓ Using components with known vulnerabilities (Dependabot)
✓ Insufficient logging (Winston with Sentry)
```

---

## PART 7: ROLLOUT & LAUNCH

### Pre-Launch Checklist

**Week 11:**
- [ ] All tests passing (unit, integration, E2E)
- [ ] Load testing passed (100+ concurrent users)
- [ ] Security audit passed
- [ ] Database backups configured
- [ ] Error monitoring (Sentry) live
- [ ] Rate limiting enabled
- [ ] HTTPS everywhere
- [ ] DNS configured
- [ ] Email sending tested

**Week 12:**
- [ ] Beta testing with 5 real agencies
- [ ] Collect feedback, fix bugs
- [ ] Performance optimizations (if needed)
- [ ] Final QA pass
- [ ] Runbook created (deployment, rollback)
- [ ] Support documentation written
- [ ] Incident response plan ready

### Launch Day

```
1. 8 AM - Final checks (logs, metrics, alerts)
2. 9 AM - Deploy backend to production
3. 9:15 AM - Verify API health checks
4. 9:30 AM - Deploy frontend to Vercel
5. 10 AM - Smoke test (create project, invoice, payment)
6. 10:30 AM - Open to beta users (5 agencies)
7. 11 AM - Monitor logs, fix any issues
8. 2 PM - Open to public (wider rollout)
9. 5 PM - Final health check, close day
10. Daily monitoring for 1 week
```

### Post-Launch Monitoring

```bash
# Real-time alerts
✓ Error rate > 1% → page
✓ Response time > 5 sec → page
✓ Database CPU > 80% → page
✓ OOM (out of memory) → page
✓ 5XX errors → Slack notification

# Daily review
✓ User signups
✓ Active projects
✓ Revenue tracked
✓ Error logs
✓ Performance metrics
```

---

## PART 8: RESOURCE ALLOCATION

### Team Composition (Ideal: 4-5 people)

**Backend Engineer (1-2):**
- Database schema + migrations
- API routes + validation
- Authentication + authorization
- Invoice + payment logic
- Email integration
- 60% of dev time

**Frontend Engineer (1-2):**
- Pages + components
- State management
- Forms + validation
- Real-time updates
- Responsive design
- 60% of dev time

**DevOps/QA Engineer (1):**
- GitHub Actions CI/CD
- Deployment (Vercel, Railway)
- Testing (unit, integration, E2E)
- Load testing
- Monitoring + alerting
- 50% of dev time

**Product Manager (0.5):**
- Prioritization
- Feedback collection
- Beta testing coordination
- 20% of dev time

**Designer (0.5):**
- UI/UX review
- Accessibility audit
- Component review
- 20% of dev time

### Budget Estimation (12-week MVP)

**People:**
- 2 Backend Engineers × 12 weeks × $150/hr = $57,600
- 2 Frontend Engineers × 12 weeks × $150/hr = $57,600
- 1 DevOps/QA × 12 weeks × $120/hr = $28,800
- 0.5 Product Manager × 12 weeks × $140/hr = $8,400
- 0.5 Designer × 12 weeks × $120/hr = $7,200
- **Subtotal: $159,600**

**Infrastructure (Annual):**
- Supabase (free tier)
- Railway backend ($7/mo × 12 = $84)
- Vercel (free tier)
- SendGrid (free tier)
- Sentry (free tier)
- GitHub (free)
- **Subtotal: $84**

**Software & Tools:**
- GitHub Copilot ($10/mo)
- 1Password ($3/user/mo × 5 = $15)
- Figma ($12/mo)
- Slack (free for small team)
- Linear (issue tracking, $7/user/mo × 3 = $21)
- **Subtotal: $406/year**

**Testing & QA:**
- BrowserStack (cloud testing, $19/mo) = $228
- LoadImpact/k6 (free for testing)
- **Subtotal: $228**

**Total (12 weeks): ~$160,118**
**Monthly (after launch): ~$100-150/month infrastructure + ops**

---

## PART 9: RISK MITIGATION

### High-Risk Items

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Database performance (profit calc) | Medium | High | Index optimized, tested at load, calculated columns in DB |
| Real-time sync issues | Medium | High | TanStack Query caching, polling fallback, optimistic updates |
| Authentication/RLS bugs | Low | Critical | RLS policy testing, manual verification, integration tests |
| Payment tracking errors | Low | Critical | Audit log for all payments, reconciliation report, manual backup |
| Deployment failures | Low | High | GitHub Actions tests, staging environment, rollback plan |
| Data loss | Very Low | Critical | Daily Supabase backups, point-in-time recovery enabled |
| Email delivery issues | Low | Medium | Resend + SendGrid fallback, retry logic, delivery tracking |
| Scope creep (more features) | High | High | Strict MVP checklist, Phase 2 backlog, say "no" to new features |

### Rollback Plan

If production breaks:
```
1. Assess severity (data loss? security? just slow?)
2. If data loss: restore from backup (Supabase PITR)
3. If bug: either fix quickly (<2 hrs) or rollback
4. Rollback process:
   - Git revert to last good commit
   - GitHub Actions re-deploy previous version
   - Database: restore from backup or manual migration revert
5. Communication: notify beta users, post status
6. Postmortem: what went wrong, how to prevent
```

---

## PART 10: DELIVERABLES & HANDOFF

### Week 12 Deliverables

**Code:**
- [ ] GitHub repo (clean, documented)
- [ ] 40+ API endpoints (tested, documented)
- [ ] React components (reusable, tested)
- [ ] Database schema + migrations
- [ ] CI/CD pipeline (GitHub Actions)

**Documentation:**
- [ ] API docs (Swagger/OpenAPI)
- [ ] Database schema diagram
- [ ] Architecture diagram
- [ ] Deployment runbook
- [ ] Incident response playbook
- [ ] Developer setup guide (5 mins to run locally)

**Testing:**
- [ ] Unit tests (40% coverage)
- [ ] Integration tests (25% coverage)
- [ ] E2E tests (20+ scenarios)
- [ ] Load test results (100 concurrent users)
- [ ] Security audit report

**Deployment:**
- [ ] Production environment live
- [ ] Monitoring + alerting active
- [ ] Daily backups configured
- [ ] SSL certificate installed
- [ ] Domain DNS configured

**Beta:**
- [ ] 5 agencies onboarded
- [ ] Feedback collected + bugs fixed
- [ ] Support documentation written
- [ ] Ready for public launch

---

## PART 11: POST-LAUNCH ROADMAP (PHASE 2+)

### Phase 2: White-Label & Revenue Optimization (Weeks 13-20)

- [ ] White-label setup (subdomains, branding)
- [ ] Reseller pricing tiers
- [ ] Advanced reporting (more charts, custom date ranges)
- [ ] Mobile app (React Native)
- [ ] API webhooks (for integrations)
- [ ] Accounting software integration (QuickBooks, Xero)

### Phase 3: Enterprise Features (Weeks 21+)

- [ ] Dark mode
- [ ] Multi-currency
- [ ] Advanced permissions (project-level access)
- [ ] Slack integration
- [ ] AI-powered profit predictions
- [ ] Bulk operations (import projects, create invoices)

---

## PART 12: SUCCESS METRICS

### Business Metrics

```
🎯 Target Metrics (First 3 months):
├─ 10 agencies signed up
├─ 50 projects tracked
├─ $500K revenue tracked
├─ 95% invoices paid on time (tracked)
├─ 4.5+ star rating
└─ 0 churn (all beta users retained)

📊 2nd Quarter:
├─ 50 agencies
├─ 300 projects
├─ $5M revenue tracked
└─ < 5% churn
```

### Technical Metrics

```
⚡ Performance:
├─ Dashboard load: < 2 sec (p95)
├─ Profit calc: < 500ms recalc
├─ API response: < 200ms (p95)
├─ Uptime: > 99.9%
└─ Error rate: < 0.1%

🔒 Security:
├─ 0 data breaches
├─ 0 SQL injections
├─ 0 XSS vulnerabilities
├─ 100% HTTPS
└─ All passwords bcrypt (12 rounds)

📈 Reliability:
├─ 0 data loss incidents
├─ < 30 min MTTR (mean time to recover)
├─ Daily backups verified
└─ Disaster recovery tested monthly
```

---

## SUMMARY

**MVP Scope:** 12 weeks, 4-5 people, $160K

**Deliverables:** 
- Fully functional SaaS for contract-based agencies
- Real-time profit tracking
- Invoice management + payment recording
- Client read-only portal
- Multi-tenant security (RLS)
- Production-ready (tested, documented, monitored)

**Launch:** Week 12 (September 30, 2026)

**Post-Launch:** 
- 1 week intensive monitoring
- Daily standups + bug fixes
- Weekly releases with improvements
- Monthly retrospectives

---

**END OF ENGINEERING PLAN**

**Status: Ready for Sprint Planning & Kickoff**

**Next Step:** Create detailed Jira tickets from this plan

