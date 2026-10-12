-- 037_finance_tables.sql — Finance management tables

-- Organization profile (finance-specific)
CREATE TABLE IF NOT EXISTS fin_organization (
  id            SERIAL PRIMARY KEY,
  legal_name    TEXT NOT NULL DEFAULT 'allinkigali',
  display_name  TEXT DEFAULT 'allinkigali',
  address       TEXT,
  phone         TEXT,
  email         TEXT,
  logo_url      TEXT,
  primary_currency TEXT NOT NULL DEFAULT 'RWF',
  fiscal_year_start_month INT NOT NULL DEFAULT 1,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO fin_organization (legal_name, display_name) VALUES ('allinkigali', 'allinkigali') ON CONFLICT DO NOTHING;

-- Chart of accounts
CREATE TABLE IF NOT EXISTS fin_accounts (
  id            SERIAL PRIMARY KEY,
  code          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  account_type  TEXT NOT NULL CHECK (account_type IN ('asset','liability','equity','income','expense')),
  parent_id     INT REFERENCES fin_accounts(id),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  description   TEXT,
  normal_balance TEXT NOT NULL DEFAULT 'debit' CHECK (normal_balance IN ('debit','credit')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contacts (suppliers, customers, donors)
CREATE TABLE IF NOT EXISTS fin_contacts (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  contact_type  TEXT NOT NULL DEFAULT 'supplier' CHECK (contact_type IN ('supplier','customer','donor','employee','other')),
  email         TEXT,
  phone         TEXT,
  address       TEXT,
  tax_id        TEXT,
  default_currency TEXT DEFAULT 'RWF',
  payment_terms_days INT DEFAULT 30,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cash & bank accounts
CREATE TABLE IF NOT EXISTS fin_bank_accounts (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  account_type  TEXT NOT NULL DEFAULT 'bank' CHECK (account_type IN ('bank','cash','mobile_money')),
  account_number TEXT,
  bank_name     TEXT,
  currency      TEXT NOT NULL DEFAULT 'RWF',
  ledger_account_id INT REFERENCES fin_accounts(id),
  current_balance NUMERIC(18,2) NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  last_reconciled_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Departments
CREATE TABLE IF NOT EXISTS fin_departments (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  code          TEXT UNIQUE,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE
);

-- Projects / Funds
CREATE TABLE IF NOT EXISTS fin_projects (
  id            SERIAL PRIMARY KEY,
  code          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  description   TEXT,
  donor_id      INT REFERENCES fin_contacts(id),
  approved_amount NUMERIC(18,2),
  currency      TEXT DEFAULT 'RWF',
  start_date    DATE,
  end_date      DATE,
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','suspended','closed')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transaction reference counter
CREATE TABLE IF NOT EXISTS fin_ref_counters (
  prefix        TEXT PRIMARY KEY,
  last_number   INT NOT NULL DEFAULT 0
);

INSERT INTO fin_ref_counters (prefix, last_number) VALUES
  ('INC', 0), ('EXP', 0), ('TRF', 0), ('JNL', 0)
ON CONFLICT DO NOTHING;

-- Transactions (income, expense, transfer, journal)
CREATE TABLE IF NOT EXISTS fin_transactions (
  id              SERIAL PRIMARY KEY,
  txn_ref         TEXT UNIQUE NOT NULL,
  txn_type        TEXT NOT NULL CHECK (txn_type IN ('income','expense','transfer','journal')),
  txn_date        DATE NOT NULL,
  description     TEXT NOT NULL,
  amount          NUMERIC(18,2) NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'RWF',
  contact_id      INT REFERENCES fin_contacts(id),
  bank_account_id INT REFERENCES fin_bank_accounts(id),
  category_account_id INT REFERENCES fin_accounts(id),
  project_id      INT REFERENCES fin_projects(id),
  department_id   INT REFERENCES fin_departments(id),
  payment_method  TEXT CHECK (payment_method IN ('bank_transfer','cash','mobile_money','card','cheque','other')),
  external_ref    TEXT,
  status          TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft','pending_approval','approved','posted','rejected','voided')),
  notes           TEXT,
  created_by      INT,
  approved_by     INT,
  approved_at     TIMESTAMPTZ,
  posted_at       TIMESTAMPTZ,
  voided_at       TIMESTAMPTZ,
  voided_by       INT,
  void_reason     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Journal entry lines (double-entry)
CREATE TABLE IF NOT EXISTS fin_journal_lines (
  id              SERIAL PRIMARY KEY,
  transaction_id  INT NOT NULL REFERENCES fin_transactions(id) ON DELETE CASCADE,
  account_id      INT NOT NULL REFERENCES fin_accounts(id),
  debit           NUMERIC(18,2) NOT NULL DEFAULT 0,
  credit          NUMERIC(18,2) NOT NULL DEFAULT 0,
  description     TEXT,
  project_id      INT REFERENCES fin_projects(id),
  department_id   INT REFERENCES fin_departments(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fin_jl_positive CHECK (debit >= 0 AND credit >= 0),
  CONSTRAINT fin_jl_one_side CHECK (NOT (debit > 0 AND credit > 0))
);

-- Documents / attachments
CREATE TABLE IF NOT EXISTS fin_documents (
  id              SERIAL PRIMARY KEY,
  file_name       TEXT NOT NULL,
  file_url        TEXT NOT NULL,
  file_type       TEXT,
  file_size       INT,
  transaction_id  INT REFERENCES fin_transactions(id),
  invoice_id      INT,
  project_id      INT REFERENCES fin_projects(id),
  uploaded_by     INT,
  description     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit trail
CREATE TABLE IF NOT EXISTS fin_audit_log (
  id              SERIAL PRIMARY KEY,
  user_id         INT,
  action          TEXT NOT NULL,
  entity_type     TEXT NOT NULL,
  entity_id       INT,
  old_values      JSONB,
  new_values      JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Invoices (receivable and payable)
CREATE TABLE IF NOT EXISTS fin_invoices (
  id              SERIAL PRIMARY KEY,
  invoice_number  TEXT NOT NULL,
  invoice_type    TEXT NOT NULL CHECK (invoice_type IN ('receivable','payable')),
  contact_id      INT NOT NULL REFERENCES fin_contacts(id),
  invoice_date    DATE NOT NULL,
  due_date        DATE NOT NULL,
  subtotal        NUMERIC(18,2) NOT NULL DEFAULT 0,
  tax_amount      NUMERIC(18,2) NOT NULL DEFAULT 0,
  total_amount    NUMERIC(18,2) NOT NULL DEFAULT 0,
  paid_amount     NUMERIC(18,2) NOT NULL DEFAULT 0,
  outstanding     NUMERIC(18,2) NOT NULL DEFAULT 0,
  currency        TEXT NOT NULL DEFAULT 'RWF',
  status          TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft','sent','approved','partially_paid','paid','overdue','voided','cancelled')),
  project_id      INT REFERENCES fin_projects(id),
  department_id   INT REFERENCES fin_departments(id),
  description     TEXT,
  notes           TEXT,
  created_by      INT,
  approved_by     INT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(invoice_number, contact_id)
);

-- Invoice line items
CREATE TABLE IF NOT EXISTS fin_invoice_lines (
  id              SERIAL PRIMARY KEY,
  invoice_id      INT NOT NULL REFERENCES fin_invoices(id) ON DELETE CASCADE,
  description     TEXT NOT NULL,
  quantity        NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price      NUMERIC(18,2) NOT NULL,
  amount          NUMERIC(18,2) NOT NULL,
  account_id      INT REFERENCES fin_accounts(id),
  tax_rate        NUMERIC(5,2) DEFAULT 0
);

-- Payments against invoices
CREATE TABLE IF NOT EXISTS fin_invoice_payments (
  id              SERIAL PRIMARY KEY,
  invoice_id      INT NOT NULL REFERENCES fin_invoices(id),
  transaction_id  INT REFERENCES fin_transactions(id),
  amount          NUMERIC(18,2) NOT NULL,
  payment_date    DATE NOT NULL,
  payment_method  TEXT,
  reference       TEXT,
  notes           TEXT,
  created_by      INT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Budgets
CREATE TABLE IF NOT EXISTS fin_budgets (
  id              SERIAL PRIMARY KEY,
  name            TEXT NOT NULL,
  department_id   INT REFERENCES fin_departments(id),
  project_id      INT REFERENCES fin_projects(id),
  fiscal_year     INT,
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','active','closed')),
  approved_by     INT,
  approved_at     TIMESTAMPTZ,
  created_by      INT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Budget lines
CREATE TABLE IF NOT EXISTS fin_budget_lines (
  id              SERIAL PRIMARY KEY,
  budget_id       INT NOT NULL REFERENCES fin_budgets(id) ON DELETE CASCADE,
  account_id      INT NOT NULL REFERENCES fin_accounts(id),
  approved_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed chart of accounts
INSERT INTO fin_accounts (code, name, account_type, normal_balance) VALUES
('1000', 'Assets',                      'asset',   'debit'),
('1100', 'Cash on Hand',                'asset',   'debit'),
('1200', 'Bank Accounts',               'asset',   'debit'),
('1210', 'Bank - Main Account',         'asset',   'debit'),
('1220', 'Mobile Money',                'asset',   'debit'),
('1300', 'Accounts Receivable',         'asset',   'debit'),
('1400', 'Prepaid Expenses',            'asset',   'debit'),
('1500', 'Fixed Assets',                'asset',   'debit'),
('1510', 'Equipment & Computers',       'asset',   'debit'),
('1520', 'Furniture',                   'asset',   'debit'),
('1590', 'Accumulated Depreciation',    'asset',   'credit'),
('2000', 'Liabilities',                 'liability','credit'),
('2100', 'Accounts Payable',            'liability','credit'),
('2200', 'Salaries Payable',            'liability','credit'),
('2300', 'Taxes Payable',               'liability','credit'),
('2310', 'VAT Payable',                 'liability','credit'),
('2320', 'PAYE Payable',                'liability','credit'),
('2330', 'Social Security Payable',     'liability','credit'),
('2400', 'Other Current Liabilities',   'liability','credit'),
('3000', 'Equity',                      'equity',  'credit'),
('3100', 'Owner Capital',               'equity',  'credit'),
('3200', 'Retained Earnings',           'equity',  'credit'),
('4000', 'Income',                      'income',  'credit'),
('4100', 'Seller Plan Revenue',         'income',  'credit'),
('4200', 'Advertising Revenue',         'income',  'credit'),
('4300', 'Booking Commission Revenue',  'income',  'credit'),
('4400', 'Subscription Revenue',        'income',  'credit'),
('4900', 'Other Income',                'income',  'credit'),
('5000', 'Expenses',                    'expense', 'debit'),
('5100', 'Salaries & Wages',            'expense', 'debit'),
('5110', 'Employee Benefits',           'expense', 'debit'),
('5200', 'Hosting & Server Costs',      'expense', 'debit'),
('5210', 'Vercel Hosting',              'expense', 'debit'),
('5220', 'Neon Database',               'expense', 'debit'),
('5230', 'Domain & DNS',                'expense', 'debit'),
('5300', 'Marketing & Advertising',     'expense', 'debit'),
('5400', 'Office & Supplies',           'expense', 'debit'),
('5500', 'Transport & Travel',          'expense', 'debit'),
('5600', 'Communication & Internet',    'expense', 'debit'),
('5700', 'Professional Fees',           'expense', 'debit'),
('5710', 'Legal Fees',                  'expense', 'debit'),
('5720', 'Accounting Fees',             'expense', 'debit'),
('5800', 'Bank Charges & Fees',         'expense', 'debit'),
('5900', 'Depreciation Expense',        'expense', 'debit'),
('5950', 'Miscellaneous Expense',       'expense', 'debit')
ON CONFLICT (code) DO NOTHING;

-- Seed bank accounts
INSERT INTO fin_bank_accounts (name, account_type, currency, current_balance) VALUES
('Main Bank Account', 'bank', 'RWF', 0),
('Petty Cash', 'cash', 'RWF', 0),
('MTN Mobile Money', 'mobile_money', 'RWF', 0)
ON CONFLICT DO NOTHING;

-- Seed departments
INSERT INTO fin_departments (name, code) VALUES
('General', 'GEN'),
('Technology', 'TECH'),
('Marketing', 'MKT'),
('Operations', 'OPS')
ON CONFLICT (code) DO NOTHING;
