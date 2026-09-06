# Data Model
# Agency Revenue & Project Control Dashboard

**Version:** 1.0  
**Date:** September 2026  
**Database:** PostgreSQL + Supabase  
**Status:** Ready for Development

---

## PART 1: DATABASE SCHEMA (SQL)

### 1. USERS TABLE

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'manager', 'team_member', 'client')),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  internal_cost_rate DECIMAL(10, 2) NOT NULL DEFAULT 0, -- hourly rate for internal costing
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT positive_rate CHECK (internal_cost_rate >= 0)
);

CREATE INDEX idx_users_agency_id ON users(agency_id);
CREATE INDEX idx_users_email ON users(email);
```

**Fields:**
- `id`: UUID primary key
- `email`: Unique email, used for login
- `password_hash`: Bcrypt hashed password
- `full_name`: User's name (first + last)
- `role`: Admin (full access), Manager (projects + invoices), TeamMember (time + team ops), Client (read-only portal)
- `agency_id`: FK to agencies table (multi-tenant)
- `internal_cost_rate`: Cost per hour (for profit calculation, not billed to client)
- `avatar_url`: Profile photo URL (Supabase Storage)
- `is_active`: Soft delete flag
- `created_at`, `updated_at`: Timestamps

---

### 2. AGENCIES TABLE

```sql
CREATE TABLE agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  logo_url TEXT,
  brand_color VARCHAR(7) DEFAULT '#5cd65c', -- hex color
  monthly_revenue_target DECIMAL(12, 2) DEFAULT 0,
  subdomain VARCHAR(255) UNIQUE, -- for white-label (Phase 2)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_agencies_name ON agencies(name);
CREATE INDEX idx_agencies_subdomain ON agencies(subdomain);
```

**Fields:**
- `id`: UUID primary key
- `name`: Agency name (e.g., "ABC Marketing Agency")
- `logo_url`: Logo image (Supabase Storage)
- `brand_color`: Primary color (hex, e.g., #5cd65c)
- `monthly_revenue_target`: Used for dashboard target calculation
- `subdomain`: Optional (for white-label, Phase 2)
- `is_active`: Soft delete flag

---

### 3. CLIENTS TABLE

```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  zip_code VARCHAR(20),
  lifetime_value DECIMAL(12, 2) GENERATED ALWAYS AS (
    SELECT COALESCE(SUM(contract_value), 0)
    FROM projects
    WHERE projects.client_id = clients.id
  ) STORED,
  total_paid DECIMAL(12, 2) GENERATED ALWAYS AS (
    SELECT COALESCE(SUM(amount), 0)
    FROM payments
    WHERE payments.invoice_id IN (
      SELECT id FROM invoices WHERE invoices.client_id = clients.id
    )
  ) STORED,
  outstanding_amount DECIMAL(12, 2) GENERATED ALWAYS AS (
    SELECT COALESCE(SUM(amount), 0)
    FROM invoices
    WHERE invoices.client_id = clients.id
    AND invoices.status NOT IN ('paid', 'refunded')
  ) STORED,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_clients_agency_id ON clients(agency_id);
