-- 039_finance_extras.sql — Accounting periods, recurring transactions,
-- bank statement lines, invoice lines, reconciled flag on transactions

-- Accounting periods (period locking)
CREATE TABLE IF NOT EXISTS fin_accounting_periods (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  locked_by TEXT,
  locked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recurring transaction templates
CREATE TABLE IF NOT EXISTS fin_recurring_transactions (
  id SERIAL PRIMARY KEY,
  txn_type TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  currency TEXT DEFAULT 'RWF',
  frequency TEXT NOT NULL DEFAULT 'monthly',
  next_run_date DATE NOT NULL,
  end_date DATE,
  last_run_date DATE,
  category_account_id INT REFERENCES fin_accounts(id),
  bank_account_id INT REFERENCES fin_bank_accounts(id),
  contact_id INT REFERENCES fin_contacts(id),
  payment_method TEXT,
  auto_post BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bank statement lines for reconciliation
CREATE TABLE IF NOT EXISTS fin_bank_statement_lines (
  id SERIAL PRIMARY KEY,
  bank_account_id INT NOT NULL REFERENCES fin_bank_accounts(id),
  stmt_date DATE NOT NULL,
  description TEXT,
  amount NUMERIC(15,2) NOT NULL,
  reference TEXT,
  match_status TEXT NOT NULL DEFAULT 'unmatched',
  matched_transaction_id INT REFERENCES fin_transactions(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice line items
CREATE TABLE IF NOT EXISTS fin_invoice_lines (
  id SERIAL PRIMARY KEY,
  invoice_id INT NOT NULL REFERENCES fin_invoices(id) ON DELETE CASCADE,
  description TEXT,
  quantity NUMERIC(12,2) DEFAULT 1,
  unit_price NUMERIC(15,2) DEFAULT 0,
  total NUMERIC(15,2) DEFAULT 0,
  account_id INT REFERENCES fin_accounts(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add reconciled flag to transactions (for bank reconciliation)
ALTER TABLE fin_transactions ADD COLUMN IF NOT EXISTS reconciled BOOLEAN DEFAULT FALSE;

-- Seed default accounting periods for 2026
INSERT INTO fin_accounting_periods (name, period_start, period_end) VALUES
  ('January 2026',  '2026-01-01', '2026-01-31'),
  ('February 2026', '2026-02-01', '2026-02-28'),
  ('March 2026',    '2026-03-01', '2026-03-31'),
  ('April 2026',    '2026-04-01', '2026-04-30'),
  ('May 2026',      '2026-05-01', '2026-05-31'),
  ('June 2026',     '2026-06-01', '2026-06-30'),
  ('July 2026',     '2026-07-01', '2026-07-31'),
  ('August 2026',   '2026-08-01', '2026-08-31'),
  ('September 2026','2026-09-01', '2026-09-30'),
  ('October 2026',  '2026-10-01', '2026-10-31'),
  ('November 2026', '2026-11-01', '2026-11-30'),
  ('December 2026', '2026-12-01', '2026-12-31')
ON CONFLICT DO NOTHING;
