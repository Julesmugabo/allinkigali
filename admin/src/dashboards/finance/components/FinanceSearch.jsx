/**
 * FinanceSearch.jsx — search transactions, invoices and contacts at once.
 */
import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { t } from '../../../theme';
import { financeApi } from '../financeApi';
import { Money, StatusBadge } from './ui';

export default function FinanceSearch() {
  const [q, setQ] = useState('');
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);

  const run = async (e) => {
    e.preventDefault();
    if (q.trim().length < 2) return;
    setBusy(true);
    try { setRes(await financeApi.search(q.trim())); } catch { setRes({ transactions: [], invoices: [], contacts: [] }); }
    setBusy(false);
  };

  const total = res ? (res.transactions?.length || 0) + (res.invoices?.length || 0) + (res.contacts?.length || 0) : 0;
  return (
    <div style={s.wrap}>
      <form onSubmit={run} style={s.form}>
        <Search size={15} color={t.textMuted} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search finance (ref, description, invoice, contact)" style={s.input} />
        {res && <button type="button" onClick={() => { setRes(null); setQ(''); }} style={s.clear}><X size={14} /></button>}
      </form>
      {res && (
        <div style={s.panel}>
          {busy ? <div style={s.muted}>Searching...</div> : total === 0 ? <div style={s.muted}>No matches for “{q}”.</div> : (
            <>
              {res.transactions?.map((x) => (
                <div key={`t${x.id}`} style={s.row}>
                  <span style={s.kind}>Transaction</span>
                  <span style={{ flex: 1 }}>{x.txn_ref} — {x.description}</span>
                  <Money value={x.amount} type={x.txn_type} /> <StatusBadge status={x.status} />
                </div>
              ))}
              {res.invoices?.map((x) => (
                <div key={`i${x.id}`} style={s.row}>
                  <span style={s.kind}>Invoice</span>
                  <span style={{ flex: 1 }}>{x.invoice_number}{x.contact_name ? ` — ${x.contact_name}` : ''}</span>
                  <Money value={x.total_amount} /> <StatusBadge status={x.status} />
                </div>
              ))}
              {res.contacts?.map((x) => (
                <div key={`c${x.id}`} style={s.row}>
                  <span style={s.kind}>Contact</span>
                  <span style={{ flex: 1 }}>{x.name}</span>
                  <span style={{ color: t.textMuted, fontSize: 12 }}>{x.contact_type}</span>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

const s = {
  wrap: { position: 'relative', marginBottom: 16 },
  form: { display: 'flex', alignItems: 'center', gap: 8, background: t.bgCard, borderRadius: t.radius, padding: '0 12px', maxWidth: 520 },
  input: { flex: 1, background: 'transparent', border: 'none', padding: '10px 0' },
  clear: { background: 'transparent', color: t.textMuted, padding: 4 },
  panel: { background: t.bgCard, borderRadius: t.radius, padding: 12, marginTop: 6, maxWidth: 820, boxShadow: t.shadowLg },
  row: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px', borderBottom: `1px solid ${t.border}`, color: t.text, fontSize: 13 },
  kind: { color: t.accent, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', width: 86 },
  muted: { color: t.textMuted, fontSize: 13, padding: 8 },
};
