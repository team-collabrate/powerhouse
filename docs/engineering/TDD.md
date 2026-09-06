# Technical Design Document (TDD)
# Agency Revenue & Project Control Dashboard

**Version:** 1.0  
**Date:** September 2026  
**Status:** Accepted  
**Target Release:** Phase 1 (Weeks 1-12)

---

## EXECUTIVE SUMMARY

This document outlines the technical architecture, implementation decisions, and design patterns for building the Agency Dashboard as a scalable, multi-tenant PWA.

**Key Technical Decisions:**
- Multi-tenant PostgreSQL with agency isolation at row level
- Next.js PWA (React 18) for frontend with offline capability
- Express.js REST API backend with minimal overhead
- Supabase for managed PostgreSQL + auth
- Vercel for frontend, Railway/VPS for backend

**Expected Outcomes:**
- MVP in 12 weeks
- Support 100+ concurrent users per agency
- Real-time profit calculation
- <2 second dashboard load
- Zero hosting cost (free tier)

---

## ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │
│  │  Web App (PWA)   │  │  Client Portal   │  │  Mobile (Responsive) │  │
│  │  React + Next.js │  │  (Read-only)     │  │  (Safari/Chrome)     │  │
│  └────────┬─────────┘  └────────┬─────────┘  └─────────┬────────────┘  │
└───────────┼──────────────────────┼────────────────────────┼──────────────┘
            │                      │                        │
        ┌───┴──────────────────────┴────────────────────────┴───┐
        │        API Gateway (Vercel for frontend)             │
        │     (Routes to Express backend via CORS)             │
        └───┬────────────────────────────────────────────────┬──┘
            │                                                  │
┌───────────v──────────────────────────────────────────────────v────────┐
│                   BACKEND LAYER (Express.js)                           │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  Authentication Service (JWT + Supabase Auth)                  │  │
│  │  ├── Login/Signup                                              │  │
│  │  ├── JWT token generation (2-week expiry)                      │  │
│  │  └── Role-based middleware                                     │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐            │
│  │ Project Module │ │ Financial Mod. │ │ Team Module    │            │
│  │ ├─ CRUD        │ │ ├─ Invoices    │ │ ├─ Timesheets  │            │
│  │ ├─ Milestones  │ │ ├─ Payments    │ │ ├─ Utilization │            │
│  │ ├─ Status      │ │ ├─ Expenses    │ │ ├─ Capacity    │            │
│  │ └─ Search      │ │ └─ Profit calc │ │ └─ Rates       │            │
│  └────────────────┘ └────────────────┘ └────────────────┘            │
│                                                                         │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐            │
│  │ Client Module  │ │ Analytics Mod. │ │ Portal Module  │            │
│  │ ├─ Profiles    │ │ ├─ Dashboard   │ │ ├─ Read-only   │            │
│  │ ├─ CRUD        │ │ ├─ Reports     │ │ │   access     │            │
│  │ └─ Summary     │ │ ├─ Forecast    │ │ └─ View data   │            │
│  │                │ │ └─ Trends      │ │                │            │
│  └────────────────┘ └────────────────┘ └────────────────┘            │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  Data Access Layer (Prisma ORM)                                 │  │
│  │  ├── Query optimization (indexing, eager loading)               │  │
│  │  ├── Raw SQL for complex profit calculations                    │  │
│  │  └── Connection pooling (PgBouncer)                             │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────┘
            │                              │                     │
