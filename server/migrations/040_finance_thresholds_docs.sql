-- Approval thresholds: amount-based rules that auto-require approval
CREATE TABLE IF NOT EXISTS fin_approval_thresholds (
  id SERIAL PRIMARY KEY,
  txn_type TEXT NOT NULL DEFAULT 'all',
  min_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  max_amount NUMERIC(15,2),
  required_role TEXT NOT NULL DEFAULT 'finance',
  is_active BOOLEAN DEFAULT TRUE,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  description TEXT
);

-- Seed a sensible default: anything over 500,000 RWF needs approval
INSERT INTO fin_approval_thresholds (txn_type, min_amount, required_role, description)
VALUES ('all', 500000, 'finance', 'Transactions over 500,000 RWF require finance approval')
ON CONFLICT DO NOTHING;
