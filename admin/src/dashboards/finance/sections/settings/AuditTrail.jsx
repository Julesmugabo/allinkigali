/**
 * AuditTrail.jsx — the latest finance changes: who, what and when.
 */
import React, { useState } from 'react';
import { DataTable } from '../../../../components/PageShell';
import { SelectField } from '../../../../components/form/Fields';
import { useFinanceData } from '../../FinanceContext';
import { financeApi } from '../../financeApi';
import { Panel, Loading, ErrorText } from '../../components/ui';
import { formatDateTime } from '../../../../utils/format';

function summarise(values) {
  if (!values) return '';
  const v = typeof values === 'string' ? (() => { try { return JSON.parse(values); } catch { return values; } })() : values;
  if (typeof v !== 'object') return String(v);
  return Object.entries(v).slice(0, 4).map(([k, val]) => `${k}: ${typeof val === 'object' ? JSON.stringify(val) : val}`).join(' · ');
}

export default function AuditTrail() {
  const [limit, setLimit] = useState('50');
  const { data, loading, error } = useFinanceData(() => financeApi.auditLog(limit), [limit]);
  return (
    <Panel title="Audit trail" actions={(
      <div style={{ width: 160 }}>
        <SelectField value={limit} onChange={setLimit} options={['50', '200', '500'].map((n) => ({ value: n, label: `Last ${n}` }))} />
      </div>
    )}>
      <ErrorText>{error}</ErrorText>
      {loading ? <Loading /> : (
        <DataTable
          columns={[
            { key: 'created_at', label: 'When', render: (r) => formatDateTime(r.created_at) },
            { key: 'user_name', label: 'Who', render: (r) => r.user_name || '—' },
            { key: 'action', label: 'Action' },
            { key: 'entity', label: 'Record', render: (r) => `${r.entity_type} #${r.entity_id}` },
            { key: 'new_values', label: 'Details', render: (r) => <span style={{ fontSize: 12 }}>{summarise(r.new_values || r.old_values)}</span> },
          ]}
          rows={data || []}
          emptyText="No activity recorded yet."
        />
      )}
    </Panel>
  );
}
