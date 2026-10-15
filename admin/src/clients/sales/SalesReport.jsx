/**
 * SalesReport.jsx — the client's own sales (their money, not allinkigali's):
 * dine-in takings from Ku Meza tables closed as paid, plus delivered Order
 * Food orders — per day (Kigali time), by payment method and by who closed
 * the table. Download as a spreadsheet (CSV).
 */
import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { t } from '../../theme';
import { apiFetch } from '../../api';
import { PageHeader, DataTable, Tabs } from '../../components/PageShell';
import { Panel, Kpi, KpiGrid, ErrorText, Loading } from '../../components/ui';
import BarList from '../../components/ui/BarList';
import Button from '../../components/common/Button';
import { rwf } from '../common/format';
import { downloadCsv } from './csv';

const PERIODS = [{ key: 7, label: '7 days' }, { key: 30, label: '30 days' }, { key: 90, label: '90 days' }, { key: 365, label: '12 months' }];
const METHOD = { cash: 'Cash', momo: 'MoMo', card: 'Card' };

export default function SalesReport({ me }) {
  const [days, setDays] = useState(30);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    setReport(null);
    apiFetch(`/clients/sales?days=${days}`).then(setReport).catch((e) => setError(e.message));
  }, [days]);

  const download = () => downloadCsv(`sales-${days}-days.csv`, [
    ['Date', 'Dine-in (RWF)', 'Tables', 'Order Food (RWF)', 'Deliveries', 'Total (RWF)'],
    ...report.byDay.map((d) => [d.date, d.dineIn, d.tables, d.delivery, d.deliveryOrders, d.dineIn + d.delivery]),
  ]);

  const header = (
    <PageHeader
      title="Sales report"
      subtitle={`${me.place.name} · your takings — only you and your team see them`}
      actions={report?.byDay.length ? <Button variant="ghost" icon={Download} onClick={download}>Download</Button> : null}
    />
  );
  if (!report) return <>{header}{error ? <ErrorText>{error}</ErrorText> : <Loading />}</>;
  const { totals } = report;
  const all = totals.dineIn + totals.delivery;
  const columns = [
    { key: 'date', label: 'Day', render: (d) => new Date(`${d.date}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' }) },
    { key: 'dineIn', label: 'Dine-in', render: (d) => (d.tables ? `${rwf(d.dineIn)} · ${d.tables} table${d.tables === 1 ? '' : 's'}` : '—') },
    { key: 'delivery', label: 'Order Food', render: (d) => (d.deliveryOrders ? `${rwf(d.delivery)} · ${d.deliveryOrders} order${d.deliveryOrders === 1 ? '' : 's'}` : '—') },
    { key: 'total', label: 'Total', render: (d) => <b>{rwf(d.dineIn + d.delivery)}</b> },
  ];

  return (
    <div>
      {header}
      <Tabs tabs={PERIODS} active={days} onChange={setDays} />
      <KpiGrid>
        <Kpi label="Total sales" value={rwf(all)} color={t.success} />
        <Kpi label="Dine-in (Ku Meza)" value={rwf(totals.dineIn)} hint={`${totals.tables} table${totals.tables === 1 ? '' : 's'} paid`} />
        <Kpi label="Order Food deliveries" value={rwf(totals.delivery)} hint={`${totals.deliveryOrders} delivered`} color="#A78BFA" />
        <Kpi label="Average per table" value={totals.tables ? rwf(Math.round(totals.dineIn / totals.tables)) : '—'} color={t.textSecondary} />
      </KpiGrid>
      <div style={s.two}>
        <Panel title="Paid with" style={{ flex: 1, minWidth: 280 }}>
          <BarList rows={report.byMethod.map((m) => ({ key: m.method, label: `${METHOD[m.method] || m.method} · ${m.tables}`, value: m.total }))} color={t.success} empty="No tables closed yet." />
        </Panel>
        <Panel title="Closed by" style={{ flex: 1, minWidth: 280 }}>
          <BarList rows={report.byStaff.map((p) => ({ key: p.name, label: `${p.name} · ${p.tables}`, value: p.total }))} empty="No tables closed yet." />
        </Panel>
      </div>
      <Panel title="Day by day">
        <DataTable columns={columns} rows={report.byDay.map((d) => ({ ...d, id: d.date }))} emptyText="No sales in this period yet." />
      </Panel>
    </div>
  );
}

const s = {
  two: { display: 'flex', gap: 20, flexWrap: 'wrap' },
};