┌───────────v──────────────────────────────v──────────────────────v────┐
│                      DATA LAYER                                        │
│  ┌─────────────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│  │  PostgreSQL         │  │  Redis Cache     │  │  File Storage  │  │
│  │  ├─ Agencies        │  │  ├─ Sessions     │  │  ├─ Invoices   │  │
│  │  ├─ Users           │  │  ├─ Auth tokens  │  │  ├─ Receipts   │  │
│  │  ├─ Projects        │  │  ├─ Real-time    │  │  └─ Documents  │  │
│  │  ├─ Timesheets      │  │  │   updates     │  │  (Supabase S3) │  │
│  │  ├─ Invoices        │  │  └─ Cache profit │  │                │  │
│  │  ├─ Expenses        │  │     calculations │  │                │  │
│  │  └─ Payments        │  │                  │  │                │  │
│  └─────────────────────┘  └──────────────────┘  └────────────────┘  │
└───────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────────┐ │
│  │ Email Service    │  │ Authentication   │  │ Analytics          │ │
│  │ (SendGrid/Resend)│  │ (Supabase Auth)  │  │ (Google Analytics) │ │
│  └──────────────────┘  └──────────────────┘  └────────────────────┘ │
└───────────────────────────────────────────────────────────────────────┘
```

---

## TECHNICAL DECISIONS

### DECISION 1: Multi-Tenant Architecture with Row-Level Security

**Status:** Accepted  
**Context:** Need to support multiple agencies, each with isolated data, within single application. Privacy and data isolation are critical.

**Options considered:**
- **A) Separate database per agency** (Most secure, highest cost, operational overhead)
- **B) Single database with row-level security (RLS) via agency_id** (Best balance)
- **C) Single schema, trust middleware for isolation** (Fastest to code, risky)

**Choice:** B - Row-level security via agency_id

**Reason:**
- Simplest operational model (single database)
- Enterprise-grade security (PostgreSQL RLS enforces isolation at row level)
- Cost-effective (single database, no replication)
- Easy backups and scaling
- Supabase provides managed PostgreSQL with RLS built-in

**Consequences:**
- Must include agency_id in EVERY query filter (middleware enforces this)
- Requires careful testing to ensure no data leakage
- Performance: Need indexes on (agency_id, other_columns) for speed
- Revisit if: Supporting 100+ agencies with 1M+ rows each (may need sharding)

**Implementation:**
```sql
-- PostgreSQL RLS Policy Example
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY projects_isolation_policy ON projects
  USING (agency_id = auth.jwt() ->> 'agency_id')
  WITH CHECK (agency_id = auth.jwt() ->> 'agency_id');
```

---

### DECISION 2: Real-Time Profit Calculation Strategy

**Status:** Accepted  
**Context:** Dashboard needs instant profit calculation (Contract - Team cost - Expenses - Overhead). Can't recalculate for every page view.

**Options considered:**
- **A) Calculate on every view** (Simple to code, slow, database thrashing)
- **B) Pre-calculate in background job** (Complex, eventual consistency)
- **C) Cache in Redis + event-driven recalculation** (Real-time + fast)
- **D) Hybrid: Cached calculation + real-time updates via WebSocket** (Best UX)

**Choice:** D - Hybrid: Redis cache + event-driven updates

**Reason:**
- Dashboard loads in <2 seconds (cached value)
- Profit updates in real-time as hours/expenses added (event triggers recalculation)
- No background jobs needed (event-driven is simpler)
- Works offline (PWA loads cached profit)

**Consequences:**
- Must maintain Redis cache consistency (risk of stale data if event missed)
- Complexity: Event handlers for hours, expenses, overhead added
- Cost: Redis instance required (but free tier available)
- Revisit if: Cache invalidation issues become common (add queue-based recalculation)

**Implementation:**
```typescript
// On hours logged
async function logHours(projectId, hours, rate) {
  const newCost = hours * rate;
  const project = await Project.findById(projectId);
  
  // Update cache
  await redis.incr(`project:${projectId}:cost`, newCost);
  
  // Emit event for real-time UI update
  io.to(`project-${projectId}`).emit('hours_logged', { projectId, newCost });
  
  // Trigger profit recalculation
  await recalculateProjectProfit(projectId);
}

