/**
 * CodePage.jsx — allinkigali.rw/table: for a phone that can't scan, type
 * the short code printed on the table's card (e.g. K7P-3F9) to open that
 * table's menu.
 */
import React, { useState } from 'react';
import { tableApi } from './api';
import { useLang } from './i18n';
import TopBar from './parts/TopBar';

const tidy = (v) => {
  const c = v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  return c.length > 3 ? `${c.slice(0, 3)}-${c.slice(3)}` : c;
};

export default function CodePage() {
  const [L, lang, setLang] = useLang();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const { token } = await tableApi.byCode(code);
      window.location.assign(`/t/${token}`);
    } catch (err) {
      setError(L.err(err));
      setBusy(false);
    }
  };

  return (
    <div className="km">
      <TopBar title="Ku Meza" sub="allinkigali" lang={lang} setLang={setLang} />
      <main className="km-main km-code">
        <h1>{L.orderAtTable}</h1>
        <p>{L.typeCode}</p>
        <form onSubmit={submit}>
          <input
            value={code} onChange={(e) => setCode(tidy(e.target.value))} placeholder="K7P-3F9"
            autoCapitalize="characters" autoComplete="off" autoCorrect="off" spellCheck={false} aria-label={L.typeCode}
          />
          <button type="submit" className="km-btn km-btn-cta" disabled={busy || code.length !== 7}>{L.openMenu}</button>
        </form>
        {error && <p className="km-error" role="alert">{error}</p>}
        <p className="km-fine">{L.orScan}</p>
      </main>
    </div>
  );
}