CREATE INDEX idx_clients_email ON clients(email);
```

**Fields:**
- `id`: UUID primary key
- `agency_id`: FK to agencies (multi-tenant)
- `name`: Client contact name
- `company_name`: Client's company name
- `email`, `phone`: Contact info
- `address`, `city`, `state`, `country`, `zip_code`: Full address
- `lifetime_value`: Auto-calculated sum of all projects with this client
- `total_paid`: Auto-calculated total paid invoices
- `outstanding_amount`: Auto-calculated unpaid invoices
- `is_active`: Soft delete flag

---

### 4. PROJECTS TABLE

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'in_review', 'delivered', 'closed')),
  contract_value DECIMAL(12, 2) NOT NULL,
  start_date DATE,
  deadline DATE,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  
  -- Calculated fields (updated by triggers)
  total_team_cost DECIMAL(12, 2) GENERATED ALWAYS AS (
    SELECT COALESCE(SUM(hours_logged * internal_cost_rate), 0)
    FROM project_hours ph
    JOIN users u ON ph.user_id = u.id
    WHERE ph.project_id = projects.id
  ) STORED,
  total_expenses DECIMAL(12, 2) GENERATED ALWAYS AS (
    SELECT COALESCE(SUM(amount), 0)
    FROM project_expenses
    WHERE project_id = projects.id
  ) STORED,
  allocated_overhead DECIMAL(12, 2) DEFAULT 0, -- % of company overhead allocated
  total_cost DECIMAL(12, 2) GENERATED ALWAYS AS (
    (SELECT COALESCE(SUM(hours_logged * internal_cost_rate), 0) FROM project_hours ph JOIN users u ON ph.user_id = u.id WHERE ph.project_id = projects.id)
    + (SELECT COALESCE(SUM(amount), 0) FROM project_expenses WHERE project_id = projects.id)
    + projects.allocated_overhead
  ) STORED,
  profit DECIMAL(12, 2) GENERATED ALWAYS AS (
    projects.contract_value - (
      (SELECT COALESCE(SUM(hours_logged * internal_cost_rate), 0) FROM project_hours ph JOIN users u ON ph.user_id = u.id WHERE ph.project_id = projects.id)
      + (SELECT COALESCE(SUM(amount), 0) FROM project_expenses WHERE project_id = projects.id)
      + projects.allocated_overhead
    )
  ) STORED,
  profit_margin DECIMAL(5, 2) GENERATED ALWAYS AS (
    CASE
      WHEN projects.contract_value > 0
      THEN (projects.contract_value - (
        (SELECT COALESCE(SUM(hours_logged * internal_cost_rate), 0) FROM project_hours ph JOIN users u ON ph.user_id = u.id WHERE ph.project_id = projects.id)
        + (SELECT COALESCE(SUM(amount), 0) FROM project_expenses WHERE project_id = projects.id)
        + projects.allocated_overhead
      )) / projects.contract_value * 100
      ELSE 0
    END
  ) STORED,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_projects_agency_id ON projects(agency_id);
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(status);
```

**Fields:**
- `id`: UUID primary key
- `agency_id`, `client_id`: FKs (multi-tenant, track project owner)
- `name`, `description`: Project info
- `status`: Active (current work), In Review (pending approval), Delivered (done), Closed (archived)
- `contract_value`: Fixed price paid by client (never hourly)
- `start_date`, `deadline`: Project timeline
- `progress_percentage`: 0-100, manually set by manager
- **Calculated (auto-updated):**
  - `total_team_cost`: Sum of (hours × internal_rate) for all team members
  - `total_expenses`: Sum of all project expenses
  - `allocated_overhead`: Manager-set % of company overhead
  - `total_cost`: team_cost + expenses + overhead
  - `profit`: contract_value - total_cost
  - `profit_margin`: (profit / contract_value) × 100

---

### 5. PROJECT_HOURS TABLE (Time Tracking)

```sql
CREATE TABLE project_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hours_logged DECIMAL(8, 2) NOT NULL,
  date_logged DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT positive_hours CHECK (hours_logged > 0 AND hours_logged <= 24)
);

CREATE INDEX idx_project_hours_project_id ON project_hours(project_id);
CREATE INDEX idx_project_hours_user_id ON project_hours(user_id);
CREATE INDEX idx_project_hours_date ON project_hours(date_logged);
```