async function recalculateProjectProfit(projectId) {
  const profit = await db.query(`
    SELECT 
      contract_value - COALESCE(SUM(cost), 0) - COALESCE(SUM(expenses), 0) - allocated_overhead
      AS profit
    FROM projects
    WHERE id = $1
  `);
  
  await redis.set(`project:${projectId}:profit`, profit);
  io.to(`project-${projectId}`).emit('profit_updated', { profit });
}
```

---

### DECISION 3: Time Tracking Model (Internal Cost vs. Hourly Billing)

**Status:** Accepted  
**Context:** Product is contract-based only (no hourly billing to clients). Team tracks hours for internal cost calculation.

**Options considered:**
- **A) Track hours + hourly rate** (Allows both billing models, complex)
- **B) Track hours + internal cost rate only** (V1 only, simple)
- **C) Don't track hours at all** (No cost visibility, bad)

**Choice:** B - Track hours + internal cost rate only

**Reason:**
- Simpler data model (no confusion between billing rate vs. cost rate)
- Faster to build (V1 requirement)
- All data accessible in client portal (no rate confusion)
- Can add hybrid later (Phase 2)

**Consequences:**
- Can't support hourly billing to clients (contract-based only)
- Team sees hours but not rates (rates are internal)
- Migration to hourly billing would require schema change (Phase 2)
- Revisit if: Client requests hourly billing capability (add separate rate column)

**Schema:**
```sql
CREATE TABLE timesheets (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  user_id UUID REFERENCES users(id),
  hours_logged DECIMAL,
  date DATE,
  description TEXT,
  approved_by UUID,
  approved_at TIMESTAMP,
  cost DECIMAL -- hours_logged × user.internal_cost_rate
);

CREATE TABLE users (
  id UUID PRIMARY KEY,
  internal_cost_rate DECIMAL, -- Cost to agency (salary/rate)
  -- NO public_hourly_rate (for client billing) in V1
);
```

---

### DECISION 4: Invoice Generation (Template vs. Milestone-Linked)

**Status:** Accepted  
**Context:** Invoices need to show milestone deliverables, effort invested, and be tied to specific project phases.

**Options considered:**
- **A) Free-form invoice creation** (Flexible, prone to errors)
- **B) Milestone-linked invoicing** (Structured, forces clarity)
- **C) Template-based invoicing** (Reusable, less flexible)

**Choice:** B - Milestone-linked invoicing

**Reason:**
- Forces clarity: Each milestone = one invoice phase
- Automatic: Invoice inherits deliverables, description from milestone
- Auditability: Clear link between contract → milestone → invoice
- Client transparency: Clients see what they're being invoiced for

**Consequences:**
- Requires milestones before invoicing (can't skip)
- Partial milestone invoicing not supported in V1 (full milestone only)
- Risk: Team may create dummy milestones to invoice (solved by review process)
- Revisit if: Clients request partial invoicing (Phase 2: split milestone invoice)

**Schema:**
```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  invoice_number VARCHAR(50) UNIQUE,
  amount DECIMAL,
  status VARCHAR(50), -- Draft, Sent, Viewed, Paid, Overdue
  issue_date DATE,
  due_date DATE,
  paid_date DATE
);

CREATE TABLE invoice_items (
  id UUID PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id),
  milestone_id UUID REFERENCES project_milestones(id), -- Links to milestone
  description TEXT,
  amount DECIMAL
);
```

---

### DECISION 5: Frontend Framework (React + Next.js vs. Vue vs. Angular)

**Status:** Accepted  
**Context:** Need PWA with offline capability, SSR for performance, easy deployment.

**Options considered:**
- **A) React + Create React App** (Popular, but CRA = overhead)
- **B) React + Next.js** (SSR, PWA ready, Vercel deployment)
- **C) Vue 3 + Nuxt** (Simpler DX, but smaller ecosystem)
- **D) Angular** (Enterprise, but heavyweight)

**Choice:** B - React + Next.js

**Reason:**
- Next.js PWA support is production-ready
- Vercel deployment is 1-click (Vercel created Next.js)
- SSR improves initial load + SEO
- File-based routing is simple
- TypeScript support is excellent
- Large community, abundant libraries

**Consequences:**
- Learning curve for developers new to Next.js
- File-based routing can feel constraining (rarely an issue)
- Vercel lock-in for easy deployment (but works on any Node host)
- Revisit if: Team prefers Vue DX (Nuxt is equally good)

**Implementation:**
```typescript
// next.config.js - PWA setup
const withPWA = require('next-pwa');

