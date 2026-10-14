const router = require('express').Router();
const { query, getClient } = require('../db');
const { requireAuth } = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const finAuth = [requireAuth, requireRole('finance', 'director')];

function userId(req) { return req.user?.sub || req.user?.id || null; }

async function nextRef(client, prefix) {
  const { rows } = await client.query(
    `UPDATE fin_ref_counters SET last_number = last_number + 1 WHERE prefix = $1 RETURNING last_number`,
    [prefix]
  );
  const num = rows[0]?.last_number || 1;
  return `${prefix}-${String(num).padStart(5, '0')}`;
}

const TYPE_PREFIX = { income: 'INC', expense: 'EXP', transfer: 'TRF', journal: 'JNL' };

// Double-entry lines for a simple income/expense once it is posted:
// income  -> debit bank ledger, credit income account
// expense -> debit expense account, credit bank ledger
async function writeLedgerLines(client, txn) {
  if (!txn.category_account_id || !txn.bank_account_id) return;
  if (!['income', 'expense'].includes(txn.txn_type)) return;
  const { rows: existing } = await client.query('SELECT 1 FROM fin_journal_lines WHERE transaction_id = $1 LIMIT 1', [txn.id]);
  if (existing.length) return;
  const { rows: ba } = await client.query('SELECT ledger_account_id FROM fin_bank_accounts WHERE id = $1', [txn.bank_account_id]);
  const bankLedger = ba[0]?.ledger_account_id || txn.category_account_id;
  const [debitAcc, creditAcc] = txn.txn_type === 'income'
    ? [bankLedger, txn.category_account_id]
    : [txn.category_account_id, bankLedger];
  await client.query(
    'INSERT INTO fin_journal_lines (transaction_id, account_id, debit, credit) VALUES ($1, $2, $3, 0), ($1, $4, 0, $3)',
    [txn.id, debitAcc, txn.amount, creditAcc]
  );
}

// ─── Dashboard summary ───
router.get('/dashboard/summary', ...finAuth, async (req, res) => {
  const { from, to } = req.query;
  const periodStart = from || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  const periodEnd = to || new Date().toISOString().slice(0, 10);

  const [income, expenses, cashBank, receivables, payables, recentTxns] = await Promise.all([
    query(`SELECT COALESCE(SUM(amount), 0) AS total FROM fin_transactions WHERE txn_type = 'income' AND status = 'posted' AND txn_date BETWEEN $1 AND $2`, [periodStart, periodEnd]),
    query(`SELECT COALESCE(SUM(amount), 0) AS total FROM fin_transactions WHERE txn_type = 'expense' AND status = 'posted' AND txn_date BETWEEN $1 AND $2`, [periodStart, periodEnd]),
    query(`SELECT COALESCE(SUM(current_balance), 0) AS total FROM fin_bank_accounts WHERE is_active = TRUE`),
    query(`SELECT COALESCE(SUM(outstanding), 0) AS total FROM fin_invoices WHERE invoice_type = 'receivable' AND status NOT IN ('paid','voided','cancelled')`),
    query(`SELECT COALESCE(SUM(outstanding), 0) AS total FROM fin_invoices WHERE invoice_type = 'payable' AND status NOT IN ('paid','voided','cancelled')`),
    query(`SELECT id, txn_ref, txn_type, txn_date, description, amount, status FROM fin_transactions WHERE status != 'voided' ORDER BY created_at DESC LIMIT 10`),
  ]);

  const incomeTotal = parseFloat(income.rows[0].total);
  const expenseTotal = parseFloat(expenses.rows[0].total);
  res.json({
    period: { from: periodStart, to: periodEnd },
    cards: {
      cashBank: parseFloat(cashBank.rows[0].total),
      income: incomeTotal, expenses: expenseTotal,
      netMovement: incomeTotal - expenseTotal,
      receivables: parseFloat(receivables.rows[0].total),
      payables: parseFloat(payables.rows[0].total),
    },
    recentTransactions: recentTxns.rows,
  });
});

// ─── Dashboard alerts ───
router.get('/dashboard/alerts', ...finAuth, async (req, res) => {
  const [recv, pay, pending] = await Promise.all([
    query(`SELECT COUNT(*) AS count, COALESCE(SUM(outstanding), 0) AS total FROM fin_invoices WHERE invoice_type = 'receivable' AND due_date < CURRENT_DATE AND status NOT IN ('paid','voided','cancelled')`),
    query(`SELECT COUNT(*) AS count, COALESCE(SUM(outstanding), 0) AS total FROM fin_invoices WHERE invoice_type = 'payable' AND due_date < CURRENT_DATE AND status NOT IN ('paid','voided','cancelled')`),
    query(`SELECT COUNT(*) AS count FROM fin_transactions WHERE status = 'pending_approval'`),
  ]);
  res.json({
    overdueReceivables: { count: parseInt(recv.rows[0].count), total: parseFloat(recv.rows[0].total) },
    overduePayables: { count: parseInt(pay.rows[0].count), total: parseFloat(pay.rows[0].total) },
    pendingApprovals: parseInt(pending.rows[0].count),
  });
});

// ─── Dashboard charts ───
router.get('/dashboard/charts/income-vs-expenses', ...finAuth, async (req, res) => {
  const { months = 6 } = req.query;
  const { rows } = await query(`
    SELECT TO_CHAR(txn_date, 'YYYY-MM') AS month, txn_type, COALESCE(SUM(amount), 0) AS total
    FROM fin_transactions WHERE status = 'posted' AND txn_type IN ('income','expense')
      AND txn_date >= (CURRENT_DATE - ($1 || ' months')::INTERVAL)
    GROUP BY month, txn_type ORDER BY month
  `, [months]);
  res.json(rows);
});

router.get('/dashboard/charts/expense-breakdown', ...finAuth, async (req, res) => {
  const { from, to } = req.query;
  const periodStart = from || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  const periodEnd = to || new Date().toISOString().slice(0, 10);
  const { rows } = await query(`
    SELECT a.name AS category, COALESCE(SUM(t.amount), 0) AS total
    FROM fin_transactions t LEFT JOIN fin_accounts a ON t.category_account_id = a.id
    WHERE t.txn_type = 'expense' AND t.status = 'posted' AND t.txn_date BETWEEN $1 AND $2
    GROUP BY a.name ORDER BY total DESC
  `, [periodStart, periodEnd]);
  res.json(rows);
});

// ─── Transactions CRUD ───
router.get('/transactions', ...finAuth, async (req, res) => {
  const { type, status, from, to, search, limit = 50, offset = 0 } = req.query;
  let where = ['1=1'];
  const params = [];
  let idx = 0;
  if (type) { idx++; where.push(`t.txn_type = $${idx}`); params.push(type); }
  if (status) { idx++; where.push(`t.status = $${idx}`); params.push(status); }
  if (from) { idx++; where.push(`t.txn_date >= $${idx}`); params.push(from); }
  if (to) { idx++; where.push(`t.txn_date <= $${idx}`); params.push(to); }
  if (search) { idx++; where.push(`(t.description ILIKE $${idx} OR t.txn_ref ILIKE $${idx})`); params.push(`%${search}%`); }
  idx++; params.push(parseInt(limit));
  idx++; params.push(parseInt(offset));
  const { rows } = await query(`
    SELECT t.*, c.name AS contact_name, a.name AS category_name, b.name AS bank_name
    FROM fin_transactions t
    LEFT JOIN fin_contacts c ON t.contact_id = c.id
    LEFT JOIN fin_accounts a ON t.category_account_id = a.id
    LEFT JOIN fin_bank_accounts b ON t.bank_account_id = b.id
    WHERE ${where.join(' AND ')}
    ORDER BY t.txn_date DESC, t.created_at DESC
    LIMIT $${idx - 1} OFFSET $${idx}
  `, params);
  const { rows: cnt } = await query(`SELECT COUNT(*) FROM fin_transactions t WHERE ${where.join(' AND ')}`, params.slice(0, -2));
  res.json({ transactions: rows, total: parseInt(cnt[0].count) });
});

