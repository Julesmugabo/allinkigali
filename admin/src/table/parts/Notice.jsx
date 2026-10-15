/**
 * Notice.jsx — a full page with one message (e.g. a table card that no
 * longer works), and the way to type a table's code instead.
 */
import React from 'react';
import TopBar from './TopBar';

export default function Notice({ L, lang, setLang, text }) {
  return (
    <div className="km">
      <TopBar title="Ku Meza" lang={lang} setLang={setLang} />
      <main className="km-main km-notice">
        <p>{text}</p>
        <a className="km-btn km-btn-cta" href="/table">{L.enterCode}</a>
      </main>
    </div>
  );
}