module.exports = withPWA({
  pwa: {
    dest: 'public',
    register: true,
    skipWaiting: true,
    offline: true,
  },
});
```

---

### DECISION 6: Payment Processing Integration

**Status:** Accepted  
**Context:** Product has no automated payment processing. Clients pay via bank transfer, cheque, cash.

**Options considered:**
- **A) Integrate Stripe** (Automatic, but adds cost & complexity)
- **B) Integrate PayPal** (Alternative, still adds cost)
- **C) Manual payment entry** (No integration, simple UI)

**Choice:** C - Manual payment entry (no integration)

**Reason:**
- Zero processing fees (no Stripe 2.9% + $0.30)
- Faster MVP (no payment gateway debugging)
- Simpler compliance (no PCI DSS headaches)
- Agencies handle payments out-of-system anyway
- Can add Stripe in Phase 2 if demand exists

**Consequences:**
- No automatic payment confirmation (manual entry required)
- No webhook for payment notifications (team monitors manually)
- Reconciliation done manually (but simple: mark invoice paid)
- Risk: User error in recording payments (mitigated by audit trail)
- Revisit if: 50%+ of agencies request automated payments (Phase 2)

**Schema:**
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id),
  amount DECIMAL,
  payment_date DATE,
  payment_method VARCHAR(100), -- "Bank Transfer", "Cheque", "Cash"
  notes TEXT,
  recorded_by UUID REFERENCES users(id),
  recorded_at TIMESTAMP
);
```

---

### DECISION 7: Database Choice (PostgreSQL vs. MongoDB vs. DynamoDB)

**Status:** Accepted  
**Context:** Need relational data (projects, invoices, timesheets), complex queries (profit calc, reporting), ACID transactions.

**Options considered:**
- **A) PostgreSQL** (ACID, powerful, battle-tested)
- **B) MongoDB** (Flexible schema, but worse for transactions)
- **C) DynamoDB** (Serverless, but expensive, poor JOIN support)
- **D) Firebase/Firestore** (Managed, but lock-in, harder to migrate)

**Choice:** A - PostgreSQL (via Supabase)

**Reason:**
- ACID transactions guarantee profit calculations are correct
- Complex queries: Self-joins, aggregations, window functions (needed for reporting)
- Row-level security built-in (security requirement)
- Supabase = managed PostgreSQL (no ops burden)
- Cheaper at scale than Firebase
- Easy to migrate to self-hosted later

**Consequences:**
- Requires SQL knowledge (not as flexible as NoSQL)
- Schema migrations must be planned (V1 design must be solid)
- Scaling: Supabase free tier limited to 2GB (paid tier at $25/mo)
- Revisit if: Schema becomes unmaintainable (unlikely in V1)

---

### DECISION 8: Caching Strategy (Redis vs. In-Memory vs. CDN)

**Status:** Accepted  
**Context:** Real-time profit calculation needs to be fast. Dashboard loads every day for 100+ users per agency.

**Options considered:**
- **A) No caching** (Database hits every time, slow)
- **B) In-memory cache (Node process)** (Lost on restart, doesn't scale)
- **C) Redis** (External cache, survives restarts, scales)
- **D) CDN + Cache headers** (For static content only)

**Choice:** C - Redis (Upstash free tier)

**Reason:**
- Profit calculations cached, retrieved in <100ms
- Sessions stored in Redis (scales across multiple Node processes)
- Real-time updates via Redis pub/sub (WebSocket events)
- Upstash free tier: 10,000 commands/day (sufficient for MVP)
- Easy to implement, standard pattern

**Consequences:**
- Another service to monitor (but Upstash handles it)
- Cache invalidation complexity (but events handle it)
- Cost: Free tier sufficient for MVP, $1-10/mo if scaling
- Revisit if: Cache hit rate drops below 80% (add more keys)

---

### DECISION 9: Authentication Method (JWT vs. Session vs. OAuth)

**Status:** Accepted  
**Context:** Need secure authentication, support for white-label (own subdomain), no third-party login required.

**Options considered:**
- **A) JWT tokens** (Stateless, scalable, but complex)
- **B) Sessions + cookies** (Stateful, simpler, less scalable)
- **C) OAuth/SSO** (Third-party, requires integration, overkill)

