/**
 * Alerts.jsx — finance notifications (overdue invoices, budget overruns,
 * pending approvals). "Check now" asks the server to scan for new ones.
 */
import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { t } from '../../../../theme';
import Button from '../../../../components/common/Button';
import { useFinance, useFinanceData } from '../../FinanceContext';
import { financeApi } from '../../financeApi';
import { Panel, Loading, ErrorText } from '../../components/ui';
import { formatDateTime } from '../../../../utils/format';

export default function Alerts() {
  const { changed, notify } = useFinance();
  const [checking, setChecking] = useState(false);
  const { data, loading, error } = useFinanceData(() => financeApi.financeNotifications());

  const check = async () => {
    setChecking(true);
    try {
      const r = await financeApi.checkFinanceNotifications();
      const n = r?.notifications_created ?? 0;
      notify(n ? `${n} new alert(s)` : 'No new alerts');
      changed();
    } catch (e) { alert(e.message); }
    setChecking(false);
  };

  const read = async (n) => {
    try { await financeApi.markNotificationRead(n.id); changed(); } catch (e) { alert(e.message); }
  };

  const list = data || [];
  return (
    <Panel title="Finance alerts" actions={<Button variant="info" icon={RefreshCw} onClick={check} disabled={checking}>{checking ? 'Checking...' : 'Check now'}</Button>}>
      <ErrorText>{error}</ErrorText>
      {loading ? <Loading /> : list.length === 0 ? (
        <div style={s.empty}>No alerts. Use "Check now" to scan for overdue invoices and other issues.</div>
      ) : list.map((n) => (
        <div key={n.id} style={{ ...s.row, ...(n.is_read ? {} : s.unread) }}>
          <div style={{ flex: 1 }}>
            <div style={s.title}>{n.title}</div>
            <div style={s.body}>{n.body}</div>
            <div style={s.meta}>{formatDateTime(n.created_at)}</div>
          </div>
          {!n.is_read && <Button size="sm" variant="ghost" onClick={() => read(n)}>Mark read</Button>}
        </div>
      ))}
    </Panel>
  );
}

const s = {
  empty: { color: t.textMuted, fontSize: 14, padding: '20px 0' },
  row: { display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 0', borderBottom: `1px solid ${t.border}` },
  unread: { borderLeft: `3px solid ${t.accent}`, paddingLeft: 10 },
  title: { color: t.text, fontWeight: 600, fontSize: 14 },
  body: { color: t.textSecondary, fontSize: 13, marginTop: 2 },
  meta: { color: t.textMuted, fontSize: 12, marginTop: 4 },
};
