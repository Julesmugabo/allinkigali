import React, { useEffect, useState, useMemo } from 'react';
import {
  Wallet, TrendingUp, TrendingDown, ArrowUpDown, Receipt,
  FileText, Users, Clock, Plus, Pencil, Trash2,
  DollarSign, CreditCard, AlertTriangle,
} from 'lucide-react';
import { apiFetch } from '../api';
import { t } from '../theme';
import { PageHeader, StatCard, Card, DataTable, Badge, Tabs } from '../components/PageShell';

function formatRWF(n) { return `${(Number(n) || 0).toLocaleString()} RWF`; }

const TXN_COLORS = { income: t.success, expense: t.danger, transfer: t.accent, journal: '#A78BFA' };
const STATUS_COLORS = { posted: t.success, draft: t.warning, pending_approval: '#F59E0B', voided: t.textMuted };
const INV_COLORS = { paid: t.success, sent: t.accent, overdue: t.danger, draft: t.warning };

export default function FinanceDashboard() {
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('this_month');

  const [txnTab, setTxnTab] = useState('all');
  const [invTab, setInvTab] = useState('all');

  const [showTxnModal, setShowTxnModal] = useState(false);
  const [txnForm, setTxnForm] = useState({ txn_date: new Date().toISOString().slice(0, 10), description: '', amount: '', txn_type: 'income', status: 'draft' });
  const [txnSaving, setTxnSaving] = useState(false);

  const periodRange = useMemo(() => {
    const now = new Date();
    const ranges = {
      this_month: { from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10), to: now.toISOString().slice(0, 10) },
      last_month: { from: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10), to: new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10) },
      this_quarter: { from: new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1).toISOString().slice(0, 10), to: now.toISOString().slice(0, 10) },
      this_year: { from: new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10), to: now.toISOString().slice(0, 10) },
    };
    return ranges[period] || ranges.this_month;
  }, [period]);

  async function load() {
    try {
      const [sum, alrt, txns, invs, conts, buds, accs] = await Promise.all([
        apiFetch(`/finance/dashboard/summary?from=${periodRange.from}&to=${periodRange.to}`).catch(() => null),
        apiFetch('/finance/dashboard/alerts').catch(() => null),
        apiFetch('/finance/transactions').then(r => r?.transactions || []).catch(() => []),
        apiFetch('/finance/invoices').catch(() => []),
        apiFetch('/finance/contacts').catch(() => []),
        apiFetch('/finance/budgets').catch(() => []),
        apiFetch('/finance/accounts').catch(() => []),
      ]);
      setSummary(sum);
      setAlerts(alrt);
      setTransactions(txns || []);
      setInvoices(invs || []);
      setContacts(conts || []);
      setBudgets(buds || []);
      setAccounts(accs || []);
    } catch {}
    setLoading(false);
  }
  useEffect(() => { load(); }, [periodRange]);

  const filteredTxns = useMemo(() => {
    if (txnTab === 'all') return transactions;
    return transactions.filter(t => t.txn_type === txnTab);
  }, [transactions, txnTab]);

  const filteredInvs = useMemo(() => {
    if (invTab === 'all') return invoices;
    return invoices.filter(i => i.status === invTab || i.invoice_type === invTab);
  }, [invoices, invTab]);

  const saveTxn = async () => {
    setTxnSaving(true);
    try {
      await apiFetch('/finance/transactions', { method: 'POST', body: { ...txnForm, amount: parseFloat(txnForm.amount) } });
      setShowTxnModal(false);
      await load();
    } catch (err) { alert(err.message); }
    setTxnSaving(false);
  };

  if (loading) return <div style={{ padding: 40, color: t.textSecondary }}>Loading...</div>;

  const cards = summary?.cards || {};

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'transactions', label: 'Transactions', count: transactions.length },
    { key: 'invoices', label: 'Invoices', count: invoices.length },
    { key: 'contacts', label: 'Contacts', count: contacts.length },
    { key: 'budgets', label: 'Budgets', count: budgets.length },
  ];

  return (
    <div>
      <PageHeader
        title="Finance Dashboard"
        subtitle="Ububiko bw'imari"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={period} onChange={(e) => setPeriod(e.target.value)} style={{ padding: '8px 12px' }}>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="this_quarter">This Quarter</option>
              <option value="this_year">This Year</option>
            </select>
            <button onClick={() => { setTxnForm({ txn_date: new Date().toISOString().slice(0, 10), description: '', amount: '', txn_type: 'income', status: 'draft' }); setShowTxnModal(true); }} style={s.primaryBtn}>
              <Plus size={16} /> New Transaction
            </button>
          </div>
        }
      />

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'overview' && (
        <>
          <div style={s.statGrid}>
            <StatCard label="Cash & Bank" value={formatRWF(cards.cashBank)} icon={Wallet} color={t.accent} />
            <StatCard label="Income" value={formatRWF(cards.income)} icon={TrendingUp} color={t.success} />
            <StatCard label="Expenses" value={formatRWF(cards.expenses)} icon={TrendingDown} color={t.danger} />
            <StatCard label="Net Movement" value={formatRWF(cards.netMovement)} icon={ArrowUpDown} color={cards.netMovement >= 0 ? t.success : t.danger} />
          </div>

          <div style={{ ...s.statGrid, marginTop: 16 }}>
            <StatCard label="Receivables" value={formatRWF(cards.receivables)} icon={Receipt} color="#F59E0B" />
            <StatCard label="Payables" value={formatRWF(cards.payables)} icon={CreditCard} color="#A78BFA" />
          </div>

          {alerts && (alerts.overdueReceivables?.count > 0 || alerts.overduePayables?.count > 0 || alerts.pendingApprovals?.count > 0) && (
            <Card style={{ marginTop: 24 }}>
              <h3 style={s.sectionTitle}><AlertTriangle size={16} color={t.warning} style={{ marginRight: 6 }} />Alerts</h3>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {alerts.overdueReceivables?.count > 0 && (
                  <div style={s.alertBox}>
                    <span style={{ color: t.danger, fontWeight: 600 }}>{alerts.overdueReceivables.count}</span> overdue receivables ({formatRWF(alerts.overdueReceivables.total)})
                  </div>
                )}
                {alerts.overduePayables?.count > 0 && (
                  <div style={s.alertBox}>
                    <span style={{ color: t.warning, fontWeight: 600 }}>{alerts.overduePayables.count}</span> overdue payables ({formatRWF(alerts.overduePayables.total)})
                  </div>
                )}
                {alerts.pendingApprovals?.count > 0 && (
                  <div style={s.alertBox}>
                    <span style={{ color: t.accent, fontWeight: 600 }}>{alerts.pendingApprovals.count}</span> pending approvals
                  </div>
                )}
              </div>
            </Card>
          )}

          <Card style={{ marginTop: 24 }}>
            <h3 style={s.sectionTitle}>Recent Transactions</h3>
            <DataTable
              columns={[
                { key: 'txn_ref', label: 'Ref', render: (r) => <span style={{ color: t.accent, fontWeight: 500 }}>{r.txn_ref}</span> },
                { key: 'description', label: 'Description', render: (r) => <span style={{ color: t.text }}>{r.description}</span> },
                { key: 'txn_type', label: 'Type', render: (r) => <Badge color={TXN_COLORS[r.txn_type]}>{r.txn_type}</Badge> },
                { key: 'amount', label: 'Amount', render: (r) => <span style={{ color: t.text, fontWeight: 600 }}>{formatRWF(r.amount)}</span> },
                { key: 'status', label: 'Status', render: (r) => <Badge color={STATUS_COLORS[r.status]}>{r.status}</Badge> },
              ]}
              rows={(summary?.recentTransactions || []).slice(0, 10)}
              emptyText="No transactions yet."
            />
          </Card>
        </>
      )}

      {tab === 'transactions' && (
        <Card style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {['all', 'income', 'expense', 'transfer'].map(k => (
              <button key={k} onClick={() => setTxnTab(k)} style={{ ...s.filterBtn, ...(txnTab === k ? { background: t.bgActive, color: t.accent } : {}) }}>
                {k.charAt(0).toUpperCase() + k.slice(1)}
              </button>
            ))}
          </div>
          <DataTable
            columns={[
              { key: 'txn_ref', label: 'Ref', render: (r) => <span style={{ color: t.accent }}>{r.txn_ref}</span> },
              { key: 'txn_date', label: 'Date', render: (r) => <span style={{ color: t.textSecondary }}>{r.txn_date?.slice(0, 10)}</span> },
              { key: 'description', label: 'Description', render: (r) => <span style={{ color: t.text }}>{r.description}</span> },
              { key: 'txn_type', label: 'Type', render: (r) => <Badge color={TXN_COLORS[r.txn_type]}>{r.txn_type}</Badge> },
              { key: 'amount', label: 'Amount', render: (r) => <span style={{ color: t.text, fontWeight: 600 }}>{formatRWF(r.amount)}</span> },
              { key: 'status', label: 'Status', render: (r) => <Badge color={STATUS_COLORS[r.status]}>{r.status}</Badge> },
            ]}
            rows={filteredTxns}
          />
        </Card>
      )}

      {tab === 'invoices' && (
        <Card style={{ marginTop: 16 }}>
          <DataTable
            columns={[
              { key: 'invoice_number', label: 'Invoice #', render: (r) => <span style={{ color: t.accent }}>{r.invoice_number}</span> },
              { key: 'invoice_type', label: 'Type', render: (r) => <Badge color={r.invoice_type === 'receivable' ? t.success : '#A78BFA'}>{r.invoice_type}</Badge> },
              { key: 'contact_name', label: 'Contact', render: (r) => <span style={{ color: t.text }}>{r.contact_name || '—'}</span> },
              { key: 'total_amount', label: 'Total', render: (r) => <span style={{ color: t.text, fontWeight: 600 }}>{formatRWF(r.total_amount)}</span> },
              { key: 'outstanding', label: 'Outstanding', render: (r) => <span style={{ color: r.outstanding > 0 ? t.warning : t.success }}>{formatRWF(r.outstanding)}</span> },
              { key: 'status', label: 'Status', render: (r) => <Badge color={INV_COLORS[r.status] || t.textMuted}>{r.status}</Badge> },
            ]}
            rows={filteredInvs}
            emptyText="No invoices yet."
          />
        </Card>
      )}

      {tab === 'contacts' && (
        <Card style={{ marginTop: 16 }}>
          <DataTable
            columns={[
              { key: 'name', label: 'Name', render: (r) => <span style={{ color: t.text, fontWeight: 500 }}>{r.name}</span> },
              { key: 'contact_type', label: 'Type', render: (r) => <Badge>{r.contact_type}</Badge> },
              { key: 'email', label: 'Email', render: (r) => <span style={{ color: t.textSecondary }}>{r.email || '—'}</span> },
              { key: 'phone', label: 'Phone', render: (r) => <span style={{ color: t.textSecondary }}>{r.phone || '—'}</span> },
            ]}
            rows={contacts}
            emptyText="No contacts yet."
          />
        </Card>
      )}

      {tab === 'budgets' && (
        <Card style={{ marginTop: 16 }}>
          <DataTable
            columns={[
              { key: 'name', label: 'Budget', render: (r) => <span style={{ color: t.text, fontWeight: 500 }}>{r.name}</span> },
              { key: 'total_amount', label: 'Amount', render: (r) => <span style={{ color: t.text }}>{formatRWF(r.total_amount)}</span> },
              { key: 'spent', label: 'Spent', render: (r) => <span style={{ color: t.warning }}>{formatRWF(r.spent || 0)}</span> },
              { key: 'status', label: 'Status', render: (r) => <Badge color={r.status === 'active' ? t.success : t.textMuted}>{r.status}</Badge> },
            ]}
            rows={budgets}
            emptyText="No budgets yet."
          />
        </Card>
      )}

      {showTxnModal && (
        <div style={s.modalOverlay} onClick={() => setShowTxnModal(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={s.modalTitle}>New Transaction</h2>
            <div style={s.formGrid}>
              <div style={s.field}>
                <label style={s.label}>Date</label>
                <input type="date" value={txnForm.txn_date} onChange={(e) => setTxnForm({ ...txnForm, txn_date: e.target.value })} style={{ width: '100%' }} />
              </div>
              <div style={s.field}>
                <label style={s.label}>Type</label>
                <select value={txnForm.txn_type} onChange={(e) => setTxnForm({ ...txnForm, txn_type: e.target.value })} style={{ width: '100%' }}>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                  <option value="transfer">Transfer</option>
                </select>
              </div>
              <div style={s.field}>
                <label style={s.label}>Amount (RWF)</label>
                <input type="number" value={txnForm.amount} onChange={(e) => setTxnForm({ ...txnForm, amount: e.target.value })} style={{ width: '100%' }} />
              </div>
              <div style={s.field}>
                <label style={s.label}>Status</label>
                <select value={txnForm.status} onChange={(e) => setTxnForm({ ...txnForm, status: e.target.value })} style={{ width: '100%' }}>
                  <option value="draft">Draft</option>
                  <option value="posted">Posted</option>
                </select>
              </div>
              <div style={{ ...s.field, gridColumn: '1 / -1' }}>
                <label style={s.label}>Description</label>
                <input value={txnForm.description} onChange={(e) => setTxnForm({ ...txnForm, description: e.target.value })} style={{ width: '100%' }} />
              </div>
            </div>
            <div style={s.modalActions}>
              <button onClick={() => setShowTxnModal(false)} style={s.cancelBtn}>Cancel</button>
              <button onClick={saveTxn} disabled={txnSaving} style={s.primaryBtn}>{txnSaving ? 'Saving...' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  statGrid: { display: 'flex', gap: 16, flexWrap: 'wrap' },
  sectionTitle: { color: t.text, fontSize: 16, fontWeight: 600, margin: '0 0 16px', display: 'flex', alignItems: 'center' },
  alertBox: { background: t.bgHover, borderRadius: 8, padding: '10px 14px', fontSize: 13, color: t.textSecondary },
  filterBtn: { background: t.bgHover, color: t.textSecondary, padding: '6px 14px', borderRadius: 6, fontSize: 13 },
  primaryBtn: { background: t.accent, color: t.bg, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 },
  cancelBtn: { background: t.bgHover, color: t.text },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 },
  modal: { background: t.bgCard, borderRadius: t.radiusLg, padding: 28, width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto' },
  modalTitle: { color: t.text, fontSize: 20, fontWeight: 700, margin: '0 0 20px' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  field: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: { color: t.textSecondary, fontSize: 13, fontWeight: 500 },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 },
};