**Choice:** A - JWT tokens (via Supabase Auth)

**Reason:**
- Stateless: Works across multiple backend instances
- Scalable: No session store needed
- Supabase Auth: Managed JWT service (passwordless signup ready)
- Secure: Signed tokens, can't be forged
- Works for white-label: Each agency has own auth

**Consequences:**
- Logout complexity: Token can't be revoked until expiry (2 weeks)
- Token refresh needed: Must refresh before 2 weeks or re-login
- Secret management: Backend must store JWT secret securely
- Risk: Token theft = account hijacking (mitigated by HTTPS + short expiry)
- Revisit if: Immediate logout required (add token blacklist cache)

**Implementation:**
```typescript
// Middleware: Verify JWT on every request
export function verifyJWT(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { agency_id, user_id, role }
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

---

### DECISION 10: Reporting & Analytics (Pre-calculated vs. On-Demand)

**Status:** Accepted  
**Context:** Reports (profitability, cash flow, team hours) are needed monthly but queries can be expensive.

**Options considered:**
- **A) Calculate on-demand** (Simple, but slow for large datasets)
- **B) Pre-calculate via background jobs** (Fast, eventual consistency)
- **C) Materialized views in PostgreSQL** (Enterprise, complex)

**Choice:** A - Calculate on-demand (Phase 1), Pre-calculate Phase 2

**Reason:**
- MVP simplicity: No background jobs, no cron overhead
- Datasets small in Phase 1 (<1M rows per agency)
- Queries optimized with indexes
- Can add pre-calculation later if reports are slow
- Cost: Free tier sufficient for MVP

**Consequences:**
- Reports take 2-5 seconds to generate (acceptable for human consumption)
- Can't do real-time dashboards (but not required for V1)
- Large datasets (10M+ rows) would need Phase 2 optimization
- Revisit if: Report generation exceeds 10 seconds (add materialized views)

**Schema (Indexes for Performance):**
```sql
CREATE INDEX idx_timesheets_project_date 
  ON timesheets(project_id, date);

CREATE INDEX idx_invoices_project_status 
  ON invoices(project_id, status);

CREATE INDEX idx_expenses_project_date 
  ON project_expenses(project_id, date);

-- Complex report query (optimized with indexes)
SELECT 
  p.id,
  p.contract_value,
  SUM(t.cost) as team_cost,
  SUM(e.amount) as expenses,
  p.contract_value - SUM(t.cost) - SUM(e.amount) as profit
FROM projects p
LEFT JOIN timesheets t ON p.id = t.project_id
LEFT JOIN project_expenses e ON p.id = e.project_id
WHERE p.agency_id = $1
GROUP BY p.id;
```

---

## DETAILED DESIGN PATTERNS

### Pattern 1: Profit Calculation Flow

```
User logs hours
    ↓
POST /api/timesheets
    ↓
Calculate cost (hours × internal_rate)
    ↓
Save to database
    ↓
Trigger event: "hours_added"
    ↓
Event handler: Recalculate project profit
    ↓
Update Redis: project:${id}:profit
    ↓
Emit WebSocket: "profit_updated" → Frontend
    ↓
Frontend: Update profit in real-time (no refresh needed)
```

### Pattern 2: Invoice Generation Flow

```
Project milestone marked complete
    ↓
User clicks "Create Invoice"
    ↓
Form: Select milestone(s), set invoice amount
    ↓
POST /api/invoices
    ↓
Validate: Milestone status = complete
    ↓
Generate invoice (auto-number: INV-2026-001)
    ↓
Save to database with status = "Draft"
    ↓
Return invoice to frontend
    ↓
User reviews, sends to client
    ↓
PUT /api/invoices/:id/send
    ↓
Update status = "Sent", send_date = now
    ↓
Send email to client with invoice PDF
    ↓
Emit WebSocket: "invoice_sent" → Update client portal
```

### Pattern 3: Multi-Tenant Data Isolation

```
User logs in (JWT contains agency_id)
    ↓
Every API request includes JWT
    ↓
