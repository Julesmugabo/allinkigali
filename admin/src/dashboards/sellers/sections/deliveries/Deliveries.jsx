/**
 * Deliveries.jsx — which clients deliver, at what fee / minimum / time.
 */
import React from 'react';
import { t } from '../../../../theme';
import { DataTable } from '../../../../components/PageShell';
import { Panel, Loading, ErrorText } from '../../../../components/ui';
import DeliveryCell from '../../../places/sections/list/DeliveryCell';
import { useSellers } from '../../SellersContext';
import { sellersApi } from '../../sellersApi';

export default function Deliveries() {
  const { places, loading, error, changed, notify } = useSellers();
  const save = async (p, body, msg) => {
    try { await sellersApi.quick(p.type, p.id, body); notify(`${p.name}: ${msg}`); changed(); } catch (e) { alert(e.message); }
  };
  const rows = [...places].sort((a, b) => Number(b.delivery_enabled) - Number(a.delivery_enabled) || a.name.localeCompare(b.name));
  return (
    <Panel title={`Delivery partners (${places.filter((p) => p.delivery_enabled).length} of ${places.length})`}>
      <ErrorText>{error}</ErrorText>
      {loading ? <Loading /> : (
        <DataTable
          columns={[
            { key: 'name', label: 'Client', render: (p) => <div><div style={{ fontWeight: 500 }}>{p.name}</div><div style={{ color: t.textMuted, fontSize: 12 }}>{p.type === 'restaurant' ? 'Restaurant' : 'Coffee shop'}</div></div> },
            { key: 'delivery', label: 'Delivery (click the fee to edit)', render: (p) => <DeliveryCell place={p} onSave={(body, msg) => save(p, body, msg)} /> },
            { key: 'min', label: 'Minimum order', render: (p) => (p.delivery_enabled && p.min_order ? `${Number(p.min_order).toLocaleString()} RWF` : '—') },
            { key: 'eta', label: 'Delivery time', render: (p) => (p.delivery_enabled ? p.estimated_time || '—' : '—') },
          ]}
          rows={rows}
          emptyText="No clients yet."
        />
      )}
    </Panel>
  );
}
