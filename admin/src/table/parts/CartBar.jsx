/** CartBar.jsx — the button pinned to the bottom while dishes are picked. */
import React from 'react';
import { rwf } from './money';

export default function CartBar({ label, total, onOpen }) {
  return (
    <div className="km-cartbar">
      <button type="button" className="km-btn km-btn-cta" onClick={onOpen}>
        <span>{label}</span><b>{rwf(total)}</b>
      </button>
    </div>
  );
}