**Fields:**
- `id`: UUID primary key
- `project_id`, `user_id`: FKs
- `hours_logged`: Decimal (allows 0.5, 2.25, etc.)
- `date_logged`: When the work was done (can be past dates)
- `description`: What was done (e.g., "Designed homepage mockups")
- `created_at`, `updated_at`: Timestamps
- Constraint: 0 < hours ≤ 24 (can't log > 24 hours in one day)

---

### 6. PROJECT_EXPENSES TABLE

```sql
CREATE TABLE project_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL CHECK (category IN ('freelance', 'software', 'design', 'hosting', 'travel', 'materials', 'other')),
  amount DECIMAL(12, 2) NOT NULL,
  description VARCHAR(255) NOT NULL,
  date_incurred DATE NOT NULL,
  receipt_url TEXT, -- Supabase Storage
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT positive_amount CHECK (amount > 0)
);

CREATE INDEX idx_project_expenses_project_id ON project_expenses(project_id);
CREATE INDEX idx_project_expenses_category ON project_expenses(category);
CREATE INDEX idx_project_expenses_date ON project_expenses(date_incurred);
```

**Fields:**
- `id`: UUID primary key
- `project_id`: FK
- `category`: Type of expense (freelance, software, design, hosting, travel, materials, other)
- `amount`: Positive decimal
- `description`: What this expense is for
- `date_incurred`: When the expense occurred
- `receipt_url`: Link to receipt file (optional)
- `created_by`: User who logged the expense
- Timestamps

---

### 7. MILESTONES TABLE

```sql
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  completed_date DATE,
  deliverables TEXT, -- JSON array of deliverable items
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_milestones_project_id ON milestones(project_id);
CREATE INDEX idx_milestones_status ON milestones(status);
```

**Fields:**
- `id`: UUID primary key
- `project_id`: FK
- `name`: Milestone name (e.g., "Design Phase", "Development Phase")
- `description`: Details
- `due_date`: Target completion date
- `status`: Pending, In Progress, Completed
- `completed_date`: When actually completed (null if not done)
- `deliverables`: JSON array of items included (e.g., ["Homepage design", "About page design"])

---

### 8. INVOICES TABLE

```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) UNIQUE NOT NULL, -- e.g., INV-2026-001
  amount DECIMAL(12, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled')),
  issue_date DATE,
  due_date DATE NOT NULL,
  sent_date TIMESTAMP,
  viewed_date TIMESTAMP,
  paid_date DATE,
  payment_amount DECIMAL(12, 2), -- Can be less than invoice amount (partial payment)
  payment_method VARCHAR(50), -- bank_transfer, cheque, cash, card
  notes TEXT,
  
  -- Links to milestones (which deliverables are invoiced)
  milestone_ids UUID[] DEFAULT ARRAY[]::UUID[],
  
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT positive_amount CHECK (amount > 0)
);

CREATE INDEX idx_invoices_agency_id ON invoices(agency_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_project_id ON invoices(project_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
```

**Fields:**
- `id`: UUID primary key
- `agency_id`, `client_id`, `project_id`: FKs
- `invoice_number`: Unique, human-readable (INV-2026-001)
- `amount`: Total invoice amount (fixed price)
- `status`: Draft (not sent), Sent, Viewed, Paid, Overdue (past due_date), Cancelled
- `issue_date`: When invoice was created
- `due_date`: Payment deadline
- `sent_date`: When sent to client
- `viewed_date`: When client opened email/viewed invoice
- `paid_date`: When payment received
- `payment_amount`: Actual amount paid (can be partial)
- `payment_method`: How paid
- `notes`: Internal notes
- `milestone_ids`: Array of milestone IDs included in this invoice
- `created_by`: User who created invoice
- Timestamps

---

### 9. PAYMENTS TABLE (Payment Log)

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method VARCHAR(50) NOT NULL, -- bank_transfer, cheque, cash, card
  reference_number VARCHAR(255), -- Check #, transaction ID, etc.
  notes TEXT,
  recorded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT positive_amount CHECK (amount > 0)
);

CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);
```

**Fields:**
- `id`: UUID primary key
- `invoice_id`: FK
- `amount`: Amount paid
- `payment_date`: Date payment received
- `payment_method`: bank_transfer, cheque, cash, card
- `reference_number`: Check number, transaction ID, etc.
- `notes`: Any additional details
- `recorded_by`: User who logged payment
- `created_at`: Timestamp

---

### 10. COMPANY_EXPENSES TABLE (Overhead)

```sql
CREATE TABLE company_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL CHECK (category IN ('rent', 'utilities', 'salary', 'software', 'insurance', 'other')),
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  date_incurred DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency VARCHAR(50), -- monthly, quarterly, annually
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT positive_amount CHECK (amount > 0)
);

CREATE INDEX idx_company_expenses_agency_id ON company_expenses(agency_id);
CREATE INDEX idx_company_expenses_date ON company_expenses(date_incurred);
```

**Fields:**
- `id`: UUID primary key
- `agency_id`: FK
- `category`: Type of overhead (rent, utilities, salary, software, insurance, other)
- `description`: Details
- `amount`: Positive decimal
- `date_incurred`: When the expense occurred
- `is_recurring`: Is this a repeating expense?
- `recurring_frequency`: If recurring: monthly, quarterly, annually
- `created_by`: User who logged it

---

### 11. ACTIVITY_LOG TABLE

```sql
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL, -- created_project, logged_hours, created_invoice, etc.
  entity_type VARCHAR(50), -- project, invoice, payment, etc.
  entity_id UUID,
  description TEXT,
  metadata JSONB, -- Any additional context
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_log_agency_id ON activity_log(agency_id);
CREATE INDEX idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at);
```

**Fields:**
- `id`: UUID primary key
- `agency_id`: FK (track per agency)
- `user_id`: Who performed the action
- `action`: Action type (created_project, logged_hours, created_invoice, marked_paid, etc.)
- `entity_type`: What was affected (project, invoice, payment, milestone, etc.)
- `entity_id`: ID of affected entity
- `description`: Human-readable description
- `metadata`: JSON (additional context, old values, new values)
- `created_at`: Timestamp

---

### 12. ROW LEVEL SECURITY (RLS POLICIES)

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Projects: Users can only see projects from their agency
CREATE POLICY projects_isolation ON projects
  FOR SELECT USING (agency_id = auth.jwt() ->> 'agency_id'::text);

-- Clients: Users can only see clients from their agency
CREATE POLICY clients_isolation ON clients
  FOR SELECT USING (agency_id = auth.jwt() ->> 'agency_id'::text);

-- Invoices: Users can only see invoices from their agency
CREATE POLICY invoices_isolation ON invoices
  FOR SELECT USING (agency_id = auth.jwt() ->> 'agency_id'::text);

-- Similar policies for all multi-tenant tables
-- (Specific policy logic per table, all using agency_id as isolation key)
```

