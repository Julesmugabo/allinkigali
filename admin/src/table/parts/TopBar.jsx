/**
 * TopBar.jsx — the page's header: the place (or "Ku Meza"), the table, and
 * the language switch.
 */
import React from 'react';
import { LANGS } from '../i18n';

export default function TopBar({ title, sub, lang, setLang }) {
  return (
    <header className="km-top">
      <div className="km-top-text">
        <div className="km-title">{title}</div>
        {sub ? <div className="km-sub">{sub}</div> : null}
      </div>
      <div className="km-langs" role="group" aria-label="Language">
        {LANGS.map(([code, name]) => (
          <button key={code} type="button" title={name} aria-pressed={lang === code} className={lang === code ? 'on' : ''} onClick={() => setLang(code)}>
            {code.toUpperCase()}
          </button>
        ))}
      </div>
    </header>
  );
}
