# Claude Code Development Guide
# Agency Dashboard - Ready for Implementation

**Date:** September 2026  
**Status:** Ready for Claude Code Desktop  
**Stack:** React 18 + Next.js + Node.js + PostgreSQL

---

## 📦 COMPLETE PROJECT PACKAGE

### All Documents Prepared ✅

**19 Total Files** organized by category:

```
📁 /docs/
├─ 📁 /product/
│  ├─ ONE_PAGER.md (5 min product overview)
│  └─ PRD.md (complete product requirements)
├─ 📁 /design/
│  ├─ DESIGN_DECISIONS_FINAL.md (colors, fonts, locked)
│  ├─ UI_UX_DESIGN_BRIEF.md (full design system)
│  ├─ DASHBOARD_DESIGN_SPECIFICATION.md (component specs)
│  └─ APP_FLOW_STATE_MAP.md (20+ screens, user flows)
├─ 📁 /engineering/
│  ├─ ENGINEERING_PLAN.md (7 sprints, 12 weeks)
│  ├─ TDD.md (technical design, 10 decisions)
│  └─ FREE_TECH_STACK.md (zero-cost setup)
├─ 📁 /architecture/
│  └─ SYSTEM_ARCHITECTURE.md (6-layer architecture)
├─ 📁 /database/
│  └─ DATA_MODEL.md (12 tables, Prisma schema, SQL)
├─ PROJECT_SUMMARY.md (executive overview)
└─ /feature docs/
   ├─ agency_dashboard_features.md
   ├─ agency_dashboard_spec.md
   └─ features_breakdown.md

📁 /mockups/
├─ DASHBOARD_REDESIGN_FLOWMAIL_STYLE.html (production design)
└─ dashboard_mockup_final.html (alternative)
```

---

## 🚀 SETUP WITH CLAUDE CODE

### Step 1: Clone & Setup Repository

```bash
# 1. Create project folder
mkdir ~/projects/agency-dashboard
cd ~/projects/agency-dashboard

# 2. Initialize Git + Next.js
npx create-next-app@latest . --typescript --tailwind --eslint
# Select: Yes for Tailwind, Yes for ESLint, App Router

# 3. Copy all documentation
# (Copy /docs folder to project root)

# 4. Install dependencies
npm install

# 5. Setup Prisma
npm install -D prisma @prisma/client
npx prisma init
```

### Step 2: Configure Environment

Create `.env.local`:
```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/agency_db"

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyXxx"

# API
NEXT_PUBLIC_API_URL="http://localhost:3001"

# Email
RESEND_API_KEY="re_xxx"

# JWT
JWT_SECRET="your-super-secret-key-min-32-chars"
JWT_EXPIRY="14d"
```

### Step 3: Database Setup

```bash
# Copy schema from DATA_MODEL.md
# Create prisma/schema.prisma (use Prisma schema provided)

# Run migration
npx prisma migrate dev --name init

# View schema
npx prisma studio
```

### Step 4: Project Structure (Auto-generated)

```
src/
├─ app/
│  ├─ (auth)/
│  │  ├─ login/
│  │  ├─ signup/
│  │  └─ forgot-password/
│  ├─ (dashboard)/
│  │  ├─ dashboard/
│  │  ├─ projects/
│  │  ├─ invoices/
│  │  ├─ analytics/
│  │  └─ settings/
│  ├─ api/
│  │  ├─ auth/
│  │  ├─ projects/
│  │  ├─ invoices/
│  │  └─ [...]
│  └─ layout.tsx
├─ components/
│  ├─ Layout/
│  │  ├─ Sidebar.tsx
│  │  ├─ Header.tsx
│  │  └─ Content.tsx
│  ├─ Cards/
│  │  ├─ MetricCard.tsx
│  │  ├─ ChartCard.tsx
│  │  └─ ProjectCard.tsx
│  ├─ Forms/
│  │  ├─ LoginForm.tsx
│  │  ├─ ProjectForm.tsx
│  │  └─ InvoiceForm.tsx
│  ├─ Tables/
│  │  ├─ ProjectsTable.tsx
│  │  ├─ InvoicesTable.tsx
│  │  └─ PaymentsTable.tsx
│  └─ UI/
│     ├─ Button.tsx
│     ├─ Input.tsx
│     ├─ Modal.tsx
│     └─ Badge.tsx
├─ lib/
│  ├─ api.ts (fetch wrapper)
│  ├─ auth.ts (JWT handling)
│  ├─ prisma.ts (DB client)
│  └─ utils.ts (helpers)
├─ hooks/
│  ├─ useAuth.ts
│  ├─ useProjects.ts
│  ├─ useInvoices.ts
│  └─ useApi.ts
├─ store/
│  ├─ authStore.ts (Zustand)
│  └─ uiStore.ts
├─ styles/
│  ├─ globals.css
│  └─ variables.css (CSS variables)
├─ types/
│  ├─ index.ts (all TS types)
│  └─ database.ts (Prisma types)
└─ prisma/
   ├─ schema.prisma
   └─ seed.ts
```