---

## PART 2: DATA RELATIONSHIPS (ER DIAGRAM)

```
┌──────────────┐
│   AGENCIES   │ (top-level tenant)
└──────┬───────┘
       │ (1)
       │ (many child tables)
       │
       ├─────────────────────────────────────┬─────────────────────┐
       │                                     │                     │
       ▼ (many)                              ▼ (many)              ▼ (many)
┌──────────────┐                    ┌──────────────┐      ┌──────────────────┐
│    USERS     │◄────agency_id      │   CLIENTS    │      │COMPANY_EXPENSES  │
└──────────────┘                    └──────┬───────┘      └──────────────────┘
   (admin/manager/                         │
    team/client)                           │ (many)
                                           │
                                           ▼
                                    ┌──────────────┐
                                    │   PROJECTS   │◄───project_id
                                    └──────┬───────┘      │
                                           │              │
                                    (1 project has many) │
                                    ├──(hours)           │
                                    ├──(expenses)        │
                                    ├──(milestones)  ────┤
                                    └──(invoices)────────┤
                                           │              │
                        ┌──────────────────┼──────────────┘
                        │                  │
                        ▼                  ▼
                ┌─────────────────┐  ┌──────────────┐
                │ PROJECT_HOURS   │  │  MILESTONES  │
                │ (time tracking) │  └──────────────┘
                └─────────────────┘
                
                ┌─────────────────────┐
                │ PROJECT_EXPENSES    │
                │ (freelance, tools)  │
                └─────────────────────┘
                
                ┌──────────────┐
                │   INVOICES   │
                │  (milestone- │
                │   linked)    │
                └──────┬───────┘
                       │
                       ▼ (1 invoice, many payments)
                ┌──────────────┐
                │   PAYMENTS   │
                │ (payment log)│
                └──────────────┘

                ┌────────────────┐
                │ ACTIVITY_LOG   │
                │  (audit trail) │
                └────────────────┘
```

---

## PART 3: KEY DATA FLOWS

### Flow 1: Create Project → Log Hours → Calculate Profit

```
1. User creates PROJECT
   ├─ contract_value = $10,000
   ├─ start_date = today
   ├─ deadline = Oct 15
   └─ profit = $10,000 (no costs yet)

2. Team member logs HOURS
   ├─ 5 hours @ $100/hr (internal_cost_rate) = $500
   └─ profit recalculates to $9,500 (real-time)

3. Manager adds EXPENSE
   ├─ Freelancer = $2,000
   └─ profit recalculates to $7,500 (real-time)

4. Dashboard shows:
   ├─ Revenue: $10,000
   ├─ Team cost: $500
   ├─ Expenses: $2,000
   ├─ Total cost: $2,500
   ├─ Profit: $7,500
   └─ Margin: 75%
```

### Flow 2: Create Invoice → Send to Client → Record Payment

```
1. Manager creates INVOICE
   ├─ Links to MILESTONE (Design Phase)
   ├─ Amount: $3,000 (from milestone or custom)
   ├─ Status: Draft
   └─ Invoice number: INV-2026-001

2. Manager sends INVOICE
   ├─ Email sent to client
   ├─ Status: Sent
   ├─ sent_date recorded
   └─ Activity logged

3. Client receives EMAIL
   ├─ Opens invoice PDF
   ├─ viewed_date recorded
   └─ Status: Viewed

4. Manager records PAYMENT
   ├─ Amount: $3,000
   ├─ Payment date: today
   ├─ Method: Bank Transfer
   ├─ Status: Paid
   ├─ paid_date recorded
   └─ Dashboard cash flow updates (+$3,000)

5. Dashboard shows:
   ├─ Cash received: $3,000
   ├─ Money owed: $0 (for this invoice)
   └─ Overdue invoices: 0
```