Middleware: Extract agency_id from JWT
    ↓
Middleware: Add WHERE agency_id = ${agency_id} to all queries
    ↓
Database RLS: Verify agency_id matches (double protection)
    ↓
Result: User can ONLY see their agency's data
    ↓
Audit log: Track all data access (who accessed what)
```

### Pattern 4: Real-Time Updates (WebSocket Flow)

```
Admin logs hours for project
    ↓
POST /api/timesheets (via REST)
    ↓
Save to DB + trigger event
    ↓
Event handler publishes to Redis: "project:123:updated"
    ↓
WebSocket server subscribes to Redis pub/sub
    ↓
Emit socket.io event to all users viewing project #123
    ↓
Frontend: Update profit, team cost in real-time
    ↓
No page refresh needed
```

---

## DATABASE SCHEMA (Core Tables)

```sql
-- Multi-tenant setup
CREATE TABLE agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(100) UNIQUE,
  logo_url VARCHAR(500),
  brand_color VARCHAR(7) DEFAULT '#000000',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Users with role-based access
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) DEFAULT 'TeamMember', -- Admin, Manager, TeamMember, Client
  internal_cost_rate DECIMAL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(agency_id, email)
);

-- Projects (contract-based)
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  contract_value DECIMAL NOT NULL,
  status VARCHAR(50) DEFAULT 'Active',
  start_date DATE,
  deadline DATE,
  progress_percentage INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Milestones (invoice triggers)
CREATE TABLE project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  name VARCHAR(255),
  description TEXT,
  due_date DATE,
  completed_date DATE,
  status VARCHAR(50) DEFAULT 'Pending',
  deliverables TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Time tracking (cost calculation)
CREATE TABLE timesheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  user_id UUID NOT NULL REFERENCES users(id),
  hours_logged DECIMAL NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  cost DECIMAL NOT NULL, -- hours × user.internal_cost_rate
  created_at TIMESTAMP DEFAULT now()
);

-- Project expenses
CREATE TABLE project_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  category VARCHAR(100),
  description TEXT,
  amount DECIMAL NOT NULL,
  date DATE NOT NULL,
  receipt_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT now()
);

-- Company overhead
CREATE TABLE company_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id),
  category VARCHAR(100),
  description TEXT,
  amount DECIMAL NOT NULL,
  month DATE NOT NULL, -- First day of month
  created_at TIMESTAMP DEFAULT now()
);

-- Invoices (milestone-linked)
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  amount DECIMAL NOT NULL,
  status VARCHAR(50) DEFAULT 'Draft',
  issue_date DATE,
  due_date DATE,
  paid_date DATE,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

-- Invoice items (invoice line items)
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  milestone_id UUID REFERENCES project_milestones(id),
  description TEXT,
  amount DECIMAL NOT NULL
);

-- Payments (manual entry)
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  amount DECIMAL NOT NULL,
  payment_date DATE NOT NULL,
  payment_method VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_projects_agency ON projects(agency_id);
CREATE INDEX idx_timesheets_project_date ON timesheets(project_id, date);
CREATE INDEX idx_invoices_project_status ON invoices(project_id, status);
CREATE INDEX idx_expenses_project ON project_expenses(project_id);

-- Row-level security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY projects_agency_isolation ON projects
  USING (agency_id = auth.jwt() ->> 'agency_id'::uuid);
```

---

## API ENDPOINTS (High-Level)

```
Authentication
  POST   /auth/signup
  POST   /auth/login
  POST   /auth/refresh
  GET    /auth/me

Projects
  GET    /projects                  -- List all projects (with filters)
  POST   /projects                  -- Create project
  GET    /projects/:id              -- Get project with all details
  PUT    /projects/:id              -- Update project
  GET    /projects/:id/profit       -- Get real-time profit

Time Tracking
  POST   /timesheets                -- Log hours
  GET    /timesheets                -- List hours (with filters)
  PUT    /timesheets/:id/approve    -- Manager approves

Expenses
  POST   /projects/:id/expenses     -- Add project expense
  GET    /projects/:id/expenses     -- List expenses
  POST   /company-expenses          -- Add company overhead
  GET    /company-expenses          -- List overhead