---

## 💻 CLAUDE CODE WORKFLOW

### Phase 1: Foundation (Sprint 1-2)

**In Claude Code Desktop:**

```
Task 1: Setup Express Backend
- Create backend folder: /backend
- npm init → package.json
- Install: express, typescript, prisma, @supabase/auth-helpers
- Create src/server.ts with Express app
- Create src/middleware/auth.ts (JWT validation)
- Create src/middleware/errorHandler.ts

Task 2: Create Database Schema
- Copy DATA_MODEL.md Prisma schema
- Create prisma/schema.prisma
- Create .env with DATABASE_URL
- Run: npx prisma migrate dev --name init

Task 3: Auth Routes
- Create src/routes/auth.ts
- Implement: POST /api/auth/signup, /login, /forgot-password
- Use Supabase Auth (JWT tokens)
- Add password hashing (bcrypt)

Task 4: Frontend Layout
- Create src/components/Layout/Sidebar.tsx
- Create src/components/Layout/Header.tsx
- Create src/app/layout.tsx (root layout)
- Apply CSS from DASHBOARD_DESIGN_SPECIFICATION.md
```

**Claude Code Instructions:**
```
"Create the complete Express.js backend foundation for agency dashboard.
Reference: /docs/engineering/TDD.md for API endpoints.
Follow: /docs/engineering/FREE_TECH_STACK.md for tech choices.
Design: Use CSS from /docs/design/DASHBOARD_DESIGN_SPECIFICATION.md
Use TypeScript strict mode, proper error handling, Winston logging."
```

### Phase 2: Dashboard & Projects (Sprint 3)

```
Task 1: Dashboard Page
- Create src/app/(dashboard)/dashboard/page.tsx
- Build 4 metric cards (use MetricCard component)
- Build 3 chart sections (placeholders for now)
- Use TanStack Query for data fetching
- Reference: /mockups/DASHBOARD_REDESIGN_FLOWMAIL_STYLE.html

Task 2: API Routes
- Create src/app/api/projects/route.ts
- Implement: GET (list), POST (create)
- Add RLS checks (agency_id filter)
- Add Zod validation

Task 3: Project Pages
- Create src/app/(dashboard)/projects/page.tsx
- Create src/app/(dashboard)/projects/[id]/page.tsx
- Fetch and display project list
- Real-time profit calculation

Task 4: Forms & Modals
- Create src/components/Forms/ProjectForm.tsx
- Create src/components/UI/Modal.tsx
- Implement form validation (React Hook Form + Zod)
```

### Phase 3: Invoices & Payments (Sprint 4)

```
Task 1: Invoice Routes
- Create src/app/api/invoices/route.ts
- Implement invoice CRUD + PDF generation
- Email sending (Resend API)
- Invoice numbering logic

Task 2: Invoice Pages
- Create src/app/(dashboard)/invoices/page.tsx
- Create src/app/(dashboard)/invoices/[id]/page.tsx
- Status badge system
- Payment recording UI

Task 3: Payment Logic
- Create src/app/api/payments/route.ts
- Implement payment recording
- Update invoice status (draft → sent → paid)
- Activity logging
```

### Phase 4: Analytics & Reports (Sprint 5)

```
Task 1: Analytics Routes
- Create src/app/api/analytics/route.ts
- Implement profit calculations (from DATA_MODEL.md)
- Cash flow queries
- Team utilization queries

Task 2: Analytics Pages
- Create src/app/(dashboard)/analytics/page.tsx
- Add Recharts for visualizations
- Filters (date range, project type)
- Export CSV/PDF functionality

Task 3: Charts
- Profit trend line chart
- Project types pie chart
- Cash flow bar chart
```

---

## 📋 CLAUDE CODE COMMANDS

### Open Claude Code Desktop

