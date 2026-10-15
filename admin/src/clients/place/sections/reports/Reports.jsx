/**
 * Reports.jsx — download bookings, orders or the menu as CSV.
 */
import React from 'react';
import { Download } from 'lucide-react';
import { t } from '../../../../theme';
import Button from '../../../../components/common/Button';
import { Panel } from '../../../../components/ui';
import { useOwner } from '../../OwnerContext';

const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
function download(name, header, rows) {
  const csv = [header.map(cell).join(','), ...rows.map((r) => r.map(cell).join(','))].join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const { profile, bookings, orders, menu } = useOwner();
  const slug = String(profile.name || 'place').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const reports = [
    {
      title: 'Bookings', count: bookings.length, run: () => download(`${slug}-bookings.csv`,
        ['Date', 'Time', 'Guest', 'Phone', 'Guests', 'Status', 'Decline reason', 'Requested'],
        bookings.map((b) => [String(b.date).slice(0, 10), b.time, b.guestName, b.guestPhone, b.partySize, b.status, b.declineReason, b.createdAt])),
    },
    {
      title: 'Delivery orders', count: orders.length, run: () => download(`${slug}-orders.csv`,
        ['Order', 'Date', 'Customer', 'Phone', 'Address', 'Items', 'Food', 'Delivery fee', 'Total', 'Payment', 'Status'],
        orders.map((o) => [o.code, o.createdAt, o.customerName, o.customerPhone, o.address, (o.items || []).map((i) => `${i.qty || i.quantity || 1}x ${i.name}`).join('; '), o.subtotal, o.deliveryFee, o.total, o.paymentMethod, o.status])),
    },
    {
      title: 'Menu', count: menu.length, run: () => download(`${slug}-menu.csv`,
        ['Category', 'Item', 'Price (RWF)', 'Available', 'Description'],
        menu.map((i) => [i.category, i.name, i.price, i.available !== false ? 'yes' : 'sold out', i.description])),
    },
  ];
  return (
    <div style={s.grid}>
      {reports.map((r) => (
        <Panel key={r.title} title={r.title} style={{ marginBottom: 0 }}>
          <p style={{ color: t.textSecondary, fontSize: 13, margin: '0 0 12px' }}>{r.count} row(s), opens in Excel or Google Sheets.</p>
          <Button variant="info" icon={Download} disabled={!r.count} onClick={r.run}>Download CSV</Button>
        </Panel>
      ))}
    </div>
  );
}

const s = { grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 } };