### Flow 3: Multi-Tenant Isolation

```
Agency A (user logged in):
├─ Sees projects for Agency A only (RLS)
├─ Sees clients for Agency A only
├─ Sees invoices for Agency A only
└─ Cannot see Agency B data

Agency B (different user):
├─ Sees projects for Agency B only
├─ Sees clients for Agency B only
├─ Sees invoices for Agency B only
└─ Cannot see Agency A data

All queries filtered by agency_id (RLS policy)
```

---

## PART 4: CALCULATED FIELDS (AUTO-UPDATED)

### Per Project:

```
total_team_cost = SUM(project_hours.hours_logged * users.internal_cost_rate)

total_expenses = SUM(project_expenses.amount)

total_cost = total_team_cost + total_expenses + allocated_overhead

profit = contract_value - total_cost

profit_margin = (profit / contract_value) * 100
```

### Per Client:

```
lifetime_value = SUM(projects.contract_value) WHERE client_id = X

total_paid = SUM(payments.amount) WHERE invoice_id IN (
  SELECT id FROM invoices WHERE client_id = X
)

outstanding_amount = SUM(invoices.amount) WHERE client_id = X 
  AND invoices.status NOT IN ('paid', 'refunded')
```

### Per Invoice:

```
status logic:
├─ Draft: created, not sent
├─ Sent: sent_date is set
├─ Viewed: viewed_date is set
├─ Paid: paid_date is set AND paid_amount >= amount
├─ Overdue: NOW() > due_date AND status != 'paid'
└─ Cancelled: explicitly cancelled
```

---

## PART 5: INDEXES (PERFORMANCE)

```sql
-- Foreign keys (automatic, but listed for clarity)
idx_users_agency_id
idx_clients_agency_id
idx_projects_agency_id
idx_projects_client_id
idx_project_hours_project_id
idx_project_hours_user_id
idx_project_expenses_project_id
idx_invoices_agency_id
idx_invoices_client_id
idx_invoices_project_id
idx_payments_invoice_id
idx_activity_log_agency_id

-- Status filters (frequent queries)
idx_projects_status
idx_invoices_status
idx_milestones_status

-- Date filters (range queries)
idx_project_hours_date
idx_invoices_due_date
idx_payments_payment_date
idx_company_expenses_date

-- Search
idx_users_email
idx_clients_email
idx_agencies_name

-- Multi-tenant queries
idx_projects_agency_id (composite with status)
idx_invoices_agency_id (composite with status)
```

---

## PART 6: CONSTRAINTS & VALIDATIONS

### Database Constraints:

```sql
-- Positive amounts
CHECK (hours_logged > 0 AND hours_logged <= 24)
CHECK (amount > 0)
CHECK (internal_cost_rate >= 0)

-- Valid statuses (via CHECK or enum)
status IN ('active', 'in_review', 'delivered', 'closed')
status IN ('draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled')
status IN ('pending', 'in_progress', 'completed')

-- Date logic
due_date >= start_date
completed_date >= start_date

-- Progress
progress_percentage >= 0 AND progress_percentage <= 100

-- Payment
payment_amount <= invoice_amount (or allow partial/overpay?)

-- Unique values
email UNIQUE (no duplicate accounts)
invoice_number UNIQUE (no duplicate invoice #s)
subdomain UNIQUE (for white-label)
```

### Application Validations:

```javascript
// Hours
- hours > 0 and hours <= 24 (no 25+ hour days)
- date_logged <= today (can't log future hours)

// Invoice
- amount > 0
- due_date > issue_date
- Can't invoice already-invoiced milestone
- Must have at least 1 milestone linked

// Expense
- amount > 0
- date_incurred <= today (can't log future expenses)

// Project
- contract_value > 0
- deadline > start_date
- Can't delete if invoices exist (soft delete instead)

// Payment
- amount > 0
- payment_date <= today
- payment_amount <= invoice_amount (optional: allow overpay?)
- Can't pay draft invoice (must be sent first)
```

---

## PART 7: AUDITING & COMPLIANCE

### Activity Log Entries:

```
Action types:
├─ created_project
├─ updated_project
├─ deleted_project (soft delete)
├─ logged_hours
├─ deleted_hours
├─ added_expense
├─ deleted_expense
├─ created_invoice
├─ sent_invoice
├─ marked_paid
├─ cancelled_invoice
├─ created_milestone
├─ completed_milestone
├─ added_team_member
├─ removed_team_member
└─ updated_settings

Every action logged with:
├─ user_id (who did it)
├─ agency_id (which agency)
├─ action (what)
├─ entity_type & entity_id (on what)
├─ timestamp (when)
└─ metadata (old/new values for updates)
```

### No Hard Deletes:

```
Instead of DELETE:
- Users: is_active = false
- Clients: is_active = false
- Agencies: is_active = false
- Projects: status = 'closed' (soft delete)
- Invoices: status = 'cancelled' (soft delete)

Activity log preserves all deletions:
- action = 'deleted_project'
- metadata contains deleted project data
```

---

## PART 8: EXAMPLE QUERIES

### Dashboard - Revenue This Month:

```sql
SELECT 
  COALESCE(SUM(i.amount), 0) as total_revenue
FROM invoices i
WHERE i.agency_id = ? 
  AND i.status = 'paid'
  AND EXTRACT(MONTH FROM i.paid_date) = EXTRACT(MONTH FROM NOW())
  AND EXTRACT(YEAR FROM i.paid_date) = EXTRACT(YEAR FROM NOW());
```

### Dashboard - Live Projects:

```sql
SELECT 
  p.id, p.name, c.name as client_name,
  p.contract_value,
  (SELECT COALESCE(SUM(hours_logged * u.internal_cost_rate), 0)
   FROM project_hours ph JOIN users u ON ph.user_id = u.id
   WHERE ph.project_id = p.id) as team_cost,
  (SELECT COALESCE(SUM(amount), 0) FROM project_expenses WHERE project_id = p.id) as expenses,
  p.profit, p.profit_margin, p.progress_percentage
FROM projects p
JOIN clients c ON p.client_id = c.id
WHERE p.agency_id = ?
  AND p.status = 'active'
ORDER BY p.profit DESC;
```

### Dashboard - Overdue Invoices:

```sql
SELECT 
  i.id, i.invoice_number, c.name as client_name, i.amount,
  CURRENT_DATE - i.due_date as days_overdue
FROM invoices i
JOIN clients c ON i.client_id = c.id
WHERE i.agency_id = ?
  AND i.status NOT IN ('paid', 'cancelled')
  AND i.due_date < CURRENT_DATE
ORDER BY i.due_date ASC;
```

### Profitability by Project:

```sql
SELECT 
  p.name, c.name as client_name,
  p.contract_value, p.total_team_cost, p.total_expenses, p.profit, p.profit_margin,
  COUNT(DISTINCT ph.user_id) as team_members,
  SUM(ph.hours_logged) as total_hours
FROM projects p
JOIN clients c ON p.client_id = c.id
LEFT JOIN project_hours ph ON p.id = ph.project_id
WHERE p.agency_id = ?
GROUP BY p.id, c.id
ORDER BY p.profit DESC;
```

### Cash Flow Analysis:

```sql
SELECT 
  EXTRACT(MONTH FROM p.payment_date) as month,
  COALESCE(SUM(p.amount), 0) as revenue_received,
  (SELECT COALESCE(SUM(amount), 0) FROM company_expenses ce 
   WHERE ce.agency_id = ?
   AND EXTRACT(MONTH FROM ce.date_incurred) = EXTRACT(MONTH FROM p.payment_date)) as overhead,
  (SELECT COALESCE(SUM(amount), 0) FROM project_expenses pe
   WHERE pe.project_id IN (SELECT id FROM projects WHERE agency_id = ?)
   AND EXTRACT(MONTH FROM pe.date_incurred) = EXTRACT(MONTH FROM p.payment_date)) as project_expenses
FROM payments p
WHERE p.invoice_id IN (SELECT id FROM invoices WHERE agency_id = ?)
GROUP BY EXTRACT(MONTH FROM p.payment_date)
ORDER BY month ASC;
```

---

## PART 9: MIGRATIONS & SEED DATA

### Prisma Schema (Alternative to Raw SQL):

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Agency {
  id                      String      @id @default(cuid())
  name                    String
  logoUrl                 String?     @map("logo_url")
  brandColor              String      @default("#5cd65c") @map("brand_color")
  monthlyRevenueTarget    Decimal     @default(0) @map("monthly_revenue_target")
  subdomain               String?     @unique
  isActive                Boolean     @default(true) @map("is_active")
  
  users                   User[]
  clients                 Client[]
  projects                Project[]
  invoices                Invoice[]
  companyExpenses         CompanyExpense[]
  activityLogs            ActivityLog[]
  
  createdAt               DateTime    @default(now()) @map("created_at")
  updatedAt               DateTime    @updatedAt @map("updated_at")
  
  @@map("agencies")
}