```bash
# 1. Install Claude Code
npm install -D @anthropic-ai/claude-code

# 2. Open project in Claude Code
claude-code open ~/projects/agency-dashboard

# 3. Start development
npm run dev
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
```

### Example Development Tasks

```
# Task 1: Create metric card component
"Create a React component for metric cards following /docs/design/DASHBOARD_DESIGN_SPECIFICATION.md.
Props: label, value, change%, positive/negative.
Style: #5cd65c border on hover, 12px border-radius, #fafafa background.
Use Tailwind CSS with the colors from DESIGN_DECISIONS_FINAL.md"

# Task 2: API endpoint for projects
"Create Express.js GET /api/projects endpoint.
- Use Prisma to fetch projects from DB
- Filter by agency_id from JWT token
- Include calculated fields: profit, profit_margin, total_cost
- Add pagination (page, limit query params)
- Return standardized response format from TDD.md
- Add Zod validation for query params"

# Task 3: Real-time profit calculation
"Implement real-time profit calculation in frontend.
- Create useProjects() hook (TanStack Query)
- Formula: contract_value - (team_cost + expenses + overhead)
- Update when hours or expenses change
- Use Zustand store for client state
- Reference: DATA_MODEL.md profit formula"
```

---

## 📊 REFERENCE DOCUMENTS (Use in Claude Code)

When giving Claude Code tasks, reference these docs:

```
API Specification:
→ /docs/engineering/TDD.md (40+ endpoints, auth flow)

Component Specs:
→ /docs/design/DASHBOARD_DESIGN_SPECIFICATION.md (colors, sizes, hover states)

Database Schema:
→ /docs/database/DATA_MODEL.md (12 tables, relationships, RLS)

User Flows:
→ /docs/design/APP_FLOW_STATE_MAP.md (20+ screens, form flows)

Design System:
→ /docs/design/DESIGN_DECISIONS_FINAL.md (locked colors #5cd65c, #9933ff)

Dashboard Layout:
→ /mockups/DASHBOARD_REDESIGN_FLOWMAIL_STYLE.html (visual reference)

Tech Stack:
→ /docs/engineering/FREE_TECH_STACK.md (React, Next.js, Node, Supabase)
```

---

## 🔧 DEVELOPMENT COMMANDS

```bash
# Development
npm run dev           # Run frontend + backend
npm run dev:fe       # Frontend only (port 3000)
npm run dev:be       # Backend only (port 3001)

# Database
npx prisma migrate dev --name [migration-name]
npx prisma studio   # Visual DB browser
npx prisma generate # Regenerate Prisma client

# Testing
npm run test         # Run all tests
npm run test:watch  # Watch mode
npm run test:coverage

# Building
npm run build        # Production build
npm run start        # Run production build

# Linting
npm run lint         # ESLint
npm run type-check  # TypeScript check

# Git
git add .
git commit -m "feat: add dashboard metrics"
git push origin main
```

---

## ✅ SPRINT CHECKLIST

### Sprint 1-2: Foundation & Auth (Weeks 1-2)

- [ ] GitHub repo created
- [ ] Next.js + Express boilerplate setup
- [ ] Prisma schema created (from DATA_MODEL.md)
- [ ] Database migrations running
- [ ] JWT auth implemented (Supabase)
- [ ] Login/signup pages built
- [ ] Protected routes working
- [ ] Error handling middleware added
- [ ] Winston logging configured
- [ ] Sidebar component created
- [ ] Header component created
- [ ] All tests passing

### Sprint 3: Dashboard & Projects (Weeks 3-4)

- [ ] Dashboard page displays 4 metric cards
- [ ] Metric cards fetch real data via API
- [ ] Real-time profit calculation working
- [ ] Projects CRUD endpoints implemented
- [ ] Projects list page displays projects
- [ ] Project detail page shows all sections
- [ ] Project create/edit forms working
- [ ] Time logging modal implemented
- [ ] Expense adding modal implemented
- [ ] RLS policies enforced on all queries
- [ ] Activity logging working

### Sprint 4: Invoicing & Payments (Weeks 5-6)

- [ ] Invoice CRUD endpoints implemented
- [ ] Invoice numbering system working
- [ ] PDF generation (Puppeteer or similar)
- [ ] Email sending (Resend API)
- [ ] Invoice status workflow (draft → sent → paid)
- [ ] Payment recording implemented
- [ ] Payment table displays history
- [ ] Dashboard shows cash flow
- [ ] Overdue invoice alerts
- [ ] All tests passing

