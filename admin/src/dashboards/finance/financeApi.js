/**
 * financeApi.js — every call the finance dashboard makes, in one place.
 * Sections import these instead of building URLs themselves.
 */
import { apiFetch, apiDownload } from '../../api';

const get = (p) => apiFetch(`/finance${p}`);
const post = (p, body) => apiFetch(`/finance${p}`, { method: 'POST', body: body ?? {} });
const put = (p, body) => apiFetch(`/finance${p}`, { method: 'PUT', body });
const del = (p) => apiFetch(`/finance${p}`, { method: 'DELETE' });
const qs = (o) => new URLSearchParams(Object.entries(o).filter(([, v]) => v !== undefined && v !== '' && v !== null)).toString();

export const financeApi = {
  // dashboard
  summary: ({ from, to }) => get(`/dashboard/summary?${qs({ from, to })}`),
  alerts: () => get('/dashboard/alerts'),
  search: (q) => get(`/search?${qs({ q })}`),

  // lookups
  accounts: () => get('/accounts'),
  bankAccounts: () => get('/bank-accounts'),
  departments: () => get('/departments'),
  contacts: () => get('/contacts'),
  projectsAll: () => get('/projects/all'),

  // transactions
  transactions: (filters) => get(`/transactions?${qs(filters)}`),
  checkDuplicate: (type, amount, date) => get(`/check-duplicate?${qs({ type, amount, date })}`),
  createTransaction: (body) => post('/transactions', body),
  updateTransaction: (id, body) => put(`/transactions/${id}`, body),
  submitTransaction: (id) => post(`/transactions/${id}/submit`),
  approveTransaction: (id) => post(`/transactions/${id}/approve`),
  postTransaction: (id) => post(`/transactions/${id}/post`),
  voidTransaction: (id, reason) => post(`/transactions/${id}/void`, { reason }),
  createTransfer: (body) => post('/transactions/transfer', body),
  createJournal: (body) => post('/transactions/journal', body),
  approvals: () => get('/approvals'),

  // invoices
  invoices: (filters) => get(`/invoices?${qs(filters || {})}`),
  createInvoice: (body) => post('/invoices', body),
  payInvoice: (id, body) => post(`/invoices/${id}/pay`, body),

  // contacts
  createContact: (body) => post('/contacts', body),
  updateContact: (id, body) => put(`/contacts/${id}`, body),

  // budgets
  budgets: () => get('/budgets'),
  budget: (id) => get(`/budgets/${id}`),
  createBudget: (body) => post('/budgets', body),
  approveBudget: (id) => post(`/budgets/${id}/approve`),
  activateBudget: (id) => post(`/budgets/${id}/activate`),

  // reports + exports
  report: (key, { from, to }) => get(`/reports/${key}?${qs({ from, to })}`),
  exportReport: (key, { from, to }) =>
    apiDownload(`/finance/export/report/${key}?${qs({ from, to })}`, `${key}_${from}_${to}.csv`),
  exportTransactions: ({ from, to }) =>
    apiDownload(`/finance/export/transactions?${qs({ from, to })}`, `transactions_${from}_${to}.csv`),
  importTransactions: (rows) => post('/import/transactions', { rows }),

  // recurring
  recurring: () => get('/recurring'),
  createRecurring: (body) => post('/recurring', body),
  runRecurring: (id) => post(`/recurring/${id}/generate`),
  deleteRecurring: (id) => del(`/recurring/${id}`),

  // reconciliation
  reconUnmatched: (bankId) => get(`/reconciliation/unmatched?${qs({ bank_account_id: bankId })}`),
  reconSummary: (bankId) => get(`/reconciliation/summary?${qs({ bank_account_id: bankId })}`),
  reconImport: (bankId, rows) => post('/reconciliation/import', { bank_account_id: parseInt(bankId, 10), rows }),
  reconMatch: (matches) => post('/reconciliation/match', { matches }),

  // documents
  documents: () => get('/documents'),
  createDocument: (body) => post('/documents', body),
  deleteDocument: (id) => del(`/documents/${id}`),

  // alerts
  financeNotifications: () => get('/finance-notifications'),
  checkFinanceNotifications: () => post('/finance-notifications/check'),
  markNotificationRead: (id) => apiFetch(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => apiFetch('/notifications/read-all', { method: 'PUT' }),

  // settings
  organization: () => get('/organization'),
  saveOrganization: (body) => put('/organization', body),
  createAccount: (body) => post('/accounts', body),
  updateAccount: (id, body) => put(`/accounts/${id}`, body),
  createBankAccount: (body) => post('/bank-accounts', body),
  createDepartment: (body) => post('/departments', body),
  createProject: (body) => post('/projects', body),
  updateProject: (id, body) => put(`/projects/${id}`, body),
  periods: () => get('/periods'),
  createPeriod: (body) => post('/periods', body),
  lockPeriod: (id) => post(`/periods/${id}/lock`),
  unlockPeriod: (id, reason) => post(`/periods/${id}/unlock`, { reason }),
  thresholds: () => get('/approval-thresholds'),
  createThreshold: (body) => post('/approval-thresholds', body),
  updateThreshold: (id, body) => put(`/approval-thresholds/${id}`, body),
  deleteThreshold: (id) => del(`/approval-thresholds/${id}`),
  auditLog: (limit = 50) => get(`/audit-log?${qs({ limit })}`),
};