model User {
  id                      String      @id @default(cuid())
  email                   String      @unique
  passwordHash            String      @map("password_hash")
  fullName                String      @map("full_name")
  role                    String      // admin, manager, team_member, client
  agencyId                String      @map("agency_id")
  agency                  Agency      @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  internalCostRate        Decimal     @default(0) @map("internal_cost_rate")
  avatarUrl               String?     @map("avatar_url")
  isActive                Boolean     @default(true) @map("is_active")
  
  projectHours            ProjectHours[]
  projectExpenses         ProjectExpense[]
  createdInvoices         Invoice[]
  recordedPayments        Payment[]
  createdExpenses         CompanyExpense[]
  activityLogs            ActivityLog[]
  
  createdAt               DateTime    @default(now()) @map("created_at")
  updatedAt               DateTime    @updatedAt @map("updated_at")
  
  @@index([agencyId])
  @@map("users")
}

model Client {
  id                      String      @id @default(cuid())
  agencyId                String      @map("agency_id")
  agency                  Agency      @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  name                    String
  companyName             String?     @map("company_name")
  email                   String
  phone                   String?
  address                 String?
  city                    String?
  state                   String?
  country                 String?
  zipCode                 String?     @map("zip_code")
  isActive                Boolean     @default(true) @map("is_active")
  
  projects                Project[]
  invoices                Invoice[]
  
  createdAt               DateTime    @default(now()) @map("created_at")
  updatedAt               DateTime    @updatedAt @map("updated_at")
  
  @@index([agencyId])
  @@map("clients")
}

model Project {
  id                      String      @id @default(cuid())
  agencyId                String      @map("agency_id")
  agency                  Agency      @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  clientId                String      @map("client_id")
  client                  Client      @relation(fields: [clientId], references: [id], onDelete: Cascade)
  name                    String
  description             String?
  status                  String      @default("active") // active, in_review, delivered, closed
  contractValue           Decimal     @map("contract_value")
  startDate               DateTime?   @map("start_date")
  deadline                DateTime?
  progressPercentage      Int         @default(0) @map("progress_percentage")
  allocatedOverhead       Decimal     @default(0) @map("allocated_overhead")
  
  projectHours            ProjectHours[]
  projectExpenses         ProjectExpense[]
  milestones              Milestone[]
  invoices                Invoice[]
  
  createdAt               DateTime    @default(now()) @map("created_at")
  updatedAt               DateTime    @updatedAt @map("updated_at")
  
  @@index([agencyId])
  @@index([clientId])
  @@index([status])
  @@map("projects")
}

model ProjectHours {
  id                      String      @id @default(cuid())
  projectId               String      @map("project_id")
  project                 Project     @relation(fields: [projectId], references: [id], onDelete: Cascade)
  userId                  String      @map("user_id")
  user                    User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  hoursLogged             Decimal     @map("hours_logged")
  dateLogged              DateTime    @map("date_logged")
  description             String?
  
  createdAt               DateTime    @default(now()) @map("created_at")
  updatedAt               DateTime    @updatedAt @map("updated_at")
  
  @@index([projectId])
  @@index([userId])
  @@index([dateLogged])
  @@map("project_hours")
}

model ProjectExpense {
  id                      String      @id @default(cuid())
  projectId               String      @map("project_id")
  project                 Project     @relation(fields: [projectId], references: [id], onDelete: Cascade)
  category                String      // freelance, software, design, hosting, travel, materials, other
  amount                  Decimal
  description             String
  dateIncurred            DateTime    @map("date_incurred")
  receiptUrl              String?     @map("receipt_url")
  createdBy               String      @map("created_by")
  user                    User        @relation(fields: [createdBy], references: [id])
  
  createdAt               DateTime    @default(now()) @map("created_at")
  updatedAt               DateTime    @updatedAt @map("updated_at")
  
  @@index([projectId])
  @@index([category])
  @@map("project_expenses")
}

model Milestone {
  id                      String      @id @default(cuid())
  projectId               String      @map("project_id")
  project                 Project     @relation(fields: [projectId], references: [id], onDelete: Cascade)
  name                    String
  description             String?
  dueDate                 DateTime    @map("due_date")
  status                  String      @default("pending") // pending, in_progress, completed
  completedDate           DateTime?   @map("completed_date")
  deliverables            String?     // JSON array
  
  createdAt               DateTime    @default(now()) @map("created_at")
  updatedAt               DateTime    @updatedAt @map("updated_at")
  
  @@index([projectId])
  @@map("milestones")
}