### Sprint 5: Analytics & Reports (Weeks 7-8)

- [ ] Analytics routes created
- [ ] Recharts integrated
- [ ] Profitability chart displays
- [ ] Cash flow chart displays
- [ ] Team utilization chart displays
- [ ] Date range filters working
- [ ] CSV export working
- [ ] PDF report generation
- [ ] AI insights card displays
- [ ] Analytics page responsive

### Sprint 6: Team & Settings (Weeks 9-10)

- [ ] Team management page
- [ ] User invitation system
- [ ] Role management working
- [ ] Settings page shows agency config
- [ ] Logo upload (Supabase Storage)
- [ ] Brand color picker
- [ ] Company expenses tracking
- [ ] Overhead allocation working
- [ ] All permissions enforced

### Sprint 7: Portal & Testing (Weeks 11-12)

- [ ] Client portal pages created
- [ ] Token-based access (no login)
- [ ] Read-only project view
- [ ] Portal responsive design
- [ ] Unit tests (40% coverage)
- [ ] Integration tests (25% coverage)
- [ ] E2E tests (20+ scenarios)
- [ ] Load testing (100 concurrent users)
- [ ] Security audit passed
- [ ] Accessibility audit (WCAG AA)
- [ ] All documentation updated

---

## 🎯 QUICK START (15 MIN)

```bash
# 1. Clone repo
git clone https://github.com/yourusername/agency-dashboard.git
cd agency-dashboard

# 2. Install deps
npm install

# 3. Setup environment
cp .env.example .env.local
# Fill in values

# 4. Setup database
npx prisma migrate dev --name init

# 5. Start dev
npm run dev

# 6. Open browser
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
# Prisma Studio: http://localhost:5555
```

---

## 📚 DOCUMENT REFERENCE

| Document | Purpose | Read When |
|----------|---------|-----------|
| ONE_PAGER.md | Product overview | Starting project |
| PRD.md | Complete requirements | Feature planning |
| ENGINEERING_PLAN.md | Dev roadmap | Sprint planning |
| TDD.md | Technical design | Building API |
| DATA_MODEL.md | Database schema | Creating models |
| DESIGN_DECISIONS_FINAL.md | Design tokens | Building components |
| DASHBOARD_DESIGN_SPECIFICATION.md | Component specs | Styling UI |
| APP_FLOW_STATE_MAP.md | User flows | Building forms |
| FREE_TECH_STACK.md | Technology choices | Setup phase |
| DASHBOARD_REDESIGN_FLOWMAIL_STYLE.html | Visual reference | Building dashboard |

---

## 🆘 TROUBLESHOOTING

### Database Connection Error
```
→ Check DATABASE_URL in .env.local
→ Verify Supabase project is running
→ Run: npx prisma migrate reset (warning: deletes data)
```

### JWT Token Invalid
```
→ Check JWT_SECRET is set
→ Verify token hasn't expired (14 days)
→ Clear browser cookies, login again
```

### RLS Policy Error
```
→ Check agency_id is set in JWT claims
→ Verify RLS policies exist (see DATA_MODEL.md)
→ Test directly in Prisma Studio
```

### API 404 Not Found
```
→ Check route file is in src/app/api/
→ Verify file naming: route.ts (not router.ts)
→ Restart dev server: Ctrl+C, npm run dev
```

---

## 🚀 READY TO CODE

**Everything is prepared:**
- ✅ Product defined (ONE_PAGER + PRD)
- ✅ Design locked (DESIGN_DECISIONS_FINAL)
- ✅ Database designed (DATA_MODEL with Prisma schema)
- ✅ API specified (40+ endpoints in TDD)
- ✅ Timeline planned (7 sprints in ENGINEERING_PLAN)
- ✅ Mockup created (DASHBOARD_REDESIGN_FLOWMAIL_STYLE.html)
- ✅ Tech stack chosen (FREE_TECH_STACK)

**Next step:** Open Claude Code Desktop and start Sprint 1-2

```
cd ~/projects/agency-dashboard
claude-code open .
```

**Then ask Claude Code:**
"Set up the Express.js backend foundation with Prisma for the agency dashboard.
Reference /docs/engineering/TDD.md for API endpoints, /docs/database/DATA_MODEL.md for schema."

---

**Status: ✅ READY FOR CLAUDE CODE DEVELOPMENT**

**Estimated Timeline:** 12 weeks to MVP (4-5 person team)

**Questions?** Reference the appropriate document in /docs/

