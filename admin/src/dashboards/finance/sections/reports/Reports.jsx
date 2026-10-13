/**
 * Reports.jsx — pick a statement, run it for the selected period, export
 * to CSV where the server supports it.
 */
import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { t } from '../../../../theme';
import Button from '../../../../components/common/Button';
import { useFinance } from '../../FinanceContext';
import { financeApi } from '../../financeApi';
import { REPORT_TYPES } from '../../constants';
import { Panel, Loading, ErrorText } from '../../components/ui';
import ReportView from './ReportView';

export default function Reports() {
  const { range } = useFinance();
  const [selected, setSelected] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!selected) return;
    let live = true;
    setLoading(true); setError('');
    financeApi.report(selected, range)
      .then((d) => live && setData(d))
      .catch((e) => live && setError(e.message))
      .finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [selected, range]);

  const meta = REPORT_TYPES.find((r) => r.key === selected);
  const exportCsv = async () => {
    try { await financeApi.exportReport(selected, range); } catch (e) { alert(e.message); }
  };

  return (
    <>
      <div style={s.grid}>
        {REPORT_TYPES.map((r) => (
          <button key={r.key} onClick={() => { setData(null); setSelected(r.key); }}
            style={{ ...s.card, ...(selected === r.key ? s.cardActive : {}) }}>
            <div style={s.cardTitle}>{r.label}</div>
            <div style={s.cardDesc}>{r.desc}</div>
          </button>
        ))}
      </div>
      {selected && (
        <Panel
          title={`${meta?.label} · ${range.from} → ${range.to}`}
          actions={meta?.csv ? <Button variant="ghost" icon={Download} onClick={exportCsv}>Export CSV</Button> : null}
        >
          <ErrorText>{error}</ErrorText>
          {loading || !data ? <Loading /> : <ReportView kind={selected} data={data} />}
        </Panel>
      )}
    </>
  );
}

const s = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginBottom: 20 },
  card: { background: t.bgCard, borderRadius: t.radiusLg, padding: 16, textAlign: 'left', border: '1px solid transparent' },
  cardActive: { borderColor: t.accent, background: t.bgActive },
  cardTitle: { color: t.text, fontWeight: 600, fontSize: 14, marginBottom: 4 },
  cardDesc: { color: t.textMuted, fontSize: 12, fontWeight: 400 },
};
