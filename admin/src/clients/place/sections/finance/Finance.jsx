/**
 * Finance.jsx — earnings from delivered orders, month by month: what
 * customers paid, the platform's 10% fee, and the net payout.
 */
import React, { useMemo, useState } from 'react';
import { t } from '../../../../theme';
import { DataTable } from '../../../../components/PageShell';
import { Panel, Kpi, KpiGrid } from '../../../../components/ui';
import { useOwner } from '../../OwnerContext';

const FEE = 0.1; // platform commission, as in the original owner dashboard
const rwf = (n) => `${Math.round(n).toLocaleString()} RWF`;
const monthKey = (d) => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`; };
const monthName = (k) => new Date(`${k}-01`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

export default function Finance() {
  const { orders } = useOwner();
  const delivered = orders.filter((o) => o.status === 'delivered');
  const months = useMemo(() => {
    const m = {};
    delivered.forEach((o) => {
      const k = monthKey(o.createdAt);
      m[k] = m[k] || { key: k, orders: 0, food: 0, delivery: 0 };
      m[k].orders += 1; m[k].food += o.subtotal || 0; m[k].delivery += o.deliveryFee || 0;
    });
    return Object.values(m).sort((a, b) => b.key.localeCompare(a.key));
  }, [delivered]);
  const [sel, setSel] = useState(null);
  const cur = months.find((m) => m.key === sel) || months[0] || { orders: 0, food: 0, delivery: 0 };

  return (
    <>
      {months.length > 1 && (
        <select value={cur.key} onChange={(e) => setSel(e.target.value)} style={{ marginBottom: 16 }}>
          {months.map((m) => <option key={m.key} value={m.key}>{monthName(m.key)}</option>)}
        </select>
      )}
      <KpiGrid>
        <Kpi label={`Food sales${cur.key ? ` · ${monthName(cur.key)}` : ''}`} value={rwf(cur.food)} color={t.success} />
        <Kpi label="Platform fee (10%)" value={rwf(cur.food * FEE)} color={t.danger} />
        <Kpi label="Your payout" value={rwf(cur.food * (1 - FEE))} color={t.accent} />
        <Kpi label="Delivered orders" value={cur.orders} hint={`+ ${rwf(cur.delivery)} delivery fees`} />
      </KpiGrid>
      <Panel title="By month">
        <DataTable
          columns={[
            { key: 'key', label: 'Month', render: (m) => monthName(m.key) },
            { key: 'orders', label: 'Orders' },
            { key: 'food', label: 'Food sales', render: (m) => rwf(m.food) },
            { key: 'fee', label: 'Fee', render: (m) => rwf(m.food * FEE) },
            { key: 'net', label: 'Payout', render: (m) => <b>{rwf(m.food * (1 - FEE))}</b> },
          ]}
          rows={months.map((m) => ({ id: m.key, ...m }))}
          emptyText="No delivered orders yet — earnings appear once orders are delivered."
        />
      </Panel>
    </>
  );
}
