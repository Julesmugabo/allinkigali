/**
 * FinanceDashboardScreen.js — Ububiko bw'imari (Finance dashboard shell).
 *
 * Thin orchestrator that owns all state, fetch helpers, and action handlers
 * for the finance module. Each sidebar segment (Overview, Transactions,
 * Invoices, etc.) is rendered by a dedicated section component imported from
 * sibling files. State is passed down via a shared `ctx` object.
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput,
  useWindowDimensions, ActivityIndicator, Platform,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../../../components/common/GradientBackground';
import AdminSidebar, { SIDEBAR_BREAKPOINT } from '../../../components/admin/AdminSidebar';
import { colors, spacing } from '../../../theme';
import { apiFetch } from '../../../services/apiClient';

import {
  FIN, SEGMENTS,
  formatRWF, alertMsg, s,
} from './FinanceShared';

import FinanceOverview from './FinanceOverview';
import { TransactionsSection, TxnModal, TransferModal, JournalModal } from './FinanceTransactions';
import { InvoicesSection, InvoiceModal, PayModal } from './FinanceInvoices';
import FinanceApprovals from './FinanceApprovals';
import FinanceIncome from './FinanceIncome';
import FinanceExpenses from './FinanceExpenses';
import { BudgetsSection, BudgetModal } from './FinanceBudgets';
import FinanceReports from './FinanceReports';
import FinanceReconciliation from './FinanceReconciliation';
import { RecurringSection, RecurringModal } from './FinanceRecurring';
import { ContactsSection, ContactModal } from './FinanceContacts';
import { SettingsSection, AccountModal, ProjectModal } from './FinanceSettings';
import FinanceDocuments from './FinanceDocuments';
import FinanceImportExport from './FinanceImportExport';
import FinanceNotifications from './FinanceNotifications';

export default function FinanceDashboardScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const wide = width >= SIDEBAR_BREAKPOINT;

  const [segment, setSegment] = useState('overview');
  const [period, setPeriod] = useState('this_month');

  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [txnLoading, setTxnLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [txnTab, setTxnTab] = useState('all');
  const [txnSearch, setTxnSearch] = useState('');

  const [showTxnModal, setShowTxnModal] = useState(false);
  const [txnType, setTxnType] = useState('income');
  const [txnForm, setTxnForm] = useState({ txn_date: new Date().toISOString().slice(0, 10), description: '', amount: '', category_account_id: '', bank_account_id: '', payment_method: '', contact_id: '', external_ref: '', notes: '', status: 'draft' });
  const [txnSaving, setTxnSaving] = useState(false);
  const [editingTxnId, setEditingTxnId] = useState(null);

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferForm, setTransferForm] = useState({ txn_date: new Date().toISOString().slice(0, 10), description: '', amount: '', source_bank_id: '', destination_bank_id: '', reference: '', notes: '' });
  const [transferSaving, setTransferSaving] = useState(false);

  const [showJournalModal, setShowJournalModal] = useState(false);
  const [journalForm, setJournalForm] = useState({ txn_date: new Date().toISOString().slice(0, 10), description: '', notes: '', status: 'draft', lines: [{ account_id: '', debit: '', credit: '', description: '' }, { account_id: '', debit: '', credit: '', description: '' }] });
  const [journalSaving, setJournalSaving] = useState(false);

  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [editingContact, setEditingContact] = useState(null);

  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', contact_type: 'supplier', email: '', phone: '', payment_terms_days: '30' });
  const [contactSaving, setContactSaving] = useState(false);

  const [selectedReport, setSelectedReport] = useState(null);

  const [invoices, setInvoices] = useState([]);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({ invoice_number: '', invoice_type: 'receivable', contact_id: '', invoice_date: new Date().toISOString().slice(0, 10), due_date: '', total_amount: '', tax_amount: '0', description: '' });
  const [invoiceSaving, setInvoiceSaving] = useState(false);
  const [invoiceTab, setInvoiceTab] = useState('all');
  const [showPayModal, setShowPayModal] = useState(false);
  const [payInvoice, setPayInvoice] = useState(null);
  const [payForm, setPayForm] = useState({ amount: '', payment_date: new Date().toISOString().slice(0, 10), payment_method: '', reference: '' });
  const [paySaving, setPaySaving] = useState(false);

  const [approvals, setApprovals] = useState([]);
  const [approvalsLoading, setApprovalsLoading] = useState(false);

  const [globalSearch, setGlobalSearch] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);

  const [settingsView, setSettingsView] = useState('menu');
  const [orgProfile, setOrgProfile] = useState(null);
  const [orgSaving, setOrgSaving] = useState(false);

  const [projects, setProjects] = useState([]);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projectForm, setProjectForm] = useState({ code: '', name: '', description: '', approved_amount: '', start_date: '', end_date: '' });
  const [projectSaving, setProjectSaving] = useState(false);

  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountForm, setAccountForm] = useState({ code: '', name: '', account_type: 'expense', description: '' });
  const [accountSaving, setAccountSaving] = useState(false);

  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetForm, setBudgetForm] = useState({ name: '', fiscal_year: new Date().getFullYear().toString(), department_id: '', lines: [] });
  const [budgetSaving, setBudgetSaving] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [budgetDetail, setBudgetDetail] = useState(null);

  const [recurringTxns, setRecurringTxns] = useState([]);
  const [recurringLoading, setRecurringLoading] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [recurringForm, setRecurringForm] = useState({ txn_type: 'expense', description: '', amount: '', frequency: 'monthly', next_run_date: '', end_date: '', category_account_id: '', bank_account_id: '', contact_id: '', payment_method: '', auto_post: false });
  const [recurringSaving, setRecurringSaving] = useState(false);

  const [reconBank, setReconBank] = useState('');
  const [reconData, setReconData] = useState(null);
  const [reconLoading, setReconLoading] = useState(false);
  const [reconSummary, setReconSummary] = useState(null);
  const [csvText, setCsvText] = useState('');

  const [periods, setPeriods] = useState([]);
  const [periodsLoading, setPeriodsLoading] = useState(false);

  /* ─── Period → date params ─── */
  const periodParams = useMemo(() => {
    const now = new Date();
    let start, end;
    if (period === 'this_month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (period === 'last_month') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
    } else if (period === 'this_quarter') {
      const q = Math.floor(now.getMonth() / 3) * 3;
      start = new Date(now.getFullYear(), q, 1);
      end = new Date(now.getFullYear(), q + 3, 0);
    } else if (period === 'custom' && customFrom && customTo) {
      start = new Date(customFrom);
      end = new Date(customTo);
    } else {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31);
    }
    return { start_date: start.toISOString().slice(0, 10), end_date: end.toISOString().slice(0, 10) };
  }, [period, customFrom, customTo]);

  /* ─── Fetch helpers ─── */
  const fetchSummary = useCallback(async () => {
    try {
      const data = await apiFetch(`/finance/dashboard/summary?from=${periodParams.start_date}&to=${periodParams.end_date}`);
      const c = data?.cards || {};
      setSummary({ cash_balance: c.cashBank || 0, total_income: c.income || 0, total_expenses: c.expenses || 0, receivables: c.receivables || 0, payables: c.payables || 0 });
    } catch { setSummary(null); }
  }, [periodParams]);

  const fetchAlerts = useCallback(async () => {
    try {
      const data = await apiFetch('/finance/dashboard/alerts');
      const items = [];
      if (data?.overdueReceivables?.count > 0) items.push({ message: `${data.overdueReceivables.count} overdue receivable(s) totaling ${formatRWF(data.overdueReceivables.total)}` });
      if (data?.overduePayables?.count > 0) items.push({ message: `${data.overduePayables.count} overdue payable(s) totaling ${formatRWF(data.overduePayables.total)}` });
      if (data?.pendingApprovals > 0) items.push({ message: `${data.pendingApprovals} transaction(s) pending approval` });
      setAlerts(items);
    } catch { setAlerts([]); }
  }, []);

  const fetchTransactions = useCallback(async (filters = {}) => {
    setTxnLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.type && filters.type !== 'all') params.set('type', filters.type);
      if (filters.status) params.set('status', filters.status);
      if (filters.search) params.set('search', filters.search);
      params.set('start_date', periodParams.start_date);
      params.set('end_date', periodParams.end_date);
      const data = await apiFetch(`/finance/transactions?${params}`);
      setTransactions(data?.transactions || []);
    } catch { setTransactions([]); }
    setTxnLoading(false);
  }, [periodParams]);

  const fetchLookups = useCallback(async () => {
    try {
      const [acc, bank, dept, cont] = await Promise.all([
        apiFetch('/finance/accounts').catch(() => []),
        apiFetch('/finance/bank-accounts').catch(() => []),
        apiFetch('/finance/departments').catch(() => []),
        apiFetch('/finance/contacts').catch(() => []),
      ]);
      setAccounts(acc || []); setBankAccounts(bank || []); setDepartments(dept || []); setContacts(cont || []);
    } catch {}
  }, []);

  const fetchBudgets = useCallback(async () => { try { const data = await apiFetch('/finance/budgets'); setBudgets(data || []); } catch { setBudgets([]); } }, []);

  const fetchInvoices = useCallback(async (filters = {}) => {
    setInvoiceLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.type) params.set('type', filters.type);
      if (filters.status) params.set('status', filters.status);
      const data = await apiFetch(`/finance/invoices?${params}`);
      setInvoices(Array.isArray(data) ? data : []);
    } catch { setInvoices([]); }
    setInvoiceLoading(false);
  }, []);

  const fetchApprovals = useCallback(async () => {
    setApprovalsLoading(true);
    try { const data = await apiFetch('/finance/approvals'); setApprovals(Array.isArray(data) ? data : []); }
    catch { setApprovals([]); }
    setApprovalsLoading(false);
  }, []);

  const fetchBudgetDetail = useCallback(async (id) => { try { const data = await apiFetch(`/finance/budgets/${id}`); setBudgetDetail(data); } catch { setBudgetDetail(null); } }, []);

  const fetchProjects = useCallback(async () => { try { const data = await apiFetch('/finance/projects/all'); setProjects(Array.isArray(data) ? data : []); } catch { setProjects([]); } }, []);

  const fetchOrgProfile = useCallback(async () => { try { const data = await apiFetch('/finance/organization'); setOrgProfile(data); } catch { setOrgProfile(null); } }, []);

  async function fetchRecurring() {
    setRecurringLoading(true);
    try { const d = await apiFetch('/finance/recurring'); setRecurringTxns(d); } catch (e) { console.warn(e); }
    setRecurringLoading(false);
  }

  async function fetchReconData() {
    if (!reconBank) return;
    setReconLoading(true);
    try {
      const [data, summary] = await Promise.all([
        apiFetch(`/finance/reconciliation/unmatched?bank_account_id=${reconBank}`),
        apiFetch(`/finance/reconciliation/summary?bank_account_id=${reconBank}`),
      ]);
      setReconData(data); setReconSummary(summary);
    } catch (e) { alertMsg('Error', e.message); }
    setReconLoading(false);
  }

  async function fetchPeriods() {
    setPeriodsLoading(true);
    try { const d = await apiFetch('/finance/periods'); setPeriods(d); } catch (e) { console.warn(e); }
    setPeriodsLoading(false);
  }

  function buildTxnFilters() {
    const f = {};
    if (['income', 'expense', 'transfer'].includes(txnTab)) f.type = txnTab;
    else if (txnTab === 'draft') f.status = 'draft';
    else if (txnTab === 'pending') f.status = 'pending_approval';
    else if (txnTab === 'posted') f.status = 'posted';
    if (txnSearch) f.search = txnSearch;
    return f;
  }

  /* ─── Action handlers ─── */
  function resetTxnForm() {
    setTxnForm({ txn_date: new Date().toISOString().slice(0, 10), description: '', amount: '', category_account_id: '', bank_account_id: '', payment_method: '', contact_id: '', external_ref: '', notes: '', status: 'draft' });
    setEditingTxnId(null);
  }

  function openEditTxn(tx) {
    setEditingTxnId(tx.id);
    setTxnType(tx.txn_type);
    setTxnForm({
      txn_date: tx.txn_date ? new Date(tx.txn_date).toISOString().slice(0, 10) : '',
      description: tx.description || '', amount: String(tx.amount || ''),
      category_account_id: tx.category_account_id ? String(tx.category_account_id) : '',
      bank_account_id: tx.bank_account_id ? String(tx.bank_account_id) : '',
      payment_method: tx.payment_method || '', contact_id: tx.contact_id ? String(tx.contact_id) : '',
      external_ref: tx.external_ref || '', notes: tx.notes || '', status: tx.status || 'draft',
    });
    setShowTxnModal(true);
  }

  async function handleSaveTxn() {
    if (!txnForm.description || !txnForm.amount) { alertMsg('Error', 'Description and amount are required'); return; }
    setTxnSaving(true);
    try {
      const dupCheck = await apiFetch(`/finance/check-duplicate?type=${txnType}&amount=${txnForm.amount}&date=${txnForm.txn_date}`);
      if (dupCheck.duplicates && !editingTxnId) {
        const msg = dupCheck.warnings.map(w => w.message).join('\n');
        if (Platform.OS === 'web') { if (!window.confirm(`Possible duplicate:\n${msg}\n\nContinue anyway?`)) { setTxnSaving(false); return; } }
        else { alertMsg('Warning', msg); }
      }
      if (editingTxnId) {
        await apiFetch(`/finance/transactions/${editingTxnId}`, { method: 'PUT', body: { ...txnForm, amount: parseFloat(txnForm.amount) } });
      } else {
        await apiFetch('/finance/transactions', {
          method: 'POST',
          body: { txn_type: txnType, ...txnForm, amount: parseFloat(txnForm.amount),
            category_account_id: txnForm.category_account_id || undefined,
            bank_account_id: txnForm.bank_account_id || undefined,
            payment_method: txnForm.payment_method || undefined,
            contact_id: txnForm.contact_id || undefined,
            external_ref: txnForm.external_ref || undefined, notes: txnForm.notes || undefined },
        });
      }
      setShowTxnModal(false); resetTxnForm();
      fetchTransactions(buildTxnFilters()); fetchSummary(); fetchAlerts();
      alertMsg('Success', editingTxnId ? 'Transaction updated' : 'Transaction created');
    } catch (e) { alertMsg('Error', e.message); }
    setTxnSaving(false);
  }

  async function handleCreateTransfer() {
    const { description, amount, source_bank_id, destination_bank_id } = transferForm;
    if (!description || !amount || !source_bank_id || !destination_bank_id) { alertMsg('Error', 'Description, amount, source & destination required'); return; }
    setTransferSaving(true);
    try {
      await apiFetch('/finance/transactions/transfer', { method: 'POST', body: { ...transferForm, amount: parseFloat(amount) } });
      setShowTransferModal(false);
      setTransferForm({ txn_date: new Date().toISOString().slice(0, 10), description: '', amount: '', source_bank_id: '', destination_bank_id: '', reference: '', notes: '' });
      fetchTransactions(buildTxnFilters()); fetchSummary();
      alertMsg('Success', 'Transfer posted');
    } catch (e) { alertMsg('Error', e.message); }
    setTransferSaving(false);
  }

  function addJournalLine() { setJournalForm(f => ({ ...f, lines: [...f.lines, { account_id: '', debit: '', credit: '', description: '' }] })); }
  function updateJournalLine(idx, field, value) { setJournalForm(f => { const lines = [...f.lines]; lines[idx] = { ...lines[idx], [field]: value }; return { ...f, lines }; }); }
  function removeJournalLine(idx) { setJournalForm(f => ({ ...f, lines: f.lines.filter((_, i) => i !== idx) })); }

  async function handleCreateJournal() {
    if (!journalForm.description || journalForm.lines.length < 2) { alertMsg('Error', 'Description and at least 2 lines required'); return; }
    const totalD = journalForm.lines.reduce((sum, l) => sum + (parseFloat(l.debit) || 0), 0);
    const totalC = journalForm.lines.reduce((sum, l) => sum + (parseFloat(l.credit) || 0), 0);
    if (Math.abs(totalD - totalC) > 0.01) { alertMsg('Error', `Journal must balance. Debits: ${formatRWF(totalD)}, Credits: ${formatRWF(totalC)}`); return; }
    setJournalSaving(true);
    try {
      await apiFetch('/finance/transactions/journal', { method: 'POST', body: journalForm });
      setShowJournalModal(false);
      setJournalForm({ txn_date: new Date().toISOString().slice(0, 10), description: '', notes: '', status: 'draft', lines: [{ account_id: '', debit: '', credit: '', description: '' }, { account_id: '', debit: '', credit: '', description: '' }] });
      fetchTransactions(buildTxnFilters()); fetchSummary();
      alertMsg('Success', 'Journal entry created');
    } catch (e) { alertMsg('Error', e.message); }
    setJournalSaving(false);
  }

  async function handleUpdateContact() {
    if (!editingContact?.name) { alertMsg('Error', 'Name required'); return; }
    setContactSaving(true);
    try {
      await apiFetch(`/finance/contacts/${editingContact.id}`, { method: 'PUT', body: editingContact });
      setEditingContact(null); setShowContactModal(false); fetchLookups();
      alertMsg('Success', 'Contact updated');
    } catch (e) { alertMsg('Error', e.message); }
    setContactSaving(false);
  }

  async function handleTxnAction(id, action) {
    try {
      if (action === 'approve') await apiFetch(`/finance/transactions/${id}/approve`, { method: 'POST' });
      else if (action === 'post') await apiFetch(`/finance/transactions/${id}/post`, { method: 'POST' });
      else if (action === 'void') await apiFetch(`/finance/transactions/${id}/void`, { method: 'POST', body: { reason: 'Voided by finance officer' } });
      fetchTransactions(buildTxnFilters()); fetchSummary(); fetchAlerts();
    } catch (e) { alertMsg('Error', e.message); }
  }

  async function handleCreateContact() {
    if (!contactForm.name) { alertMsg('Error', 'Name is required'); return; }
    setContactSaving(true);
    try {
      await apiFetch('/finance/contacts', { method: 'POST', body: { ...contactForm, payment_terms_days: parseInt(contactForm.payment_terms_days) || 30 } });
      setShowContactModal(false); setContactForm({ name: '', contact_type: 'supplier', email: '', phone: '', payment_terms_days: '30' });
      fetchLookups(); alertMsg('Success', 'Contact added');
    } catch (e) { alertMsg('Error', e.message); }
    setContactSaving(false);
  }

  async function handleCreateInvoice() {
    if (!invoiceForm.invoice_number || !invoiceForm.contact_id || !invoiceForm.due_date || !invoiceForm.total_amount) { alertMsg('Error', 'Invoice #, contact, due date, and amount are required'); return; }
    setInvoiceSaving(true);
    try {
      await apiFetch('/finance/invoices', { method: 'POST', body: { ...invoiceForm, total_amount: parseFloat(invoiceForm.total_amount), tax_amount: parseFloat(invoiceForm.tax_amount) || 0 } });
      setShowInvoiceModal(false); setInvoiceForm({ invoice_number: '', invoice_type: 'receivable', contact_id: '', invoice_date: new Date().toISOString().slice(0, 10), due_date: '', total_amount: '', tax_amount: '0', description: '' });
      fetchInvoices(invoiceTab === 'all' ? {} : { type: invoiceTab }); fetchSummary();
      alertMsg('Success', 'Invoice created');
    } catch (e) { alertMsg('Error', e.message); }
    setInvoiceSaving(false);
  }

  async function handlePayInvoice() {
    if (!payForm.amount || !payForm.payment_date) { alertMsg('Error', 'Amount and date required'); return; }
    setPaySaving(true);
    try {
      await apiFetch(`/finance/invoices/${payInvoice.id}/pay`, { method: 'POST', body: { ...payForm, amount: parseFloat(payForm.amount) } });
      setShowPayModal(false); setPayInvoice(null); setPayForm({ amount: '', payment_date: new Date().toISOString().slice(0, 10), payment_method: '', reference: '' });
      fetchInvoices(invoiceTab === 'all' ? {} : { type: invoiceTab }); fetchSummary();
      alertMsg('Success', 'Payment recorded');
    } catch (e) { alertMsg('Error', e.message); }
    setPaySaving(false);
  }

  async function handleCreateBudget() {
    if (!budgetForm.name || !budgetForm.fiscal_year) { alertMsg('Error', 'Name and fiscal year required'); return; }
    setBudgetSaving(true);
    try {
      const lines = budgetForm.lines.filter(l => l.account_id && l.approved_amount);
      await apiFetch('/finance/budgets', { method: 'POST', body: { name: budgetForm.name, fiscal_year: parseInt(budgetForm.fiscal_year), department_id: budgetForm.department_id || null, lines: lines.map(l => ({ account_id: parseInt(l.account_id), approved_amount: parseFloat(l.approved_amount), notes: l.notes })) } });
      setShowBudgetModal(false); setBudgetForm({ name: '', fiscal_year: new Date().getFullYear().toString(), department_id: '', lines: [] });
      fetchBudgets(); alertMsg('Success', 'Budget created');
    } catch (e) { alertMsg('Error', e.message); }
    setBudgetSaving(false);
  }

  function addBudgetLine() { setBudgetForm(f => ({ ...f, lines: [...f.lines, { account_id: '', approved_amount: '', notes: '' }] })); }
  function updateBudgetLine(idx, field, value) { setBudgetForm(f => ({ ...f, lines: f.lines.map((l, i) => i === idx ? { ...l, [field]: value } : l) })); }
  function removeBudgetLine(idx) { setBudgetForm(f => ({ ...f, lines: f.lines.filter((_, i) => i !== idx) })); }

  async function handleCreateRecurring() {
    if (!recurringForm.description || !recurringForm.amount || !recurringForm.next_run_date) { alertMsg('Error', 'Description, amount & next run date required'); return; }
    setRecurringSaving(true);
    try {
      await apiFetch('/finance/recurring', { method: 'POST', body: { ...recurringForm, amount: parseFloat(recurringForm.amount) } });
      setShowRecurringModal(false); setRecurringForm({ txn_type: 'expense', description: '', amount: '', frequency: 'monthly', next_run_date: '', end_date: '', category_account_id: '', bank_account_id: '', contact_id: '', payment_method: '', auto_post: false });
      fetchRecurring(); alertMsg('Success', 'Recurring template created');
    } catch (e) { alertMsg('Error', e.message); }
    setRecurringSaving(false);
  }

  async function handleGenerateRecurring(id) {
    try {
      const txn = await apiFetch(`/finance/recurring/${id}/generate`, { method: 'POST' });
      alertMsg('Success', `Transaction ${txn.txn_ref} created`);
      fetchRecurring(); fetchTransactions(buildTxnFilters()); fetchSummary();
    } catch (e) { alertMsg('Error', e.message); }
  }

  async function handleDeleteRecurring(id) {
    try { await apiFetch(`/finance/recurring/${id}`, { method: 'DELETE' }); alertMsg('Success', 'Recurring template deactivated'); fetchRecurring(); }
    catch (e) { alertMsg('Error', e.message); }
  }

  async function handleImportCSV() {
    if (!reconBank || !csvText.trim()) { alertMsg('Error', 'Select bank account and paste CSV data'); return; }
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) { alertMsg('Error', 'CSV must have a header row and at least one data row'); return; }
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const csvRows = [];
    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(',');
      const row = {};
      headers.forEach((h, idx) => { row[h] = vals[idx]?.trim() || ''; });
      csvRows.push({ date: row.date, description: row.description || row.desc || row.narration, debit: row.debit || '', credit: row.credit || '', reference: row.reference || row.ref || '' });
    }
    try {
      const result = await apiFetch('/finance/reconciliation/import', { method: 'POST', body: { bank_account_id: parseInt(reconBank), rows: csvRows } });
      alertMsg('Success', `Imported ${result.imported} rows, ${result.skipped_duplicates} duplicates skipped`);
      setCsvText(''); fetchReconData();
    } catch (e) { alertMsg('Error', e.message); }
  }

  async function handleAutoMatch() {
    if (!reconData?.suggestions?.length) { alertMsg('Info', 'No auto-match suggestions available'); return; }
    try {
      const result = await apiFetch('/finance/reconciliation/match', { method: 'POST', body: { matches: reconData.suggestions } });
      alertMsg('Success', `${result.matched} transactions matched`); fetchReconData();
    } catch (e) { alertMsg('Error', e.message); }
  }

  async function handleLockPeriod(id) {
    try { await apiFetch(`/finance/periods/${id}/lock`, { method: 'POST' }); alertMsg('Success', 'Period locked'); fetchPeriods(); }
    catch (e) { alertMsg('Error', e.message); }
  }

  async function handleUnlockPeriod(id) {
    if (Platform.OS === 'web') {
      const reason = window.prompt('Reason for unlocking this period:');
      if (!reason) return;
      try { await apiFetch(`/finance/periods/${id}/unlock`, { method: 'POST', body: { reason } }); alertMsg('Success', 'Period unlocked'); fetchPeriods(); }
      catch (e) { alertMsg('Error', e.message); }
    } else { alertMsg('Info', 'Period unlock is available on the web version'); }
  }

  function handleExportCSV(reportKey) {
    const url = `${process.env.EXPO_PUBLIC_API_URL}/finance/export/report/${reportKey}?from=${periodParams.start_date}&to=${periodParams.end_date}`;
    if (Platform.OS === 'web') window.open(url, '_blank');
    else alertMsg('Export', 'CSV export is available on the web version');
  }

  function handleExportTransactions() {
    const url = `${process.env.EXPO_PUBLIC_API_URL}/finance/export/transactions?from=${periodParams.start_date}&to=${periodParams.end_date}`;
    if (Platform.OS === 'web') window.open(url, '_blank');
    else alertMsg('Export', 'CSV export is available on the web version');
  }

  async function handleGlobalSearch() {
    if (!globalSearch || globalSearch.length < 2) return;
    setSearching(true);
    try { const data = await apiFetch(`/finance/search?q=${encodeURIComponent(globalSearch)}`); setSearchResults(data); }
    catch { setSearchResults(null); }
    setSearching(false);
  }

  async function handleSaveOrg() {
    if (!orgProfile) return;
    setOrgSaving(true);
    try { const data = await apiFetch('/finance/organization', { method: 'PUT', body: orgProfile }); setOrgProfile(data); alertMsg('Success', 'Organization profile saved'); }
    catch (e) { alertMsg('Error', e.message); }
    setOrgSaving(false);
  }

  async function handleCreateAccount() {
    if (!accountForm.code || !accountForm.name) { alertMsg('Error', 'Code and name required'); return; }
    setAccountSaving(true);
    try {
      await apiFetch('/finance/accounts', { method: 'POST', body: accountForm });
      setShowAccountModal(false); setAccountForm({ code: '', name: '', account_type: 'expense', description: '' });
      fetchLookups(); alertMsg('Success', 'Account created');
    } catch (e) { alertMsg('Error', e.message); }
    setAccountSaving(false);
  }

  async function handleCreateProject() {
    if (!projectForm.code || !projectForm.name) { alertMsg('Error', 'Code and name required'); return; }
    setProjectSaving(true);
    try {
      await apiFetch('/finance/projects', { method: 'POST', body: { ...projectForm, approved_amount: projectForm.approved_amount ? parseFloat(projectForm.approved_amount) : null } });
      setShowProjectModal(false); setProjectForm({ code: '', name: '', description: '', approved_amount: '', start_date: '', end_date: '' });
      fetchProjects(); alertMsg('Success', 'Project created');
    } catch (e) { alertMsg('Error', e.message); }
    setProjectSaving(false);
  }

  async function runReport(key) {
    setReportLoading(true); setSelectedReport(key);
    try { const data = await apiFetch(`/finance/reports/${key}?from=${periodParams.start_date}&to=${periodParams.end_date}`); setReportData(data); }
    catch (e) { setReportData(null); alertMsg('Error', e.message); }
    setReportLoading(false);
  }

  /* ─── Initial load ─── */
  useEffect(() => {
    (async () => {
      setLoading(true); setError(null);
      try { await Promise.all([fetchSummary(), fetchAlerts(), fetchLookups()]); await fetchTransactions({ type: 'all' }); }
      catch (e) { setError(e.message); }
      setLoading(false);
    })();
  }, []);

  useEffect(() => { fetchSummary(); fetchTransactions(buildTxnFilters()); }, [period]);
  useEffect(() => { fetchTransactions(buildTxnFilters()); }, [txnTab]);

  /* ─── Shared context object ─── */
  const ctx = {
    wide, segment, setSegment, period, setPeriod,
    summary, alerts, transactions, txnLoading, accounts, bankAccounts, departments, contacts, budgets,
    reportData, reportLoading, selectedReport, loading, error,
    txnTab, setTxnTab, txnSearch, setTxnSearch,
    showTxnModal, setShowTxnModal, txnType, setTxnType, txnForm, setTxnForm, txnSaving, editingTxnId,
    showTransferModal, setShowTransferModal, transferForm, setTransferForm, transferSaving,
    showJournalModal, setShowJournalModal, journalForm, setJournalForm, journalSaving,
    customFrom, setCustomFrom, customTo, setCustomTo,
    editingContact, setEditingContact,
    showContactModal, setShowContactModal, contactForm, setContactForm, contactSaving,
    invoices, invoiceLoading, invoiceTab, setInvoiceTab,
    showInvoiceModal, setShowInvoiceModal, invoiceForm, setInvoiceForm, invoiceSaving,
    showPayModal, setShowPayModal, payInvoice, setPayInvoice, payForm, setPayForm, paySaving,
    approvals, approvalsLoading,
    settingsView, setSettingsView, orgProfile, setOrgProfile, orgSaving,
    projects, showProjectModal, setShowProjectModal, projectForm, setProjectForm, projectSaving,
    showAccountModal, setShowAccountModal, accountForm, setAccountForm, accountSaving,
    showBudgetModal, setShowBudgetModal, budgetForm, setBudgetForm, budgetSaving,
    selectedBudget, setSelectedBudget, budgetDetail, setBudgetDetail,
    recurringTxns, recurringLoading, showRecurringModal, setShowRecurringModal, recurringForm, setRecurringForm, recurringSaving,
    reconBank, setReconBank, reconData, reconLoading, reconSummary, csvText, setCsvText,
    periods, periodsLoading,
    // handlers
    fetchSummary, fetchAlerts, fetchTransactions, fetchLookups, fetchBudgets, fetchInvoices,
    fetchApprovals, fetchBudgetDetail, fetchProjects, fetchOrgProfile, fetchRecurring, fetchReconData, fetchPeriods,
    buildTxnFilters, resetTxnForm, openEditTxn,
    handleSaveTxn, handleCreateTransfer, handleCreateJournal,
    addJournalLine, updateJournalLine, removeJournalLine,
    handleUpdateContact, handleTxnAction, handleCreateContact,
    handleCreateInvoice, handlePayInvoice,
    handleCreateBudget, addBudgetLine, updateBudgetLine, removeBudgetLine,
    handleCreateRecurring, handleGenerateRecurring, handleDeleteRecurring,
    handleImportCSV, handleAutoMatch, handleLockPeriod, handleUnlockPeriod,
    handleExportCSV, handleExportTransactions, handleSaveOrg, handleCreateAccount, handleCreateProject,
    runReport,
  };

  /* ─── Sidebar ─── */
  const sidebarSections = useMemo(() => [
    {
      label: 'FINANCE',
      items: SEGMENTS.map(seg => ({
        key: seg.key,
        icon: seg.key === 'overview' ? 'view-dashboard-outline'
            : seg.key === 'transactions' ? 'swap-horizontal-circle-outline'
            : seg.key === 'invoices' ? 'receipt'
            : seg.key === 'income' ? 'cash-plus'
            : seg.key === 'expenses' ? 'cash-minus'
            : seg.key === 'approvals' ? 'clipboard-check-outline'
            : seg.key === 'budgets' ? 'chart-box-outline'
            : seg.key === 'reports' ? 'file-chart-outline'
            : seg.key === 'contacts' ? 'account-group-outline'
            : 'cog-outline',
        label: seg.label,
        onPress: () => setSegment(seg.key),
      })),
    },
    { label: 'NAVIGATE', items: [{ key: 'back', icon: 'arrow-left', label: 'Back to Me', onPress: () => navigation.goBack() }] },
  ], [navigation]);

  const goBack = useCallback(() => navigation.goBack(), [navigation]);
  const segmentLabel = SEGMENTS.find(x => x.key === segment)?.label || '';

  function renderContent() {
    if (loading) return <ActivityIndicator color={FIN.primary} size="large" style={{ marginTop: 60 }} />;
    if (error) return <View style={s.emptyPanel}><Text style={s.emptyPanelText}>Failed to load: {error}</Text></View>;
    switch (segment) {
      case 'overview':       return <FinanceOverview ctx={ctx} />;
      case 'transactions':   return <TransactionsSection ctx={ctx} />;
      case 'invoices':       return <InvoicesSection ctx={ctx} />;
      case 'income':         return <FinanceIncome ctx={ctx} />;
      case 'expenses':       return <FinanceExpenses ctx={ctx} />;
      case 'approvals':      return <FinanceApprovals ctx={ctx} />;
      case 'budgets':        return <BudgetsSection ctx={ctx} />;
      case 'reports':        return <FinanceReports ctx={ctx} />;
      case 'reconciliation': return <FinanceReconciliation ctx={ctx} />;
      case 'recurring':      return <RecurringSection ctx={ctx} />;
      case 'contacts':       return <ContactsSection ctx={ctx} />;
      case 'documents':      return <FinanceDocuments ctx={ctx} />;
      case 'import':         return <FinanceImportExport ctx={ctx} />;
      case 'notifications':  return <FinanceNotifications ctx={ctx} />;
      case 'settings':       return <SettingsSection ctx={ctx} />;
      default:               return <FinanceOverview ctx={ctx} />;
    }
  }

  return (
    <GradientBackground>
      <View style={[s.root, { paddingTop: insets.top }]}>
        {wide ? (
          <AdminSidebar brandTitle="allinkigali" brandSubtitle="Finance" sections={sidebarSections} activeKey={segment} />
        ) : (
          <>
            <View style={s.topBar}>
              <Pressable onPress={goBack} hitSlop={12}>
                <MaterialCommunityIcons name="arrow-left" size={22} color={colors.white} />
              </Pressable>
              <Text style={s.topBarTitle}>Finance Dashboard</Text>
              <View style={{ width: 22 }} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.mobileTabs} contentContainerStyle={{ paddingHorizontal: 16 }}>
              {SEGMENTS.map(seg => (
                <Pressable key={seg.key} onPress={() => setSegment(seg.key)} style={[s.mobileTab, segment === seg.key && s.mobileTabActive]}>
                  <Text style={[s.mobileTabLabel, segment === seg.key && s.mobileTabLabelActive]}>{seg.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}
        <View style={{ flex: 1 }}>
          <View style={s.pageHeader}>
            <View style={{ flex: 1 }}>
              <Text style={s.pageTitle}>{segmentLabel}</Text>
              <Text style={s.pageSubtitle}>
                {segment === 'overview' ? 'Financial overview and items needing attention'
                  : segment === 'transactions' ? 'All income, expenses, transfers, and journals'
                  : segment === 'invoices' ? 'Receivable and payable invoices, payments'
                  : segment === 'approvals' ? 'Transactions waiting for review or posting'
                  : segment === 'budgets' ? 'Budget setup and spending vs approved amounts'
                  : segment === 'settings' ? 'Organization, accounts, users, and system settings'
                  : segment === 'reconciliation' ? 'Import bank statements and match against ledger'
                  : segment === 'recurring' ? 'Automate repeating income and expense entries'
                  : segment === 'documents' ? 'Attach receipts, contracts, and invoices'
                  : segment === 'import' ? 'Import transactions and export reports'
                  : segment === 'notifications' ? 'Overdue invoices, budget alerts, pending approvals'
                  : `Manage ${segmentLabel.toLowerCase()}`}
              </Text>
            </View>
            {wide && (
              <View style={[s.searchBox, { maxWidth: 280 }]}>
                <MaterialCommunityIcons name="magnify" size={16} color={colors.textMuted} />
                <TextInput style={s.searchInput} value={globalSearch} onChangeText={setGlobalSearch} onSubmitEditing={handleGlobalSearch} placeholder="Search transactions, invoices..." placeholderTextColor={colors.textMuted} returnKeyType="search" />
                {searching && <ActivityIndicator color={FIN.primary} size="small" />}
              </View>
            )}
          </View>
          {searchResults && (
            <View style={[s.panel, { margin: spacing.xl, marginBottom: 0 }]}>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>Search Results</Text>
                <Pressable onPress={() => { setSearchResults(null); setGlobalSearch(''); }}>
                  <MaterialCommunityIcons name="close" size={18} color={colors.blue300} />
                </Pressable>
              </View>
              {(searchResults.transactions || []).map(t => (
                <View key={`t${t.id}`} style={s.txRow}>
                  <View style={[s.kpiIcon, { backgroundColor: FIN.primaryBg, width: 28, height: 28 }]}><MaterialCommunityIcons name="swap-horizontal" size={14} color={FIN.primary} /></View>
                  <View style={{ flex: 1 }}><Text style={s.txDesc}>{t.txn_ref} — {t.description}</Text><Text style={s.txMeta}>{t.txn_type} · {formatRWF(t.amount)}</Text></View>
                </View>
              ))}
              {(searchResults.invoices || []).map(i => (
                <View key={`i${i.id}`} style={s.txRow}>
                  <View style={[s.kpiIcon, { backgroundColor: FIN.warningBg, width: 28, height: 28 }]}><MaterialCommunityIcons name="receipt" size={14} color={FIN.warning} /></View>
                  <View style={{ flex: 1 }}><Text style={s.txDesc}>{i.invoice_number}</Text><Text style={s.txMeta}>{i.invoice_type} · {formatRWF(i.total_amount)}</Text></View>
                </View>
              ))}
              {(searchResults.contacts || []).map(c => (
                <View key={`c${c.id}`} style={s.txRow}>
                  <View style={[s.kpiIcon, { backgroundColor: FIN.purpleBg, width: 28, height: 28 }]}><MaterialCommunityIcons name="account" size={14} color={FIN.purple} /></View>
                  <View style={{ flex: 1 }}><Text style={s.txDesc}>{c.name}</Text><Text style={s.txMeta}>{c.contact_type} · {c.email || c.phone || ''}</Text></View>
                </View>
              ))}
              {!(searchResults.transactions?.length || searchResults.invoices?.length || searchResults.contacts?.length) && (
                <Text style={s.emptyPanelText}>No results found</Text>
              )}
            </View>
          )}
          <ScrollView style={{ flex: 1 }} contentContainerStyle={[s.content, { paddingBottom: insets.bottom + spacing.xxl }]}>
            {renderContent()}
          </ScrollView>
        </View>
      </View>
      <TxnModal ctx={ctx} />
      <ContactModal ctx={ctx} />
      <InvoiceModal ctx={ctx} />
      <PayModal ctx={ctx} />
      <BudgetModal ctx={ctx} />
      <AccountModal ctx={ctx} />
      <ProjectModal ctx={ctx} />
      <RecurringModal ctx={ctx} />
      <TransferModal ctx={ctx} />
      <JournalModal ctx={ctx} />
    </GradientBackground>
  );
}
