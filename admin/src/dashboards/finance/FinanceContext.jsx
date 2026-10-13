/**
 * FinanceContext.jsx — state every finance section shares:
 *   - the reporting period (and its from/to dates)
 *   - lookups used by forms (accounts, bank accounts, departments, contacts, projects)
 *   - a `version` counter: any section that changes data calls `changed()`,
 *     and every section reloading on `version` picks the change up
 *   - the transaction / transfer / journal modals, which several sections open
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { financeApi } from './financeApi';

const Ctx = createContext(null);

function rangeFor(period, customFrom, customTo) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  let start;
  let end;
  if (period === 'this_month') { start = new Date(y, m, 1); end = new Date(y, m + 1, 0); }
  else if (period === 'last_month') { start = new Date(y, m - 1, 1); end = new Date(y, m, 0); }
  else if (period === 'this_quarter') { const q = Math.floor(m / 3) * 3; start = new Date(y, q, 1); end = new Date(y, q + 3, 0); }
  else if (period === 'custom' && customFrom && customTo) { return { from: customFrom, to: customTo }; }
  else { start = new Date(y, 0, 1); end = new Date(y, 11, 31); }
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { from: iso(start), to: iso(end) };
}

export function FinanceProvider({ children }) {
  const [period, setPeriod] = useState('this_month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const range = useMemo(() => rangeFor(period, customFrom, customTo), [period, customFrom, customTo]);

  const [lookups, setLookups] = useState({ accounts: [], bankAccounts: [], departments: [], contacts: [], projects: [] });
  const [version, setVersion] = useState(0);
  const changed = useCallback(() => setVersion((v) => v + 1), []);

  // modal: { kind: 'txn' | 'transfer' | 'journal', txnType?, editing? }
  const [modal, setModal] = useState(null);
  const openTxn = useCallback((txnType, editing = null) => setModal({ kind: 'txn', txnType, editing }), []);
  const openTransfer = useCallback(() => setModal({ kind: 'transfer' }), []);
  const openJournal = useCallback(() => setModal({ kind: 'journal' }), []);
  const closeModal = useCallback(() => setModal(null), []);

  // short confirmation shown after a successful save ("Payment recorded")
  const [toast, setToast] = useState(null);
  const notify = useCallback((text) => {
    setToast({ text, id: Date.now() });
    setTimeout(() => setToast((cur) => (cur && Date.now() - cur.id >= 2900 ? null : cur)), 3000);
  }, []);

  const reloadLookups = useCallback(async () => {
    const safe = (p) => p.catch(() => []);
    const [accounts, bankAccounts, departments, contacts, projects] = await Promise.all([
      safe(financeApi.accounts()), safe(financeApi.bankAccounts()), safe(financeApi.departments()),
      safe(financeApi.contacts()), safe(financeApi.projectsAll()),
    ]);
    setLookups({ accounts, bankAccounts, departments, contacts, projects });
  }, []);

  useEffect(() => { reloadLookups(); }, [reloadLookups, version]);

  const value = {
    period, setPeriod, customFrom, setCustomFrom, customTo, setCustomTo, range,
    ...lookups, reloadLookups,
    version, changed,
    modal, openTxn, openTransfer, openJournal, closeModal,
    toast, notify,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFinance() {
  return useContext(Ctx);
}

/** Load something whenever the period or data version changes. */
export function useFinanceData(loader, deps = []) {
  const { version, range } = useFinance();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try { setData(await loader(range)); }
    catch (e) { setError(e.message); }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, ...deps]);
  useEffect(() => { reload(); }, [reload, version]);
  return { data, loading, error, reload, setData };
}