Invoicing
  POST   /invoices                  -- Create invoice
  GET    /invoices                  -- List invoices
  GET    /invoices/:id              -- Get invoice
  PUT    /invoices/:id/send         -- Send invoice to client
  PUT    /invoices/:id/paid         -- Mark as paid
  POST   /invoices/:id/reminder     -- Send reminder email

Payments
  POST   /payments                  -- Record payment
  GET    /payments                  -- List payments

Analytics
  GET    /analytics/dashboard       -- Main dashboard metrics
  GET    /analytics/profitability   -- Profit analysis
  GET    /reports/monthly           -- Monthly report
  GET    /reports/profitability     -- Project profitability

Client Portal
  GET    /portal/projects/:id       -- Client view of project
  GET    /portal/invoices/:id       -- Client view invoices
```

---

## DEPLOYMENT ARCHITECTURE

### Frontend Deployment (Vercel)
```
GitHub push to main branch
    ↓
Vercel webhook triggered
    ↓
Build Next.js (npm run build)
    ↓
Generate PWA manifest
    ↓
Deploy to CDN (Vercel edge network)
    ↓
Available at: agency-dashboard.vercel.app
             (or custom domain)
             
Auto-scaling: Free tier supports unlimited users
Cache: Vercel CDN caches static assets globally
```

### Backend Deployment (Railway or Self-Hosted VPS)

**Option A: Railway (Managed)**
```
GitHub push → Railway detects
    ↓
Install dependencies (npm install)
    ↓
Build application
    ↓
Start Express server (npm start)
    ↓
Available at: railway-project-id.up.railway.app
Auto-restart on crash
Environment variables: Set in Railway dashboard
Database: Connect to Supabase PostgreSQL
```

**Option B: Self-Hosted VPS ($3-5/month)**
```
SSH into Hetzner/Linode VPS
    ↓
Install Node.js, PostgreSQL, Redis
    ↓
Clone GitHub repo
    ↓
npm install && npm run build
    ↓
Start with PM2 (background process manager)
    ↓
Configure nginx (reverse proxy)
    ↓
SSL via Let's Encrypt (free)
    ↓
Available at: your-domain.com
```

### Database (Supabase = Managed PostgreSQL)
```
Sign up at supabase.io (free tier)
    ↓
Create project (PostgreSQL 13+)
    ↓
Connection string: postgresql://user:password@db.suabase.co/db
    ↓
Use with Prisma or any PostgreSQL driver
    ↓
Automatic backups daily
    ↓
