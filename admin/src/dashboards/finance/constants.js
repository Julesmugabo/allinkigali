/**
 * constants.js — finance dashboard vocabulary: sections (sidebar order),
 * period presets, transaction tabs, report catalogue, payment methods and
 * status colours. Mirrors the original in-app finance module.
 */
export const FIN = {
  income: '#34D399',
  expense: '#F87171',
  warning: '#FBBF24',
  primary: '#60A5FA',
  purple: '#A78BFA',
  muted: '#94A3B8',
};

export const SECTIONS = [
  { key: 'overview', label: 'Overview' },
  { key: 'transactions', label: 'Transactions' },
  { key: 'invoices', label: 'Invoices' },
  { key: 'income', label: 'Income' },
  { key: 'expenses', label: 'Expenses' },
  { key: 'approvals', label: 'Approvals' },
  { key: 'budgets', label: 'Budgets' },
  { key: 'reports', label: 'Reports' },
  { key: 'reconciliation', label: 'Bank Recon' },
  { key: 'recurring', label: 'Recurring' },
  { key: 'contacts', label: 'Contacts' },
  { key: 'documents', label: 'Documents' },
  { key: 'import', label: 'Import / Export' },
  { key: 'alerts', label: 'Alerts' },
  { key: 'settings', label: 'Settings' },
];

export const PERIOD_OPTIONS = [
  { key: 'this_month', label: 'This Month' },
  { key: 'last_month', label: 'Last Month' },
  { key: 'this_quarter', label: 'This Quarter' },
  { key: 'this_year', label: 'This Year' },
  { key: 'custom', label: 'Custom' },
];

export const TXN_TABS = [
  { key: 'all', label: 'All' },
  { key: 'income', label: 'Income' },
  { key: 'expense', label: 'Expenses' },
  { key: 'transfer', label: 'Transfers' },
  { key: 'draft', label: 'Draft' },
  { key: 'pending', label: 'Pending' },
  { key: 'posted', label: 'Posted' },
];

export const REPORT_TYPES = [
  { key: 'income-expenditure', label: 'Income & Expenditure', desc: 'Revenue minus expenses for the period', csv: true },
  { key: 'trial-balance', label: 'Trial Balance', desc: 'All account balances', csv: true },
  { key: 'receivables-aging', label: 'Receivables Aging', desc: 'Outstanding customer invoices by age' },
  { key: 'payables-aging', label: 'Payables Aging', desc: 'Outstanding supplier bills by age' },
  { key: 'balance-sheet', label: 'Balance Sheet', desc: 'Assets, liabilities & equity' },
  { key: 'cash-flow', label: 'Cash Flow', desc: 'Inflows, outflows and net movement' },
];

export const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cash', label: 'Cash' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'card', label: 'Card' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'other', label: 'Other' },
];

export const CONTACT_TYPES = [
  { value: 'supplier', label: 'Supplier' },
  { value: 'customer', label: 'Customer' },
  { value: 'donor', label: 'Donor' },
  { value: 'employee', label: 'Employee' },
  { value: 'other', label: 'Other' },
];

export const ACCOUNT_TYPES = [
  { value: 'asset', label: 'Asset' },
  { value: 'liability', label: 'Liability' },
  { value: 'equity', label: 'Equity' },
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
];

export const STATUS_COLOR = {
  draft: '#94A3B8',
  pending_approval: '#FBBF24',
  approved: '#60A5FA',
  posted: '#34D399',
  rejected: '#F87171',
  voided: '#64748B',
  paid: '#34D399',
  partially_paid: '#FBBF24',
  sent: '#60A5FA',
  overdue: '#F87171',
  active: '#34D399',
  inactive: '#64748B',
  open: '#34D399',
  locked: '#F87171',
  closed: '#64748B',
};

// Local calendar date (YYYY-MM-DD). toISOString() would give the UTC date,
// which is still "yesterday" in Kigali between midnight and 2am.
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