router.get('/transactions/:id', ...finAuth, async (req, res) => {
  const { rows } = await query(`
    SELECT t.*, c.name AS contact_name, a.name AS category_name, b.name AS bank_name
    FROM fin_transactions t
    LEFT JOIN fin_contacts c ON t.contact_id = c.id
    LEFT JOIN fin_accounts a ON t.category_account_id = a.id
    LEFT JOIN fin_bank_accounts b ON t.bank_account_id = b.id
    WHERE t.id = $1
  `, [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  const { rows: lines } = await query(`SELECT jl.*, a.name AS account_name, a.code AS account_code FROM fin_journal_lines jl LEFT JOIN fin_accounts a ON jl.account_id = a.id WHERE jl.transaction_id = $1 ORDER BY jl.id`, [req.params.id]);
  res.json({ ...rows[0], journal_lines: lines });
});

router.post('/transactions', ...finAuth, async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { txn_type, txn_date, description, amount, currency = 'RWF', contact_id, bank_account_id, category_account_id, project_id, department_id, payment_method, external_ref, status = 'draft', notes } = req.body;
    if (!txn_type || !txn_date || !description || !amount) return res.status(400).json({ error: 'Missing required fields' });
    const prefix = TYPE_PREFIX[txn_type];
    if (!prefix) return res.status(400).json({ error: 'Invalid transaction type' });

    // Period lock check
    const { rows: lockedPeriods } = await client.query(
      `SELECT id FROM fin_accounting_periods WHERE status='locked' AND $1::date BETWEEN period_start AND period_end LIMIT 1`,
      [txn_date]
    );
    if (lockedPeriods.length) return res.status(400).json({ error: 'Cannot create transaction in a locked accounting period' });

    // Approval threshold check
    let finalStatus = status;
    if (status === 'posted' || status === 'draft') {
      const { rows: thresholds } = await client.query(
        `SELECT * FROM fin_approval_thresholds WHERE is_active = TRUE AND (txn_type = $1 OR txn_type = 'all')
         AND min_amount <= $2 AND (max_amount IS NULL OR max_amount >= $2) ORDER BY min_amount DESC LIMIT 1`,
        [txn_type, amount]
      );
      if (thresholds.length && status === 'posted') finalStatus = 'pending_approval';
    }

    const txn_ref = await nextRef(client, prefix);

    const { rows } = await client.query(`
      INSERT INTO fin_transactions (txn_ref, txn_type, txn_date, description, amount, currency, contact_id, bank_account_id, category_account_id, project_id, department_id, payment_method, external_ref, status, notes, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *
    `, [txn_ref, txn_type, txn_date, description, amount, currency, contact_id||null, bank_account_id||null, category_account_id||null, project_id||null, department_id||null, payment_method||null, external_ref||null, finalStatus, notes||null, userId(req)]);
    const txn = rows[0];

    if (finalStatus === 'posted' && category_account_id && bank_account_id) {
      const { rows: ba } = await client.query('SELECT ledger_account_id FROM fin_bank_accounts WHERE id = $1', [bank_account_id]);
      const bankLedger = ba[0]?.ledger_account_id;
      if (txn_type === 'income') {
        await client.query(`INSERT INTO fin_journal_lines (transaction_id, account_id, debit, credit) VALUES ($1, $2, $3, 0), ($1, $4, 0, $3)`, [txn.id, bankLedger || category_account_id, amount, category_account_id]);
        await client.query('UPDATE fin_bank_accounts SET current_balance = current_balance + $1 WHERE id = $2', [amount, bank_account_id]);
      } else if (txn_type === 'expense') {
        await client.query(`INSERT INTO fin_journal_lines (transaction_id, account_id, debit, credit) VALUES ($1, $2, $3, 0), ($1, $4, 0, $3)`, [txn.id, category_account_id, amount, bankLedger || category_account_id]);
        await client.query('UPDATE fin_bank_accounts SET current_balance = current_balance - $1 WHERE id = $2', [amount, bank_account_id]);
      }
      await client.query('UPDATE fin_transactions SET posted_at = NOW() WHERE id = $1', [txn.id]);
    }

    await client.query(`INSERT INTO fin_audit_log (user_id, action, entity_type, entity_id, new_values) VALUES ($1, 'create', 'transaction', $2, $3)`, [userId(req), txn.id, JSON.stringify({ txn_ref, txn_type, amount, status })]);
    await client.query('COMMIT');
    res.json(txn);
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

router.post('/transactions/:id/submit', ...finAuth, async (req, res) => {
  const { rows } = await query(
    `UPDATE fin_transactions SET status = 'pending_approval', updated_at = NOW() WHERE id = $1 AND status = 'draft' RETURNING *`,
    [req.params.id]
  );
  if (!rows.length) return res.status(400).json({ error: 'Only draft transactions can be submitted' });
  await query(`INSERT INTO fin_audit_log (user_id, action, entity_type, entity_id, new_values) VALUES ($1, 'submit', 'transaction', $2, '{"status":"pending_approval"}')`, [userId(req), req.params.id]);
  res.json(rows[0]);
});

router.post('/transactions/:id/approve', ...finAuth, async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query('SELECT * FROM fin_transactions WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    if (rows[0].created_by === userId(req)) return res.status(403).json({ error: 'Cannot approve your own transaction' });
    await client.query(`UPDATE fin_transactions SET status = 'approved', approved_by = $1, approved_at = NOW(), updated_at = NOW() WHERE id = $2`, [userId(req), req.params.id]);
    await client.query(`INSERT INTO fin_audit_log (user_id, action, entity_type, entity_id, new_values) VALUES ($1, 'approve', 'transaction', $2, '{"status":"approved"}')`, [userId(req), req.params.id]);
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (e) { await client.query('ROLLBACK'); res.status(500).json({ error: e.message }); } finally { client.release(); }
});

router.post('/transactions/:id/post', ...finAuth, async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query('SELECT * FROM fin_transactions WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const txn = rows[0];
    if (txn.status === 'posted') return res.status(400).json({ error: 'Already posted' });
    if (txn.status === 'voided') return res.status(400).json({ error: 'Cannot post a voided transaction' });
    await client.query(`UPDATE fin_transactions SET status = 'posted', posted_at = NOW(), updated_at = NOW() WHERE id = $1`, [req.params.id]);
    await writeLedgerLines(client, txn);
    if (txn.bank_account_id) {
      const change = txn.txn_type === 'income' ? txn.amount : -txn.amount;
      await client.query('UPDATE fin_bank_accounts SET current_balance = current_balance + $1 WHERE id = $2', [change, txn.bank_account_id]);
    }
    await client.query(`INSERT INTO fin_audit_log (user_id, action, entity_type, entity_id, new_values) VALUES ($1, 'post', 'transaction', $2, '{"status":"posted"}')`, [userId(req), req.params.id]);
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (e) { await client.query('ROLLBACK'); res.status(500).json({ error: e.message }); } finally { client.release(); }
});

router.post('/transactions/:id/void', ...finAuth, async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ error: 'Void reason required' });
    const { rows } = await client.query('SELECT * FROM fin_transactions WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const txn = rows[0];
    if (txn.status === 'posted' && txn.bank_account_id) {
      const reversal = txn.txn_type === 'income' ? -txn.amount : txn.amount;
      await client.query('UPDATE fin_bank_accounts SET current_balance = current_balance + $1 WHERE id = $2', [reversal, txn.bank_account_id]);
    }
    await client.query(`UPDATE fin_transactions SET status = 'voided', voided_at = NOW(), voided_by = $1, void_reason = $2, updated_at = NOW() WHERE id = $3`, [userId(req), reason, req.params.id]);
    await client.query(`INSERT INTO fin_audit_log (user_id, action, entity_type, entity_id, new_values) VALUES ($1, 'void', 'transaction', $2, $3)`, [userId(req), req.params.id, JSON.stringify({ status: 'voided', reason })]);
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (e) { await client.query('ROLLBACK'); res.status(500).json({ error: e.message }); } finally { client.release(); }
});

// ─── Accounts ───
router.get('/accounts', ...finAuth, async (req, res) => {
  const { type } = req.query;
  let q = 'SELECT * FROM fin_accounts WHERE is_active = TRUE';
  const params = [];
  if (type) { q += ' AND account_type = $1'; params.push(type); }
  q += ' ORDER BY code';
  const { rows } = await query(q, params);
  res.json(rows);
});

router.get('/bank-accounts', ...finAuth, async (req, res) => {
  const { rows } = await query('SELECT * FROM fin_bank_accounts WHERE is_active = TRUE ORDER BY name');
  res.json(rows);
});

router.get('/departments', ...finAuth, async (req, res) => {
  const { rows } = await query('SELECT * FROM fin_departments WHERE is_active = TRUE ORDER BY name');
  res.json(rows);
});

router.get('/projects', ...finAuth, async (req, res) => {
  const { rows } = await query("SELECT * FROM fin_projects WHERE status = 'active' ORDER BY name");
  res.json(rows);
});

// ─── Contacts ───
router.get('/contacts', ...finAuth, async (req, res) => {
  const { type, search } = req.query;
  let where = ['is_active = TRUE'];
  const params = [];
  if (type) { params.push(type); where.push(`contact_type = $${params.length}`); }
  if (search) { params.push(`%${search}%`); where.push(`(name ILIKE $${params.length} OR email ILIKE $${params.length})`); }
  const { rows } = await query(`SELECT * FROM fin_contacts WHERE ${where.join(' AND ')} ORDER BY name`, params);
  res.json(rows);
});

router.post('/contacts', ...finAuth, async (req, res) => {
  const { name, contact_type, email, phone, address, tax_id, payment_terms_days, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const { rows } = await query(
    `INSERT INTO fin_contacts (name, contact_type, email, phone, address, tax_id, payment_terms_days, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [name, contact_type || 'other', email, phone, address, tax_id, payment_terms_days || 30, notes]
  );
  res.json(rows[0]);
});

router.put('/contacts/:id', ...finAuth, async (req, res) => {
  const { name, contact_type, email, phone, address, tax_id, payment_terms_days, notes } = req.body;
  const { rows } = await query(
    `UPDATE fin_contacts SET name=$1, contact_type=$2, email=$3, phone=$4, address=$5, tax_id=$6, payment_terms_days=$7, notes=$8, updated_at=NOW() WHERE id=$9 RETURNING *`,
    [name, contact_type, email, phone, address, tax_id, payment_terms_days, notes, req.params.id]
  );
  res.json(rows[0]);
});

// ─── Budgets ───
router.get('/budgets', ...finAuth, async (req, res) => {
  const { rows } = await query(`SELECT * FROM fin_budgets ORDER BY created_at DESC`);
  res.json(rows);
});

router.get('/budgets/:id', ...finAuth, async (req, res) => {
  const { rows: budget } = await query('SELECT * FROM fin_budgets WHERE id = $1', [req.params.id]);
  if (!budget.length) return res.status(404).json({ error: 'Not found' });
  const { rows: lines } = await query(`
    SELECT bl.*, a.name AS account_name, a.code AS account_code,
      COALESCE((SELECT SUM(t.amount) FROM fin_transactions t WHERE t.category_account_id = bl.account_id AND t.status = 'posted'), 0) AS actual
    FROM fin_budget_lines bl LEFT JOIN fin_accounts a ON bl.account_id = a.id WHERE bl.budget_id = $1 ORDER BY a.code
  `, [req.params.id]);
  res.json({ ...budget[0], lines });
});

router.post('/budgets', ...finAuth, async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { name, department_id, project_id, fiscal_year, lines = [] } = req.body;
    const { rows } = await client.query(`INSERT INTO fin_budgets (name, department_id, project_id, fiscal_year, created_by) VALUES ($1,$2,$3,$4,$5) RETURNING *`, [name, department_id, project_id, fiscal_year, userId(req)]);
    const budget = rows[0];
    for (const line of lines) {
      await client.query(`INSERT INTO fin_budget_lines (budget_id, account_id, approved_amount, notes) VALUES ($1,$2,$3,$4)`, [budget.id, line.account_id, line.approved_amount, line.notes]);
    }
    await client.query('COMMIT');
    res.json(budget);
  } catch (e) { await client.query('ROLLBACK'); res.status(500).json({ error: e.message }); } finally { client.release(); }
});

// ─── Reports ───
router.get('/reports/income-expenditure', ...finAuth, async (req, res) => {
  const { from, to } = req.query;
  const periodStart = from || new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const periodEnd = to || new Date().toISOString().slice(0, 10);
  const { rows } = await query(`
    SELECT a.code, a.name, t.txn_type, COALESCE(SUM(t.amount), 0) AS total
    FROM fin_transactions t JOIN fin_accounts a ON t.category_account_id = a.id
    WHERE t.status = 'posted' AND t.txn_date BETWEEN $1 AND $2
    GROUP BY a.code, a.name, t.txn_type ORDER BY a.code
  `, [periodStart, periodEnd]);
  const income = rows.filter(r => r.txn_type === 'income');
  const expenses = rows.filter(r => r.txn_type === 'expense');
  const totalIncome = income.reduce((s, r) => s + parseFloat(r.total), 0);
  const totalExpenses = expenses.reduce((s, r) => s + parseFloat(r.total), 0);
  res.json({ period: { from: periodStart, to: periodEnd }, income, expenses, totalIncome, totalExpenses, net: totalIncome - totalExpenses });
});

router.get('/reports/trial-balance', ...finAuth, async (req, res) => {
  const { rows } = await query(`
    SELECT a.code, a.name, a.account_type, COALESCE(SUM(jl.debit), 0) AS total_debit, COALESCE(SUM(jl.credit), 0) AS total_credit
    FROM fin_accounts a LEFT JOIN (fin_journal_lines jl JOIN fin_transactions t ON jl.transaction_id = t.id AND t.status = 'posted')
      ON a.id = jl.account_id
    WHERE a.is_active = TRUE
    GROUP BY a.code, a.name, a.account_type HAVING COALESCE(SUM(jl.debit), 0) > 0 OR COALESCE(SUM(jl.credit), 0) > 0
    ORDER BY a.code
  `);
  res.json(rows);
});

router.get('/reports/receivables-aging', ...finAuth, async (req, res) => {
  const { rows } = await query(`
    SELECT i.*, c.name AS contact_name,
      CASE WHEN i.due_date >= CURRENT_DATE THEN 'current' WHEN CURRENT_DATE - i.due_date <= 30 THEN '1-30'
        WHEN CURRENT_DATE - i.due_date <= 60 THEN '31-60' WHEN CURRENT_DATE - i.due_date <= 90 THEN '61-90' ELSE 'over_90' END AS aging_bucket
    FROM fin_invoices i JOIN fin_contacts c ON i.contact_id = c.id
    WHERE i.invoice_type = 'receivable' AND i.status NOT IN ('paid','voided','cancelled') ORDER BY i.due_date
  `);
  res.json(rows);
});

router.get('/reports/payables-aging', ...finAuth, async (req, res) => {
  const { rows } = await query(`
    SELECT i.*, c.name AS contact_name,
      CASE WHEN i.due_date >= CURRENT_DATE THEN 'current' WHEN CURRENT_DATE - i.due_date <= 30 THEN '1-30'
        WHEN CURRENT_DATE - i.due_date <= 60 THEN '31-60' WHEN CURRENT_DATE - i.due_date <= 90 THEN '61-90' ELSE 'over_90' END AS aging_bucket
    FROM fin_invoices i JOIN fin_contacts c ON i.contact_id = c.id
    WHERE i.invoice_type = 'payable' AND i.status NOT IN ('paid','voided','cancelled') ORDER BY i.due_date
  `);
  res.json(rows);
});

router.get('/reports/transactions', ...finAuth, async (req, res) => {
  const { from, to, type } = req.query;
  const periodStart = from || new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const periodEnd = to || new Date().toISOString().slice(0, 10);
  let where = [`t.status = 'posted'`, `t.txn_date BETWEEN $1 AND $2`];
  const params = [periodStart, periodEnd];
  if (type) { params.push(type); where.push(`t.txn_type = $${params.length}`); }
  const { rows } = await query(`
    SELECT t.*, c.name AS contact_name, a.name AS category_name
    FROM fin_transactions t LEFT JOIN fin_contacts c ON t.contact_id = c.id LEFT JOIN fin_accounts a ON t.category_account_id = a.id
    WHERE ${where.join(' AND ')} ORDER BY t.txn_date, t.txn_ref
  `, params);
  const total = rows.reduce((s, r) => s + parseFloat(r.amount), 0);
  res.json({ period: { from: periodStart, to: periodEnd }, transactions: rows, total });
});

// ─── Invoices ───
router.get('/invoices', ...finAuth, async (req, res) => {
  const { type, status } = req.query;
  let where = ['1=1'];
  const params = [];
  if (type) { params.push(type); where.push(`i.invoice_type = $${params.length}`); }
  if (status) { params.push(status); where.push(`i.status = $${params.length}`); }
  const { rows } = await query(`SELECT i.*, c.name AS contact_name FROM fin_invoices i LEFT JOIN fin_contacts c ON i.contact_id = c.id WHERE ${where.join(' AND ')} ORDER BY i.due_date`, params);
  res.json(rows);
});

router.post('/invoices', ...finAuth, async (req, res) => {
  const { invoice_number, invoice_type, contact_id, invoice_date, due_date, total_amount, tax_amount = 0, description, notes, project_id, department_id } = req.body;
  if (!invoice_number || !invoice_type || !contact_id || !invoice_date || !due_date || !total_amount) return res.status(400).json({ error: 'Missing required fields' });
  const subtotal = total_amount - tax_amount;
  const { rows } = await query(
    `INSERT INTO fin_invoices (invoice_number, invoice_type, contact_id, invoice_date, due_date, subtotal, tax_amount, total_amount, outstanding, description, notes, project_id, department_id, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8,$9,$10,$11,$12,$13) RETURNING *`,
    [invoice_number, invoice_type, contact_id, invoice_date, due_date, subtotal, tax_amount, total_amount, description, notes, project_id, department_id, userId(req)]
  );
  res.json(rows[0]);
});

// ─── Invoice detail + payments ───
router.get('/invoices/:id', ...finAuth, async (req, res) => {
  const { rows: inv } = await query(`SELECT i.*, c.name AS contact_name FROM fin_invoices i LEFT JOIN fin_contacts c ON i.contact_id = c.id WHERE i.id = $1`, [req.params.id]);
  if (!inv.length) return res.status(404).json({ error: 'Not found' });
  const { rows: lines } = await query(`SELECT il.*, a.name AS account_name FROM fin_invoice_lines il LEFT JOIN fin_accounts a ON il.account_id = a.id WHERE il.invoice_id = $1 ORDER BY il.id`, [req.params.id]);
  const { rows: payments } = await query(`SELECT * FROM fin_invoice_payments WHERE invoice_id = $1 ORDER BY payment_date DESC`, [req.params.id]);
  res.json({ ...inv[0], lines, payments });
});

router.post('/invoices/:id/pay', ...finAuth, async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { amount, payment_date, payment_method, reference, notes } = req.body;
    if (!amount || !payment_date) return res.status(400).json({ error: 'Amount and payment date required' });
    const { rows: inv } = await client.query('SELECT * FROM fin_invoices WHERE id = $1', [req.params.id]);
    if (!inv.length) return res.status(404).json({ error: 'Invoice not found' });
    const invoice = inv[0];
    if (parseFloat(amount) > parseFloat(invoice.outstanding)) return res.status(400).json({ error: 'Payment exceeds outstanding balance' });
    await client.query(`INSERT INTO fin_invoice_payments (invoice_id, amount, payment_date, payment_method, reference, notes, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7)`, [req.params.id, amount, payment_date, payment_method, reference, notes, userId(req)]);
    const newPaid = parseFloat(invoice.paid_amount) + parseFloat(amount);
    const newOutstanding = parseFloat(invoice.total_amount) - newPaid;
    const newStatus = newOutstanding <= 0 ? 'paid' : 'partially_paid';
    await client.query(`UPDATE fin_invoices SET paid_amount = $1, outstanding = $2, status = $3, updated_at = NOW() WHERE id = $4`, [newPaid, newOutstanding, newStatus, req.params.id]);
    await client.query(`INSERT INTO fin_audit_log (user_id, action, entity_type, entity_id, new_values) VALUES ($1, 'payment', 'invoice', $2, $3)`, [userId(req), req.params.id, JSON.stringify({ amount, newStatus: newStatus })]);
    await client.query('COMMIT');
    res.json({ success: true, paid_amount: newPaid, outstanding: newOutstanding, status: newStatus });
  } catch (e) { await client.query('ROLLBACK'); res.status(500).json({ error: e.message }); } finally { client.release(); }
});

router.put('/invoices/:id', ...finAuth, async (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'Status required' });
  const { rows } = await query(`UPDATE fin_invoices SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`, [status, req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

// ─── Pending approvals ───
router.get('/approvals', ...finAuth, async (req, res) => {
  const { rows } = await query(`
    SELECT t.*, c.name AS contact_name, a.name AS category_name, b.name AS bank_name,
      COALESCE(u.first_name || ' ' || u.last_name, u.email) AS created_by_name
    FROM fin_transactions t
    LEFT JOIN fin_contacts c ON t.contact_id = c.id
    LEFT JOIN fin_accounts a ON t.category_account_id = a.id
    LEFT JOIN fin_bank_accounts b ON t.bank_account_id = b.id
    LEFT JOIN users u ON u.id::text = t.created_by::text
    WHERE t.status IN ('draft', 'pending_approval', 'approved')
    ORDER BY t.created_at DESC
  `);
  res.json(rows);
});

// ─── Budget approval ───
router.post('/budgets/:id/approve', ...finAuth, async (req, res) => {
  const { rows } = await query(`UPDATE fin_budgets SET status = 'approved', approved_by = $1, approved_at = NOW(), updated_at = NOW() WHERE id = $2 RETURNING *`, [userId(req), req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

router.post('/budgets/:id/activate', ...finAuth, async (req, res) => {
  const { rows } = await query(`UPDATE fin_budgets SET status = 'active', updated_at = NOW() WHERE id = $1 RETURNING *`, [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

// ─── Audit log ───
router.get('/audit-log', ...finAuth, async (req, res) => {
  const { entity_type, limit = 50 } = req.query;
  let where = '1=1';
  const params = [];
  if (entity_type) { params.push(entity_type); where += ` AND al.entity_type = $${params.length}`; }
  params.push(parseInt(limit));
  const { rows } = await query(`
    SELECT al.*, COALESCE(u.first_name || ' ' || u.last_name, u.email) AS user_name FROM fin_audit_log al
    LEFT JOIN users u ON u.id::text = al.user_id::text
    WHERE ${where} ORDER BY al.created_at DESC LIMIT $${params.length}
  `, params);
  res.json(rows);
});

// ─── Organization profile ───
router.get('/organization', ...finAuth, async (req, res) => {
  const { rows } = await query('SELECT * FROM fin_organization LIMIT 1');
  res.json(rows[0] || {});
});

router.put('/organization', ...finAuth, async (req, res) => {
  const { legal_name, display_name, address, phone, email, primary_currency, fiscal_year_start_month } = req.body;
  const { rows } = await query(`
    UPDATE fin_organization SET legal_name=$1, display_name=$2, address=$3, phone=$4, email=$5,
      primary_currency=$6, fiscal_year_start_month=$7, updated_at=NOW()
    WHERE id = (SELECT id FROM fin_organization LIMIT 1) RETURNING *
  `, [legal_name, display_name, address, phone, email, primary_currency || 'RWF', fiscal_year_start_month || 1]);
  res.json(rows[0]);
});

// ─── Chart of accounts CRUD ───
router.post('/accounts', ...finAuth, async (req, res) => {
  const { code, name, account_type, parent_id, description, normal_balance } = req.body;
  if (!code || !name || !account_type) return res.status(400).json({ error: 'Code, name, and type required' });
  const nb = normal_balance || (['asset', 'expense'].includes(account_type) ? 'debit' : 'credit');
  try {
    const { rows } = await query(
      `INSERT INTO fin_accounts (code, name, account_type, parent_id, description, normal_balance) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [code, name, account_type, parent_id || null, description, nb]
    );
    res.json(rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(400).json({ error: 'Account code already exists' });
    throw e;
  }
});

router.put('/accounts/:id', ...finAuth, async (req, res) => {
  const { name, description, is_active } = req.body;
  const { rows } = await query(
    `UPDATE fin_accounts SET name=COALESCE($1,name), description=COALESCE($2,description), is_active=COALESCE($3,is_active) WHERE id=$4 RETURNING *`,
    [name, description, is_active, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

// ─── Projects CRUD ───
router.post('/projects', ...finAuth, async (req, res) => {
  const { code, name, description, donor_id, approved_amount, start_date, end_date } = req.body;
  if (!code || !name) return res.status(400).json({ error: 'Code and name required' });
  try {
    const { rows } = await query(
      `INSERT INTO fin_projects (code, name, description, donor_id, approved_amount, start_date, end_date) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [code, name, description, donor_id || null, approved_amount || null, start_date || null, end_date || null]
    );
    res.json(rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(400).json({ error: 'Project code already exists' });
    throw e;
  }
});

router.get('/projects/all', ...finAuth, async (req, res) => {
  const { rows } = await query(`SELECT p.*, c.name AS donor_name FROM fin_projects p LEFT JOIN fin_contacts c ON p.donor_id = c.id ORDER BY p.code`);
  res.json(rows);
});

router.put('/projects/:id', ...finAuth, async (req, res) => {
  const { name, description, status, approved_amount, start_date, end_date } = req.body;
  const { rows } = await query(
    `UPDATE fin_projects SET name=COALESCE($1,name), description=COALESCE($2,description), status=COALESCE($3,status),
      approved_amount=COALESCE($4,approved_amount), start_date=COALESCE($5,start_date), end_date=COALESCE($6,end_date), updated_at=NOW()
    WHERE id=$7 RETURNING *`,
    [name, description, status, approved_amount, start_date, end_date, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

// ─── Departments CRUD ───
router.post('/departments', ...finAuth, async (req, res) => {
  const { name, code } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const { rows } = await query(`INSERT INTO fin_departments (name, code) VALUES ($1, $2) RETURNING *`, [name, code || null]);
  res.json(rows[0]);
});

// ─── Global search ───
router.get('/search', ...finAuth, async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json({ transactions: [], invoices: [], contacts: [] });
  const term = `%${q}%`;
  const [txns, invs, conts] = await Promise.all([
    query(`SELECT id, txn_ref, description, amount, txn_type, status, txn_date FROM fin_transactions WHERE description ILIKE $1 OR txn_ref ILIKE $1 ORDER BY txn_date DESC LIMIT 10`, [term]),
    query(`SELECT id, invoice_number, invoice_type, total_amount, outstanding, status, due_date FROM fin_invoices WHERE invoice_number ILIKE $1 OR description ILIKE $1 ORDER BY due_date DESC LIMIT 10`, [term]),
    query(`SELECT id, name, contact_type, email, phone FROM fin_contacts WHERE name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1 LIMIT 10`, [term]),
  ]);
  res.json({ transactions: txns.rows, invoices: invs.rows, contacts: conts.rows });
});

// ─── Duplicate check ───
router.get('/check-duplicate', ...finAuth, async (req, res) => {
  const { type, amount, date, contact_id, invoice_number } = req.query;
  const warnings = [];
  if (type && amount && date) {
    const { rows } = await query(
      `SELECT txn_ref, description, amount, txn_date FROM fin_transactions WHERE txn_type=$1 AND amount=$2 AND txn_date=$3 AND status != 'voided' LIMIT 3`,
      [type, amount, date]
    );
    if (rows.length) warnings.push({ type: 'transaction', message: `${rows.length} similar transaction(s) found on ${date} for the same amount`, matches: rows });
  }
  if (invoice_number && contact_id) {
    const { rows } = await query(
      `SELECT invoice_number, total_amount, status FROM fin_invoices WHERE invoice_number=$1 AND contact_id=$2 AND status != 'voided' LIMIT 1`,
      [invoice_number, contact_id]
    );
    if (rows.length) warnings.push({ type: 'invoice', message: `Invoice ${invoice_number} already exists for this contact`, matches: rows });
  }
  res.json({ duplicates: warnings.length > 0, warnings });
});

// ─── CSV export ───
router.get('/export/transactions', ...finAuth, async (req, res) => {
  const { from, to, type } = req.query;
  const periodStart = from || new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const periodEnd = to || new Date().toISOString().slice(0, 10);
  let where = [`t.status = 'posted'`, `t.txn_date BETWEEN $1 AND $2`];
  const params = [periodStart, periodEnd];
  if (type) { params.push(type); where.push(`t.txn_type = $${params.length}`); }
  const { rows } = await query(`
    SELECT t.txn_ref, t.txn_date, t.txn_type, t.description, t.amount, t.currency, t.payment_method, t.status,
      c.name AS contact, a.name AS category, b.name AS bank_account
    FROM fin_transactions t LEFT JOIN fin_contacts c ON t.contact_id = c.id
    LEFT JOIN fin_accounts a ON t.category_account_id = a.id LEFT JOIN fin_bank_accounts b ON t.bank_account_id = b.id
    WHERE ${where.join(' AND ')} ORDER BY t.txn_date, t.txn_ref
  `, params);
  const header = 'Reference,Date,Type,Description,Amount,Currency,Payment Method,Status,Contact,Category,Bank Account';
  const csv = [header, ...rows.map(r =>
    [r.txn_ref, r.txn_date?.toISOString?.()?.slice(0,10) || r.txn_date, r.txn_type, `"${(r.description||'').replace(/"/g,'""')}"`, r.amount, r.currency, r.payment_method || '', r.status, `"${r.contact||''}"`, `"${r.category||''}"`, `"${r.bank_account||''}"`].join(',')
  )].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="transactions_${periodStart}_${periodEnd}.csv"`);
  res.send(csv);
});

router.get('/export/report/:type', ...finAuth, async (req, res) => {
  const { from, to } = req.query;
  const reportType = req.params.type;
  const periodStart = from || new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const periodEnd = to || new Date().toISOString().slice(0, 10);

  if (reportType === 'trial-balance') {
    const { rows } = await query(`
      SELECT a.code, a.name, a.account_type, COALESCE(SUM(jl.debit), 0) AS total_debit, COALESCE(SUM(jl.credit), 0) AS total_credit
      FROM fin_accounts a LEFT JOIN (fin_journal_lines jl JOIN fin_transactions t ON jl.transaction_id = t.id AND t.status = 'posted')
        ON a.id = jl.account_id
      WHERE a.is_active = TRUE GROUP BY a.code, a.name, a.account_type
      HAVING COALESCE(SUM(jl.debit), 0) > 0 OR COALESCE(SUM(jl.credit), 0) > 0 ORDER BY a.code
    `);
    const csv = ['Code,Account,Type,Debit,Credit', ...rows.map(r => `${r.code},"${r.name}",${r.account_type},${r.total_debit},${r.total_credit}`)].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="trial_balance_${periodEnd}.csv"`);
    return res.send(csv);
  }

  if (reportType === 'income-expenditure') {
    const { rows } = await query(`
      SELECT a.code, a.name, t.txn_type, COALESCE(SUM(t.amount), 0) AS total
      FROM fin_transactions t JOIN fin_accounts a ON t.category_account_id = a.id
      WHERE t.status = 'posted' AND t.txn_date BETWEEN $1 AND $2
      GROUP BY a.code, a.name, t.txn_type ORDER BY a.code
    `, [periodStart, periodEnd]);
    const csv = ['Code,Account,Type,Amount', ...rows.map(r => `${r.code},"${r.name}",${r.txn_type},${r.total}`)].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="income_expenditure_${periodStart}_${periodEnd}.csv"`);
    return res.send(csv);
  }

  res.status(400).json({ error: 'Unknown report type' });
});

// ─── Bank accounts CRUD ───
router.post('/bank-accounts', ...finAuth, async (req, res) => {
  const { name, account_type, account_number, bank_name, currency } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const { rows } = await query(
    `INSERT INTO fin_bank_accounts (name, account_type, account_number, bank_name, currency) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [name, account_type || 'bank', account_number, bank_name, currency || 'RWF']
  );
  res.json(rows[0]);
});

// ─── Period locking ───
router.get('/periods', ...finAuth, async (req, res) => {
  const { rows } = await query(`
    SELECT * FROM fin_accounting_periods ORDER BY period_start DESC
  `);
  res.json(rows);
});

router.post('/periods', ...finAuth, async (req, res) => {
  const { name, period_start, period_end } = req.body;
  if (!name || !period_start || !period_end) return res.status(400).json({ error: 'Name, start, and end required' });
  const { rows } = await query(
    `INSERT INTO fin_accounting_periods (name, period_start, period_end) VALUES ($1,$2,$3) RETURNING *`,
    [name, period_start, period_end]
  );
  await query(`INSERT INTO fin_audit_log (user_id, action, entity_type, entity_id, new_values) VALUES ($1,'create','period',$2,$3)`,
    [userId(req), rows[0].id, JSON.stringify({ name, period_start, period_end })]);
  res.json(rows[0]);
});

router.post('/periods/:id/lock', ...finAuth, async (req, res) => {
  const { rows } = await query(
    `UPDATE fin_accounting_periods SET status='locked', locked_by=$1, locked_at=NOW(), updated_at=NOW() WHERE id=$2 RETURNING *`,
    [userId(req), req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  await query(`INSERT INTO fin_audit_log (user_id, action, entity_type, entity_id, new_values) VALUES ($1,'lock','period',$2,'{"status":"locked"}')`, [userId(req), req.params.id]);
  res.json(rows[0]);
});

router.post('/periods/:id/unlock', ...finAuth, async (req, res) => {
  const { reason } = req.body;
  if (!reason) return res.status(400).json({ error: 'Unlock reason required' });
  const { rows } = await query(
    `UPDATE fin_accounting_periods SET status='open', updated_at=NOW() WHERE id=$1 RETURNING *`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  await query(`INSERT INTO fin_audit_log (user_id, action, entity_type, entity_id, new_values) VALUES ($1,'unlock','period',$2,$3)`,
    [userId(req), req.params.id, JSON.stringify({ status: 'open', reason })]);
  res.json(rows[0]);
});

// ─── Recurring transactions ───
router.get('/recurring', ...finAuth, async (req, res) => {
  const { rows } = await query(`
    SELECT r.*, a.name AS category_name, c.name AS contact_name, b.name AS bank_name
    FROM fin_recurring_transactions r
    LEFT JOIN fin_accounts a ON r.category_account_id = a.id
    LEFT JOIN fin_contacts c ON r.contact_id = c.id
    LEFT JOIN fin_bank_accounts b ON r.bank_account_id = b.id
    WHERE r.is_active = TRUE ORDER BY r.next_run_date
  `);
  res.json(rows);
});

router.post('/recurring', ...finAuth, async (req, res) => {
  const { txn_type, description, amount, frequency, next_run_date, end_date, category_account_id, bank_account_id, contact_id, payment_method, auto_post } = req.body;
  if (!txn_type || !description || !amount || !frequency || !next_run_date) return res.status(400).json({ error: 'Missing required fields' });
  const { rows } = await query(
    `INSERT INTO fin_recurring_transactions (txn_type, description, amount, frequency, next_run_date, end_date, category_account_id, bank_account_id, contact_id, payment_method, auto_post, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [txn_type, description, amount, frequency, next_run_date, end_date || null, category_account_id || null, bank_account_id || null, contact_id || null, payment_method || null, auto_post || false, userId(req)]
  );
  res.json(rows[0]);
});

router.post('/recurring/:id/generate', ...finAuth, async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { rows: rec } = await client.query('SELECT * FROM fin_recurring_transactions WHERE id = $1 AND is_active = TRUE', [req.params.id]);
    if (!rec.length) return res.status(404).json({ error: 'Not found or inactive' });
    const r = rec[0];
    const prefix = TYPE_PREFIX[r.txn_type];
    const txn_ref = await nextRef(client, prefix);
    const status = r.auto_post ? 'posted' : 'draft';
    const { rows: txn } = await client.query(
      `INSERT INTO fin_transactions (txn_ref, txn_type, txn_date, description, amount, currency, contact_id, bank_account_id, category_account_id, payment_method, status, notes, created_by)
       VALUES ($1,$2,CURRENT_DATE,$3,$4,'RWF',$5,$6,$7,$8,$9,'Auto-generated from recurring',$10) RETURNING *`,
      [txn_ref, r.txn_type, r.description, r.amount, r.contact_id, r.bank_account_id, r.category_account_id, r.payment_method, status, userId(req)]
    );
    if (status === 'posted' && r.bank_account_id) {
      const change = r.txn_type === 'income' ? r.amount : -r.amount;
      await client.query('UPDATE fin_bank_accounts SET current_balance = current_balance + $1 WHERE id = $2', [change, r.bank_account_id]);
    }
    let nextDate = new Date(r.next_run_date);
    if (r.frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
    else if (r.frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
    else if (r.frequency === 'quarterly') nextDate.setMonth(nextDate.getMonth() + 3);
    else if (r.frequency === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);
    const isActive = !r.end_date || nextDate <= new Date(r.end_date);
    await client.query(`UPDATE fin_recurring_transactions SET last_run_date=CURRENT_DATE, next_run_date=$1, is_active=$2, updated_at=NOW() WHERE id=$3`, [nextDate.toISOString().slice(0,10), isActive, r.id]);
    await client.query(`INSERT INTO fin_audit_log (user_id, action, entity_type, entity_id, new_values) VALUES ($1,'generate','recurring',$2,$3)`, [userId(req), r.id, JSON.stringify({ txn_ref, amount: r.amount })]);
    await client.query('COMMIT');
    res.json(txn[0]);
  } catch (e) { await client.query('ROLLBACK'); res.status(500).json({ error: e.message }); } finally { client.release(); }
});

router.delete('/recurring/:id', ...finAuth, async (req, res) => {
  const { rows } = await query('UPDATE fin_recurring_transactions SET is_active=FALSE, updated_at=NOW() WHERE id=$1 RETURNING *', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

// ─── Bank reconciliation ───
router.post('/reconciliation/import', ...finAuth, async (req, res) => {
  const { bank_account_id, rows: csvRows } = req.body;
  if (!bank_account_id || !csvRows?.length) return res.status(400).json({ error: 'Bank account and CSV rows required' });
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const imported = [];
    for (const row of csvRows) {
      const { date, description, debit, credit, reference } = row;
      // Bank-statement convention: credit = money in, debit = money out, so a
      // deposit is positive like the ledger balance it's reconciled against.
      const amount = parseFloat(credit || 0) - parseFloat(debit || 0);
      const { rows: dup } = await client.query(
        `SELECT id FROM fin_bank_statement_lines WHERE bank_account_id=$1 AND stmt_date=$2 AND amount=$3 AND reference=$4`,
        [bank_account_id, date, amount, reference || null]
      );
      if (dup.length) continue;
      const { rows: ins } = await client.query(
        `INSERT INTO fin_bank_statement_lines (bank_account_id, stmt_date, description, amount, reference, match_status) VALUES ($1,$2,$3,$4,$5,'unmatched') RETURNING *`,
        [bank_account_id, date, description, amount, reference || null]
      );
      imported.push(ins[0]);
    }
    await client.query('COMMIT');
    res.json({ imported: imported.length, skipped_duplicates: csvRows.length - imported.length, lines: imported });
  } catch (e) { await client.query('ROLLBACK'); res.status(500).json({ error: e.message }); } finally { client.release(); }
});

router.get('/reconciliation/unmatched', ...finAuth, async (req, res) => {
  const { bank_account_id } = req.query;
  if (!bank_account_id) return res.status(400).json({ error: 'bank_account_id required' });
  const [stmtLines, ledgerTxns] = await Promise.all([
    query(`SELECT * FROM fin_bank_statement_lines WHERE bank_account_id=$1 AND match_status='unmatched' ORDER BY stmt_date`, [bank_account_id]),
    query(`SELECT t.* FROM fin_transactions t WHERE t.bank_account_id=$1 AND t.status='posted' AND t.reconciled=FALSE ORDER BY t.txn_date`, [bank_account_id]),
  ]);
  const suggestions = [];
  for (const sl of stmtLines.rows) {
    for (const lt of ledgerTxns.rows) {
      const amtMatch = Math.abs(parseFloat(sl.amount) - parseFloat(lt.amount)) < 0.01 || Math.abs(parseFloat(sl.amount) + parseFloat(lt.amount)) < 0.01;
      const dateClose = Math.abs(new Date(sl.stmt_date) - new Date(lt.txn_date)) <= 3 * 86400000;
      if (amtMatch && dateClose) {
        suggestions.push({ statement_line_id: sl.id, transaction_id: lt.id, confidence: amtMatch && dateClose ? 'high' : 'medium', reason: `Amount match${dateClose ? ' + close date' : ''}` });
      }
    }
  }
  res.json({ statementLines: stmtLines.rows, ledgerTransactions: ledgerTxns.rows, suggestions });
});

router.post('/reconciliation/match', ...finAuth, async (req, res) => {
  const { matches } = req.body;
  if (!matches?.length) return res.status(400).json({ error: 'matches required' });
  const client = await getClient();
  try {
    await client.query('BEGIN');
    for (const m of matches) {
      await client.query(`UPDATE fin_bank_statement_lines SET match_status='matched', matched_transaction_id=$1, updated_at=NOW() WHERE id=$2`, [m.transaction_id, m.statement_line_id]);
      await client.query(`UPDATE fin_transactions SET reconciled=TRUE, updated_at=NOW() WHERE id=$1`, [m.transaction_id]);
    }
    await client.query(`INSERT INTO fin_audit_log (user_id, action, entity_type, entity_id, new_values) VALUES ($1,'reconcile','bank',0,$2)`, [userId(req), JSON.stringify({ matched: matches.length })]);
    await client.query('COMMIT');
    res.json({ success: true, matched: matches.length });
  } catch (e) { await client.query('ROLLBACK'); res.status(500).json({ error: e.message }); } finally { client.release(); }
});

router.get('/reconciliation/summary', ...finAuth, async (req, res) => {
  const { bank_account_id } = req.query;
  if (!bank_account_id) return res.status(400).json({ error: 'bank_account_id required' });
  const [ba, stmtBal, unmatchedStmt, unmatchedLedger] = await Promise.all([
    query('SELECT * FROM fin_bank_accounts WHERE id=$1', [bank_account_id]),
    query(`SELECT COALESCE(SUM(amount),0) AS total FROM fin_bank_statement_lines WHERE bank_account_id=$1`, [bank_account_id]),
    query(`SELECT COUNT(*) AS count, COALESCE(SUM(amount),0) AS total FROM fin_bank_statement_lines WHERE bank_account_id=$1 AND match_status='unmatched'`, [bank_account_id]),
    query(`SELECT COUNT(*) AS count FROM fin_transactions WHERE bank_account_id=$1 AND status='posted' AND reconciled=FALSE`, [bank_account_id]),
  ]);
  const account = ba.rows[0];
  res.json({
    account_name: account?.name,
    ledger_balance: parseFloat(account?.current_balance || 0),
    statement_balance: parseFloat(stmtBal.rows[0].total),
    unmatched_statement_lines: parseInt(unmatchedStmt.rows[0].count),
    unmatched_statement_amount: parseFloat(unmatchedStmt.rows[0].total),
    unmatched_ledger_count: parseInt(unmatchedLedger.rows[0].count),
    difference: parseFloat(account?.current_balance || 0) - parseFloat(stmtBal.rows[0].total),
  });
});

// ─── Balance sheet ───
router.get('/reports/balance-sheet', ...finAuth, async (req, res) => {
  const { rows } = await query(`
    SELECT a.code, a.name, a.account_type,
      COALESCE(SUM(jl.debit), 0) AS total_debit, COALESCE(SUM(jl.credit), 0) AS total_credit,
      CASE WHEN a.normal_balance = 'debit' THEN COALESCE(SUM(jl.debit),0) - COALESCE(SUM(jl.credit),0)
           ELSE COALESCE(SUM(jl.credit),0) - COALESCE(SUM(jl.debit),0) END AS balance
    FROM fin_accounts a LEFT JOIN (fin_journal_lines jl JOIN fin_transactions t ON jl.transaction_id = t.id AND t.status = 'posted')
      ON a.id = jl.account_id
    WHERE a.is_active = TRUE AND a.account_type IN ('asset','liability','equity')
    GROUP BY a.code, a.name, a.account_type, a.normal_balance ORDER BY a.code
  `);
  const assets = rows.filter(r => r.account_type === 'asset');
  const liabilities = rows.filter(r => r.account_type === 'liability');
  const equity = rows.filter(r => r.account_type === 'equity');
  res.json({
    assets, totalAssets: assets.reduce((s,r) => s + parseFloat(r.balance), 0),
    liabilities, totalLiabilities: liabilities.reduce((s,r) => s + parseFloat(r.balance), 0),
    equity, totalEquity: equity.reduce((s,r) => s + parseFloat(r.balance), 0),
  });
});

// ─── Cash flow statement ───
router.get('/reports/cash-flow', ...finAuth, async (req, res) => {
  const { from, to } = req.query;
  const periodStart = from || new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const periodEnd = to || new Date().toISOString().slice(0, 10);
  const [inflows, outflows, byMethod] = await Promise.all([
    query(`SELECT COALESCE(SUM(amount),0) AS total FROM fin_transactions WHERE txn_type='income' AND status='posted' AND txn_date BETWEEN $1 AND $2`, [periodStart, periodEnd]),
    query(`SELECT COALESCE(SUM(amount),0) AS total FROM fin_transactions WHERE txn_type='expense' AND status='posted' AND txn_date BETWEEN $1 AND $2`, [periodStart, periodEnd]),
    query(`SELECT COALESCE(payment_method,'other') AS method, txn_type, COALESCE(SUM(amount),0) AS total FROM fin_transactions WHERE status='posted' AND txn_date BETWEEN $1 AND $2 GROUP BY payment_method, txn_type ORDER BY method`, [periodStart, periodEnd]),
  ]);
  const totalIn = parseFloat(inflows.rows[0].total);
  const totalOut = parseFloat(outflows.rows[0].total);
  res.json({
    period: { from: periodStart, to: periodEnd },
    totalInflows: totalIn, totalOutflows: totalOut, netCashFlow: totalIn - totalOut,
    byPaymentMethod: byMethod.rows,
  });
});

// ─── Invoice line items ───
router.post('/invoices/:id/lines', ...finAuth, async (req, res) => {
  const { lines } = req.body;
  if (!lines?.length) return res.status(400).json({ error: 'Lines required' });
  const client = await getClient();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM fin_invoice_lines WHERE invoice_id = $1', [req.params.id]);
    let subtotal = 0;
    for (const line of lines) {
      const lineTotal = (parseFloat(line.quantity) || 1) * (parseFloat(line.unit_price) || 0);
      subtotal += lineTotal;
      await client.query(
        `INSERT INTO fin_invoice_lines (invoice_id, description, quantity, unit_price, total, account_id) VALUES ($1,$2,$3,$4,$5,$6)`,
        [req.params.id, line.description, line.quantity || 1, line.unit_price || 0, lineTotal, line.account_id || null]
      );
    }
    await client.query(`UPDATE fin_invoices SET subtotal=$1, total_amount=$1+COALESCE(tax_amount,0), outstanding=$1+COALESCE(tax_amount,0)-COALESCE(paid_amount,0), updated_at=NOW() WHERE id=$2`, [subtotal, req.params.id]);
    await client.query('COMMIT');
    const { rows } = await query(`SELECT * FROM fin_invoice_lines WHERE invoice_id=$1 ORDER BY id`, [req.params.id]);
    res.json(rows);
  } catch (e) { await client.query('ROLLBACK'); res.status(500).json({ error: e.message }); } finally { client.release(); }
});

// ─── Transaction edit (draft/pending only) ───
router.put('/transactions/:id', ...finAuth, async (req, res) => {
  const { rows: existing } = await query('SELECT * FROM fin_transactions WHERE id = $1', [req.params.id]);
  if (!existing.length) return res.status(404).json({ error: 'Not found' });
  if (!['draft', 'pending_approval'].includes(existing[0].status)) return res.status(400).json({ error: 'Only draft or pending transactions can be edited' });
  const { txn_date, description, amount, category_account_id, bank_account_id, contact_id, payment_method, external_ref, notes, project_id, department_id } = req.body;
  const { rows } = await query(`
    UPDATE fin_transactions SET txn_date=COALESCE($1,txn_date), description=COALESCE($2,description), amount=COALESCE($3,amount),
      category_account_id=COALESCE($4,category_account_id), bank_account_id=COALESCE($5,bank_account_id), contact_id=COALESCE($6,contact_id),
      payment_method=COALESCE($7,payment_method), external_ref=COALESCE($8,external_ref), notes=COALESCE($9,notes),
      project_id=COALESCE($10,project_id), department_id=COALESCE($11,department_id), updated_at=NOW()
    WHERE id=$12 RETURNING *
  `, [txn_date, description, amount ? parseFloat(amount) : null, category_account_id, bank_account_id, contact_id, payment_method, external_ref, notes, project_id, department_id, req.params.id]);
  await query(`INSERT INTO fin_audit_log (user_id, action, entity_type, entity_id, new_values) VALUES ($1,'edit','transaction',$2,$3)`,
    [userId(req), req.params.id, JSON.stringify({ description, amount })]);
  res.json(rows[0]);
});

// ─── Transfer (source → destination, no income/expense) ───
router.post('/transactions/transfer', ...finAuth, async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { txn_date, description, amount, source_bank_id, destination_bank_id, reference, notes } = req.body;
    if (!txn_date || !description || !amount || !source_bank_id || !destination_bank_id) return res.status(400).json({ error: 'Date, description, amount, source and destination required' });
    if (source_bank_id === destination_bank_id) return res.status(400).json({ error: 'Source and destination must be different' });

    const { rows: lockedP } = await client.query(`SELECT id FROM fin_accounting_periods WHERE status='locked' AND $1::date BETWEEN period_start AND period_end LIMIT 1`, [txn_date]);
    if (lockedP.length) return res.status(400).json({ error: 'Cannot create transaction in a locked accounting period' });

    const txn_ref = await nextRef(client, 'TRF');
    const { rows } = await client.query(
      `INSERT INTO fin_transactions (txn_ref, txn_type, txn_date, description, amount, currency, bank_account_id, external_ref, notes, status, created_by)
       VALUES ($1,'transfer',$2,$3,$4,'RWF',$5,$6,$7,'posted',$8) RETURNING *`,
      [txn_ref, txn_date, description, parseFloat(amount), source_bank_id, reference, notes, userId(req)]
    );
    const txn = rows[0];
    await client.query('UPDATE fin_bank_accounts SET current_balance = current_balance - $1 WHERE id = $2', [parseFloat(amount), source_bank_id]);
    await client.query('UPDATE fin_bank_accounts SET current_balance = current_balance + $1 WHERE id = $2', [parseFloat(amount), destination_bank_id]);

    const [srcBA, dstBA] = await Promise.all([
      client.query('SELECT ledger_account_id FROM fin_bank_accounts WHERE id=$1', [source_bank_id]),
      client.query('SELECT ledger_account_id FROM fin_bank_accounts WHERE id=$1', [destination_bank_id]),
    ]);
    const srcLedger = srcBA.rows[0]?.ledger_account_id;
    const dstLedger = dstBA.rows[0]?.ledger_account_id;
    if (srcLedger && dstLedger) {
      await client.query(`INSERT INTO fin_journal_lines (transaction_id, account_id, debit, credit) VALUES ($1,$2,$3,0),($1,$4,0,$3)`, [txn.id, dstLedger, parseFloat(amount), srcLedger]);
    }
    await client.query(`UPDATE fin_transactions SET posted_at=NOW() WHERE id=$1`, [txn.id]);
    await client.query(`INSERT INTO fin_audit_log (user_id, action, entity_type, entity_id, new_values) VALUES ($1,'create','transfer',$2,$3)`,
      [userId(req), txn.id, JSON.stringify({ txn_ref, amount, source_bank_id, destination_bank_id })]);
    await client.query('COMMIT');
    res.json(txn);
  } catch (e) { await client.query('ROLLBACK'); res.status(500).json({ error: e.message }); } finally { client.release(); }
});

// ─── Journal entry (balanced debit/credit lines) ───
router.post('/transactions/journal', ...finAuth, async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { txn_date, description, lines, notes, status = 'draft' } = req.body;
    if (!txn_date || !description || !lines?.length) return res.status(400).json({ error: 'Date, description, and journal lines required' });

    const { rows: lockedP } = await client.query(`SELECT id FROM fin_accounting_periods WHERE status='locked' AND $1::date BETWEEN period_start AND period_end LIMIT 1`, [txn_date]);
    if (lockedP.length) return res.status(400).json({ error: 'Cannot create transaction in a locked accounting period' });

    const totalDebit = lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
    const totalCredit = lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
    if (Math.abs(totalDebit - totalCredit) > 0.01) return res.status(400).json({ error: `Journal must balance. Debits: ${totalDebit}, Credits: ${totalCredit}` });

    const txn_ref = await nextRef(client, 'JNL');
    const { rows } = await client.query(
      `INSERT INTO fin_transactions (txn_ref, txn_type, txn_date, description, amount, currency, status, notes, created_by)
       VALUES ($1,'journal',$2,$3,$4,'RWF',$5,$6,$7) RETURNING *`,
      [txn_ref, txn_date, description, totalDebit, status, notes, userId(req)]
    );
    const txn = rows[0];
    for (const line of lines) {
      await client.query(`INSERT INTO fin_journal_lines (transaction_id, account_id, debit, credit, description) VALUES ($1,$2,$3,$4,$5)`,
        [txn.id, line.account_id, parseFloat(line.debit) || 0, parseFloat(line.credit) || 0, line.description || null]);
    }
    if (status === 'posted') await client.query(`UPDATE fin_transactions SET posted_at=NOW() WHERE id=$1`, [txn.id]);
    await client.query(`INSERT INTO fin_audit_log (user_id, action, entity_type, entity_id, new_values) VALUES ($1,'create','journal',$2,$3)`,
      [userId(req), txn.id, JSON.stringify({ txn_ref, totalDebit, lines: lines.length })]);
    await client.query('COMMIT');
    res.json(txn);
  } catch (e) { await client.query('ROLLBACK'); res.status(500).json({ error: e.message }); } finally { client.release(); }
});

// ─── Document attachments ───
router.get('/documents', ...finAuth, async (req, res) => {
  const { transaction_id, invoice_id, project_id } = req.query;
  let where = 'WHERE 1=1';
  const params = [];
  if (transaction_id) { params.push(transaction_id); where += ` AND d.transaction_id = $${params.length}`; }
  if (invoice_id) { params.push(invoice_id); where += ` AND d.invoice_id = $${params.length}`; }
  if (project_id) { params.push(project_id); where += ` AND d.project_id = $${params.length}`; }
  const { rows } = await query(`SELECT d.*, COALESCE(u.first_name || ' ' || u.last_name, u.email) AS uploader_name FROM fin_documents d LEFT JOIN users u ON u.id::text = d.uploaded_by::text ${where} ORDER BY d.created_at DESC`, params);
  res.json(rows);
});

router.post('/documents', ...finAuth, async (req, res) => {
  const { file_name, file_url, file_type, file_size, transaction_id, invoice_id, project_id, description } = req.body;
  if (!file_name || !file_url) return res.status(400).json({ error: 'file_name and file_url required' });
  const { rows } = await query(
    `INSERT INTO fin_documents (file_name, file_url, file_type, file_size, transaction_id, invoice_id, project_id, uploaded_by, description)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [file_name, file_url, file_type || null, file_size || null, transaction_id || null, invoice_id || null, project_id || null, userId(req), description || null]
  );
  await query(`INSERT INTO fin_audit_log (user_id, action, entity_type, entity_id, new_values) VALUES ($1,'upload_document','document',$2,$3)`,
    [userId(req), rows[0].id, JSON.stringify({ file_name, transaction_id, invoice_id })]);
  res.json(rows[0]);
});

router.delete('/documents/:id', ...finAuth, async (req, res) => {
  const { rows } = await query(`DELETE FROM fin_documents WHERE id = $1 RETURNING *`, [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Document not found' });
  await query(`INSERT INTO fin_audit_log (user_id, action, entity_type, entity_id, old_values) VALUES ($1,'delete_document','document',$2,$3)`,
    [userId(req), req.params.id, JSON.stringify({ file_name: rows[0].file_name })]);
  res.json({ success: true });
});

// ─── XLSX / bulk transaction import ───
router.post('/import/transactions', ...finAuth, async (req, res) => {
  const { rows: txnRows } = req.body;
  if (!Array.isArray(txnRows) || txnRows.length === 0) return res.status(400).json({ error: 'rows array required' });
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const created = [];
    for (const row of txnRows) {
      const type = (row.type || row.txn_type || 'expense').toLowerCase();
      const prefix = TYPE_PREFIX[type] || 'EXP';
      const ref = await nextRef(client, prefix);
      const amount = parseFloat(row.amount) || 0;
      if (amount <= 0) continue;
      const { rows } = await client.query(
        `INSERT INTO fin_transactions (txn_ref, txn_type, txn_date, description, amount, currency, payment_method, external_ref, status, created_by)
         VALUES ($1,$2,$3,$4,$5,'RWF',$6,$7,$8,$9) RETURNING *`,
        [ref, type, row.date || new Date().toISOString().slice(0,10), row.description || '', amount,
         row.payment_method || null, row.reference || null, row.auto_post ? 'posted' : 'draft', userId(req)]
      );
      if (row.auto_post) await client.query(`UPDATE fin_transactions SET posted_at=NOW() WHERE id=$1`, [rows[0].id]);
      created.push(rows[0]);
    }
    await client.query(`INSERT INTO fin_audit_log (user_id, action, entity_type, entity_id, new_values) VALUES ($1,'bulk_import','transactions',0,$2)`,
      [userId(req), JSON.stringify({ count: created.length })]);
    await client.query('COMMIT');
    res.json({ imported: created.length, transactions: created });
  } catch (e) { await client.query('ROLLBACK'); res.status(500).json({ error: e.message }); } finally { client.release(); }
});

// ─── Approval thresholds ───
router.get('/approval-thresholds', ...finAuth, async (req, res) => {
  const { rows } = await query(`SELECT * FROM fin_approval_thresholds ORDER BY min_amount ASC`);
  res.json(rows);
});

router.post('/approval-thresholds', ...finAuth, async (req, res) => {
  const { txn_type, min_amount, max_amount, required_role, description } = req.body;
  if (min_amount == null) return res.status(400).json({ error: 'min_amount required' });
  const { rows } = await query(
    `INSERT INTO fin_approval_thresholds (txn_type, min_amount, max_amount, required_role, description, created_by)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [txn_type || 'all', min_amount, max_amount || null, required_role || 'finance', description || null, userId(req)]
  );
  await query(`INSERT INTO fin_audit_log (user_id, action, entity_type, entity_id, new_values) VALUES ($1,'create','approval_threshold',$2,$3)`,
    [userId(req), rows[0].id, JSON.stringify(rows[0])]);
  res.json(rows[0]);
});

router.put('/approval-thresholds/:id', ...finAuth, async (req, res) => {
  const { txn_type, min_amount, max_amount, required_role, description, is_active } = req.body;
  const { rows } = await query(
    `UPDATE fin_approval_thresholds SET txn_type=COALESCE($1,txn_type), min_amount=COALESCE($2,min_amount),
     max_amount=$3, required_role=COALESCE($4,required_role), description=$5, is_active=COALESCE($6,is_active)
     WHERE id=$7 RETURNING *`,
    [txn_type, min_amount, max_amount || null, required_role, description || null, is_active, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Threshold not found' });
  res.json(rows[0]);
});

router.delete('/approval-thresholds/:id', ...finAuth, async (req, res) => {
  await query(`DELETE FROM fin_approval_thresholds WHERE id = $1`, [req.params.id]);
  res.json({ success: true });
});

// ─── Finance notifications (insert helpers) ───
router.get('/finance-notifications', ...finAuth, async (req, res) => {
  const uid = userId(req);
  const { rows } = await query(
    `SELECT * FROM notifications WHERE user_id = $1 AND type LIKE 'finance_%' ORDER BY created_at DESC LIMIT 50`,
    [uid]
  );
  res.json(rows);
});

router.post('/finance-notifications/check', ...finAuth, async (req, res) => {
  const uid = userId(req);
  const now = new Date().toISOString().slice(0, 10);
  const inserted = [];

  // Everything already alerted in the last day, loaded once instead of per item.
  const { rows: recent } = await query(
    `SELECT type, data->>'invoice_id' AS invoice_id, data->>'budget_id' AS budget_id FROM notifications
     WHERE user_id=$1 AND type IN ('finance_overdue','finance_budget') AND created_at > NOW() - INTERVAL '1 day'`,
    [uid]
  );
  const alerted = new Set(recent.map((n) => (n.type === 'finance_overdue' ? `inv:${n.invoice_id}` : `bud:${n.budget_id}`)));

  // Overdue invoices
  const { rows: overdue } = await query(
    `SELECT id, invoice_number, contact_id, outstanding, due_date FROM fin_invoices
     WHERE status IN ('sent','partially_paid') AND due_date < $1 AND outstanding > 0`, [now]
  );
  for (const inv of overdue) {
    if (!alerted.has(`inv:${inv.id}`)) {
      alerted.add(`inv:${inv.id}`);
      await query(
        `INSERT INTO notifications (id, user_id, title, body, type, data) VALUES (gen_random_uuid(), $1, $2, $3, 'finance_overdue', $4)`,
        [uid, `Invoice ${inv.invoice_number} overdue`, `Outstanding: RWF ${Number(inv.outstanding).toLocaleString()}. Due: ${inv.due_date}`,
         JSON.stringify({ invoice_id: String(inv.id) })]
      );
      inserted.push(inv.invoice_number);
    }
  }

  // Budget alerts (over 90% spent)
  const { rows: budgetAlerts } = await query(
    `SELECT b.id, b.name, bl.account_id, bl.approved_amount, a.name AS account_name,
       COALESCE((SELECT SUM(t.amount) FROM fin_transactions t WHERE t.category_account_id = bl.account_id AND t.status='posted' AND t.txn_type='expense'), 0) AS spent
     FROM fin_budgets b JOIN fin_budget_lines bl ON bl.budget_id=b.id JOIN fin_accounts a ON a.id=bl.account_id
     WHERE b.status='active' AND bl.approved_amount > 0`
  );
  for (const ba of budgetAlerts) {
    const pct = (ba.spent / ba.approved_amount) * 100;
    if (pct >= 90) {
      if (!alerted.has(`bud:${ba.id}`)) {
        alerted.add(`bud:${ba.id}`);
        await query(
          `INSERT INTO notifications (id, user_id, title, body, type, data) VALUES (gen_random_uuid(), $1, $2, $3, 'finance_budget', $4)`,
          [uid, `Budget alert: ${ba.account_name}`, `${Math.round(pct)}% of budget used (${ba.name})`,
           JSON.stringify({ budget_id: String(ba.id) })]
        );
        inserted.push(`budget:${ba.name}`);
      }
    }
  }

  // Pending approvals reminder
  const { rows: pending } = await query(
    `SELECT COUNT(*) AS cnt FROM fin_transactions WHERE status='pending_approval'`
  );
  if (parseInt(pending[0].cnt) > 0) {
    const exists = await query(
      `SELECT 1 FROM notifications WHERE user_id=$1 AND type='finance_approval' AND created_at > NOW() - INTERVAL '4 hours'`,
      [uid]
    );
    if (!exists.rows.length) {
      await query(
        `INSERT INTO notifications (id, user_id, title, body, type, data) VALUES (gen_random_uuid(), $1, $2, $3, 'finance_approval', '{}')`,
        [uid, `${pending[0].cnt} transactions awaiting approval`, 'Review and approve pending transactions']
      );
      inserted.push(`pending:${pending[0].cnt}`);
    }
  }

  res.json({ checked: true, notifications_created: inserted.length, details: inserted });
});

module.exports = router;
