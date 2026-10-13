/**
 * FinanceDashboard.jsx — the finance module's shell. Sections are picked
 * from the portal sidebar (see ./nav.js); each has its own URL,
 * /finance/<section>. The shell adds the period picker, finance-wide search,
 * the shared transaction forms, and the confirmation toast.
 * Every section lives in its own folder under ./sections.
 */
import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageShell';
import { Toast } from '../../components/ui';
import { FinanceProvider, useFinance } from './FinanceContext';
import { SECTIONS } from './constants';
import PeriodPicker from './components/PeriodPicker';
import FinanceSearch from './components/FinanceSearch';
import TransactionModals from './sections/transactions/TransactionModals';

import Overview from './sections/overview/Overview';
import Transactions from './sections/transactions/Transactions';
import Invoices from './sections/invoices/Invoices';
import IncomeExpenses from './sections/income/IncomeExpenses';
import Approvals from './sections/approvals/Approvals';
import Budgets from './sections/budgets/Budgets';
import Reports from './sections/reports/Reports';
import Reconciliation from './sections/reconciliation/Reconciliation';
import Recurring from './sections/recurring/Recurring';
import Contacts from './sections/contacts/Contacts';
import Documents from './sections/documents/Documents';
import ImportExport from './sections/import/ImportExport';
import Alerts from './sections/alerts/Alerts';
import Settings from './sections/settings/Settings';

const VIEWS = {
  overview: Overview,
  transactions: Transactions,
  invoices: Invoices,
  income: () => <IncomeExpenses type="income" />,
  expenses: () => <IncomeExpenses type="expense" />,
  approvals: Approvals,
  budgets: Budgets,
  reports: Reports,
  reconciliation: Reconciliation,
  recurring: Recurring,
  contacts: Contacts,
  documents: Documents,
  import: ImportExport,
  alerts: Alerts,
  settings: Settings,
};

// Sections whose numbers depend on the selected period.
const PERIOD_SECTIONS = new Set(['overview', 'transactions', 'income', 'expenses', 'reports', 'import']);

function FinanceToast() {
  const { toast } = useFinance();
  return <Toast toast={toast} />;
}

function Shell() {
  const { section = 'overview' } = useParams();
  const View = VIEWS[section];
  if (!View) return <Navigate to="/finance" replace />;
  const label = SECTIONS.find((x) => x.key === section)?.label;

  return (
    <div>
      <PageHeader title="Finance" subtitle={label} />
      <FinanceSearch />
      {PERIOD_SECTIONS.has(section) && <PeriodPicker />}
      <View />
      <TransactionModals />
      <FinanceToast />
    </div>
  );
}

export default function FinanceDashboard() {
  return (
    <FinanceProvider>
      <Shell />
    </FinanceProvider>
  );
}
