/**
 * TablesSetup.jsx — Ku Meza › Tables & QR codes: the owner's one-time setup.
 * Sections (optional), tables, then print a card for every table. A guest
 * scans the card (or types its short code) and orders from that table.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Printer } from 'lucide-react';
import { t } from '../../../theme';
import { PageHeader } from '../../../components/PageShell';
import { ErrorText, Loading } from '../../../components/ui';
import Button from '../../../components/common/Button';
import Flash, { useFlash } from '../../common/Flash';
import { kumezaApi } from '../kumezaApi';
import SectionsPanel from './SectionsPanel';
import TablesPanel from './TablesPanel';
import QrSheet from './QrSheet';

export default function TablesSetup({ me }) {
  const [setup, setSetup] = useState(null);
  const [error, setError] = useState('');
  const [printing, setPrinting] = useState(null); // tables to print
  const [flash, show] = useFlash();

  const load = useCallback(() => kumezaApi.setup().then(setSetup).catch((e) => setError(e.message)), []);
  useEffect(() => { load(); }, [load]);

  // Runs a change, reloads, says how it went. Resolves true when it worked.
  const run = useCallback(async (fn, done) => {
    try { await fn(); show(done); return true; } catch (e) { show(e.message, true); return false; } finally { load(); }
  }, [load, show]);

  if (!setup) return error ? <ErrorText>{error}</ErrorText> : <Loading />;
  const active = setup.tables.filter((tb) => tb.active);
  return (
    <div>
      <PageHeader
        title="Tables & QR codes"
        subtitle="Set up once: sections, tables, then print a card for each table."
        actions={active.length ? <Button icon={Printer} onClick={() => setPrinting(active)}>Print all cards ({active.length})</Button> : null}
      />
      <div style={s.how}>
        Guests scan the card on their table (or type its code at <b>allinkigali.rw/table</b>), see your menu and order. Their first order
        waits until a waiter confirms someone is seated; then it goes straight to the kitchen. Orders only work while you're open, and only
        from people at the table.
      </div>
      <SectionsPanel sections={setup.sections} run={run} api={kumezaApi} />
      <TablesPanel tables={setup.tables} sections={setup.sections} run={run} api={kumezaApi} onPrint={setPrinting} />
      {printing && <QrSheet placeName={me.place.name} tables={printing} onClose={() => setPrinting(null)} />}
      <Flash flash={flash} />
    </div>
  );
}

const s = {
  how: { background: t.bgActive, color: t.textSecondary, borderRadius: t.radiusLg, padding: '12px 16px', fontSize: 13.5, lineHeight: 1.55, marginBottom: 20 },
};