Scaling: Free tier (500MB), Pay per GB if needed
```

---

## PERFORMANCE TARGETS & OPTIMIZATION

| Metric | Target | How We Achieve |
|--------|--------|----------------|
| Dashboard load | <2 sec | Caching in Redis, optimized queries |
| Project detail | <1 sec | Eager loading with Prisma, Redis cache |
| Invoice creation | <2 sec | Simple INSERT, no complex calculations |
| Profit calculation | <100ms | Redis cache + event-driven updates |
| Page switch | <500ms | SPA with client-side routing (React) |
| API response | <200ms | Database indexes, query optimization |

**Optimization strategies:**
1. Database indexes on foreign keys + agency_id
2. Redis caching for profit, dashboard metrics
3. Lazy loading on frontend (images, reports)
4. Pagination for large lists (100 items per page)
5. Gzip compression on all API responses
6. PWA service worker caches API responses

---

## SECURITY MEASURES

| Layer | Measure |
|-------|---------|
| **Authentication** | JWT tokens (2-week expiry), password hashing (bcrypt) |
| **Authorization** | Row-level security + middleware agency_id checks |
| **Data in transit** | HTTPS/TLS encryption, no HTTP |
| **Data at rest** | PostgreSQL encryption at Supabase |
| **API** | CORS headers (frontend origin only), rate limiting |
| **Secrets** | Environment variables (never in code), rotate tokens |
| **Audit** | Logging all data access (who, what, when) |
| **Compliance** | GDPR-ready (data export, deletion endpoints) |

---

## TESTING STRATEGY

### Unit Tests (40% coverage)
- Profit calculation logic
- Invoice generation logic
- Data validation

### Integration Tests (30% coverage)
- API endpoints (CRUD operations)
- Multi-tenant isolation (ensure no data leakage)
- Database transactions

### End-to-End Tests (20% coverage)
- User login → Create project → Log hours → Create invoice → Mark paid
- Client portal access (read-only verification)
- Profit calculation accuracy

### Manual/Exploratory Testing (10%)
- Performance testing (load testing with 100 concurrent users)
- Security testing (attempted data leakage, SQL injection)
- Accessibility (keyboard navigation, screen reader)

**Tools:**
- Jest (unit tests)
- Supertest (API testing)
- Cypress (E2E testing)
- k6 (load testing)

---

## MONITORING & LOGGING

| Metric | Tool | Alert Threshold |
|--------|------|-----------------|
| API response time | Datadog / New Relic | >1 sec (p95) |
| Database query time | PostgreSQL slow log | >5 sec |
| Error rate | Sentry | >1% of requests |
| Memory usage | Node.js process | >80% of limit |
| Cache hit rate | Redis | <70% hits (investigate) |
| User signups | Custom dashboard | Track daily |

**Logs stored in:** CloudWatch (AWS) or Papertrail (free tier: 100MB/month)

---

## KNOWN LIMITATIONS & TECH DEBT

| Limitation | Impact | Plan |
|-----------|--------|------|
| No hourly billing to clients | Can't support hybrid pricing | Add in Phase 2 |
| Manual payment entry | No auto-reconciliation | Stripe integration Phase 2 |
| Single process (Node) | No horizontal scaling initially | Implement load balancer Phase 2 |
| No SMS alerts | Email-only notifications | Add Twilio Phase 2 |
| Supabase free tier (500MB) | Limited growth | Upgrade to paid ($25/mo) at 50% usage |

---

## ROLLOUT CHECKLIST

- [ ] Database schema finalized and tested
- [ ] API endpoints implemented and tested (unit + integration)
- [ ] Frontend UI built and responsive
- [ ] PWA service worker working (offline mode)
- [ ] Authentication flow complete (signup, login, JWT)
- [ ] Multi-tenant isolation verified (security testing)
- [ ] Profit calculation accuracy verified (test with real data)
- [ ] Invoice generation and email sending working
- [ ] Client portal read-only access working
- [ ] Performance optimized (<2 sec dashboard load)
- [ ] Logging and monitoring configured
- [ ] Documentation complete (API docs, user guide)
- [ ] 3 agencies tested in beta
- [ ] Security audit passed
- [ ] Deployment automation working (CI/CD)

---

## APPENDICES

### A. Prisma Schema (ORM)
```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Agency {
  id String @id @default(cuid())
  name String
  subdomain String? @unique
  logo_url String?
  projects Project[]
  users User[]
}

model Project {
  id String @id @default(cuid())
  agency_id String
  client_id String
  name String
  contract_value Float
  status String @default("Active")
  timesheets Timesheet[]
  invoices Invoice[]
  expenses ProjectExpense[]
  milestones ProjectMilestone[]
}

model Timesheet {
  id String @id @default(cuid())
  project_id String
  user_id String
  hours_logged Float
  cost Float
  approved_by String?
}

model Invoice {
  id String @id @default(cuid())
  project_id String
  invoice_number String @unique
  amount Float
  status String @default("Draft")
  items InvoiceItem[]
}

// ... more models
```

### B. Environment Variables
```
# Database
DATABASE_URL=postgresql://user:password@db.supabase.co/agency_db

# Redis
REDIS_URL=redis://default:password@upstash.io:port

# JWT
JWT_SECRET=your-secret-key-here

# Email
SENDGRID_API_KEY=sg_...

# Frontend (Vercel)
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### C. GitHub Actions (CI/CD)
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: git push heroku main  # Or deploy to Railway
```

---

**TDD Complete** ✅  
**Status:** Ready for Development Sprint 1  
**Next Step:** Create detailed component designs & begin coding