model Invoice {
  id                      String      @id @default(cuid())
  agencyId                String      @map("agency_id")
  agency                  Agency      @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  clientId                String      @map("client_id")
  client                  Client      @relation(fields: [clientId], references: [id], onDelete: Cascade)
  projectId               String      @map("project_id")
  project                 Project     @relation(fields: [projectId], references: [id], onDelete: Cascade)
  invoiceNumber           String      @unique @map("invoice_number")
  amount                  Decimal
  status                  String      @default("draft") // draft, sent, viewed, paid, overdue, cancelled
  issueDate               DateTime?   @map("issue_date")
  dueDate                 DateTime    @map("due_date")
  sentDate                DateTime?   @map("sent_date")
  viewedDate              DateTime?   @map("viewed_date")
  paidDate                DateTime?   @map("paid_date")
  paymentAmount           Decimal?    @map("payment_amount")
  paymentMethod           String?     @map("payment_method")
  notes                   String?
  milestoneIds            String[]    @map("milestone_ids") // UUID array
  createdBy               String      @map("created_by")
  user                    User        @relation(fields: [createdBy], references: [id])
  
  payments                Payment[]
  
  createdAt               DateTime    @default(now()) @map("created_at")
  updatedAt               DateTime    @updatedAt @map("updated_at")
  
  @@index([agencyId])
  @@index([clientId])
  @@index([projectId])
  @@index([status])
  @@index([dueDate])
  @@map("invoices")
}

model Payment {
  id                      String      @id @default(cuid())
  invoiceId               String      @map("invoice_id")
  invoice                 Invoice     @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  amount                  Decimal
  paymentDate             DateTime    @map("payment_date")
  paymentMethod           String      @map("payment_method")
  referenceNumber         String?     @map("reference_number")
  notes                   String?
  recordedBy              String      @map("recorded_by")
  user                    User        @relation(fields: [recordedBy], references: [id])
  
  createdAt               DateTime    @default(now()) @map("created_at")
  
  @@index([invoiceId])
  @@map("payments")
}

model CompanyExpense {
  id                      String      @id @default(cuid())
  agencyId                String      @map("agency_id")
  agency                  Agency      @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  category                String      // rent, utilities, salary, software, insurance, other
  description             String
  amount                  Decimal
  dateIncurred            DateTime    @map("date_incurred")
  isRecurring             Boolean     @default(false) @map("is_recurring")
  recurringFrequency      String?     @map("recurring_frequency")
  createdBy               String      @map("created_by")
  user                    User        @relation(fields: [createdBy], references: [id])
  
  createdAt               DateTime    @default(now()) @map("created_at")
  updatedAt               DateTime    @updatedAt @map("updated_at")
  
  @@index([agencyId])
  @@map("company_expenses")
}

model ActivityLog {
  id                      String      @id @default(cuid())
  agencyId                String      @map("agency_id")
  agency                  Agency      @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  userId                  String?     @map("user_id")
  user                    User?       @relation(fields: [userId], references: [id])
  action                  String
  entityType              String?     @map("entity_type")
  entityId                String?     @map("entity_id")
  description             String?
  metadata                Json?       // JSON metadata
  
  createdAt               DateTime    @default(now()) @map("created_at")
  
  @@index([agencyId])
  @@index([userId])
  @@index([createdAt])
  @@map("activity_log")
}
```

---

## PART 10: MIGRATION CHECKLIST

```
[ ] Create agencies table
[ ] Create users table + indexes
[ ] Create clients table + indexes
[ ] Create projects table + calculated fields
[ ] Create project_hours table + indexes
[ ] Create project_expenses table + indexes
[ ] Create milestones table
[ ] Create invoices table + indexes
[ ] Create payments table + indexes
[ ] Create company_expenses table + indexes
[ ] Create activity_log table + indexes
[ ] Enable RLS on all tables
[ ] Create RLS policies (agency_id isolation)
[ ] Add triggers for activity logging
[ ] Test data integrity constraints
[ ] Test calculated fields update correctly
[ ] Backfill data from legacy system (if any)
[ ] Run performance tests on indexes
[ ] Document schema with comments
[ ] Create backup & restore procedures
```

---

**END OF DATA MODEL**

**Status: Ready for Implementation**  
**Next Step:** Generate Prisma migrations and seed test data

