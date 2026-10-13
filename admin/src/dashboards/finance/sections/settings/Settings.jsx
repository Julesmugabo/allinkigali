/**
 * Settings.jsx — finance configuration menu. Each item is its own page in
 * this folder; the chosen page is kept in the URL (?page=accounts) so a
 * refresh or shared link lands on the same screen.
 */
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { t } from '../../../../theme';
import Button from '../../../../components/common/Button';
import OrgProfile from './OrgProfile';
import ChartOfAccounts from './ChartOfAccounts';
import BankAccounts from './BankAccounts';
import Departments from './Departments';
import Projects from './Projects';
import Periods from './Periods';
import Thresholds from './Thresholds';
import AuditTrail from './AuditTrail';

const PAGES = [
  { key: 'org', label: 'Organisation profile', desc: 'Legal name, contacts, currency, fiscal year start', C: OrgProfile },
  { key: 'accounts', label: 'Chart of accounts', desc: 'Income, expense, asset, liability and equity accounts', C: ChartOfAccounts },
  { key: 'banks', label: 'Bank & cash accounts', desc: 'Where money is held', C: BankAccounts },
  { key: 'departments', label: 'Departments', desc: 'Used to split budgets', C: Departments },
  { key: 'projects', label: 'Projects & funds', desc: 'Track spending per project or donor fund', C: Projects },
  { key: 'periods', label: 'Accounting periods', desc: 'Lock closed months so they can’t be changed', C: Periods },
  { key: 'thresholds', label: 'Approval limits', desc: 'Amounts that require sign-off', C: Thresholds },
  { key: 'audit', label: 'Audit trail', desc: 'Who changed what, and when', C: AuditTrail },
];

export default function Settings() {
  const [params, setParams] = useSearchParams();
  const current = PAGES.find((p) => p.key === params.get('page'));

  if (current) {
    const Page = current.C;
    return (
      <>
        <Button variant="ghost" icon={ArrowLeft} onClick={() => setParams({})} style={{ marginBottom: 14 }}>Settings</Button>
        <Page />
      </>
    );
  }

  return (
    <div style={s.grid}>
      {PAGES.map((p) => (
        <button key={p.key} onClick={() => setParams({ page: p.key })} style={s.card}>
          <div style={s.title}>{p.label}</div>
          <div style={s.desc}>{p.desc}</div>
        </button>
      ))}
    </div>
  );
}

const s = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 },
  card: { background: t.bgCard, borderRadius: t.radiusLg, padding: 18, textAlign: 'left' },
  title: { color: t.text, fontWeight: 600, fontSize: 15, marginBottom: 4 },
  desc: { color: t.textMuted, fontSize: 12, fontWeight: 400 },
};
