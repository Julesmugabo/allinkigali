/**
 * Reports.jsx — editorial reports over the article list, with CSV export
 * and print.
 */
import React, { useMemo, useState } from 'react';
import { Download, Printer } from 'lucide-react';
import { t } from '../../../../theme';
import { DataTable } from '../../../../components/PageShell';
import Button from '../../../../components/common/Button';
import { Panel, fmtNum } from '../../../../components/ui';
import { useNews } from '../../NewsContext';
import { displayStatus, fmtDate } from '../../constants';
import StatusBadge from '../../components/StatusBadge';

const REPORTS = [
  { key: 'published', label: 'Published', pick: (a) => a.status === 'published' && !a.isArchived },
  { key: 'drafts', label: 'Drafts backlog', pick: (a) => a.status === 'draft' && !a.isArchived },
  { key: 'pending', label: 'Pending approval', pick: (a) => a.status === 'pending' && !a.isArchived },
  { key: 'breaking', label: 'Breaking news log', pick: (a) => a.isBreaking },
  { key: 'sponsored', label: 'Sponsored', pick: (a) => a.isSponsored || (a.labels || []).includes('sponsored') },
  { key: 'archived', label: 'Archive inventory', pick: (a) => a.isArchived },
];

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

export default function Reports() {
  const { articles, categoryLabel } = useNews();
  const [key, setKey] = useState('published');
  const report = REPORTS.find((r) => r.key === key);
  const rows = useMemo(() => articles.filter(report.pick), [articles, report]);
  const reads = rows.reduce((sum, a) => sum + (a.views || 0), 0);

  const exportCsv = () => {
    const lines = [['Title', 'Category', 'Source', 'Status', 'Reads', 'Published'].map(csvCell).join(',')]
      .concat(rows.map((a) => [a.title, categoryLabel(a.category), a.source, displayStatus(a), a.views || 0, a.publishedAt || ''].map(csvCell).join(',')));
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url; link.download = `news-${key}-report.csv`; link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div style={s.chips}>
        {REPORTS.map((r) => (
          <button key={r.key} onClick={() => setKey(r.key)} style={{ ...s.chip, ...(key === r.key ? s.chipOn : {}) }}>
            {r.label} ({articles.filter(r.pick).length})
          </button>
        ))}
      </div>
      <Panel
        title={`${report.label} — ${rows.length} article(s), ${fmtNum(reads)} reads`}
        actions={(
          <>
            <Button variant="ghost" icon={Download} disabled={!rows.length} onClick={exportCsv}>Export CSV</Button>
            <Button variant="ghost" icon={Printer} disabled={!rows.length} onClick={() => window.print()}>Print</Button>
          </>
        )}
      >
        <DataTable
          columns={[
            { key: 'title', label: 'Title', render: (a) => <span style={{ fontWeight: 500 }}>{a.title}</span> },
            { key: 'category', label: 'Category', render: (a) => categoryLabel(a.category) },
            { key: 'status', label: 'Status', render: (a) => <StatusBadge status={displayStatus(a)} /> },
            { key: 'views', label: 'Reads', render: (a) => fmtNum(a.views) },
            { key: 'publishedAt', label: 'Published', render: (a) => fmtDate(a.publishedAt) },
          ]}
          rows={rows}
          emptyText="No articles in this report."
        />
      </Panel>
    </>
  );
}

const s = {
  chips: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 },
  chip: { padding: '6px 12px', borderRadius: 20, fontSize: 13, background: t.bgCard, color: t.textSecondary },
  chipOn: { background: t.bgActive, color: t.accent },
};
