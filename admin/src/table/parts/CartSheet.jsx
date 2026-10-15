/**
 * CartSheet.jsx — the guest's order before sending: each dish with its
 * quantity, price and a note for the kitchen; the full total ("menu prices
 * only"); and, for a phone's first order, why a waiter confirms it first.
 */
import React from 'react';
import { rwf } from './money';
import Stepper from './Stepper';

export default function CartSheet({ L, cart, byId, total, sending, canOrder, firstOrder, onSend, onClose }) {
  return (
    <div className="km-sheet-bg" onClick={onClose}>
      <div className="km-sheet" role="dialog" aria-label={L.yourOrder} onClick={(e) => e.stopPropagation()}>
        <div className="km-sheet-head">
          <h2>{L.yourOrder}</h2>
          <button type="button" className="km-x" aria-label="×" onClick={onClose}>×</button>
        </div>
        {cart.lines.map((l) => {
          const d = byId.get(l.id);
          if (!d) return null;
          return (
            <div key={l.id} className="km-line">
              <div className="km-line-top">
                <span className="km-line-name">{d.name}</span>
                <Stepper qty={l.qty} onAdd={() => cart.add(l.id)} onRemove={() => cart.remove(l.id)} />
                <b className="km-line-price">{rwf(d.price * l.qty)}</b>
              </div>
              <input className="km-note" value={l.notes} maxLength={200} placeholder={L.notePlaceholder} aria-label={L.note} onChange={(e) => cart.setNotes(l.id, e.target.value)} />
            </div>
          );
        })}
        <div className="km-total"><span>{L.total}</span><b>{rwf(total)}</b></div>
        <p className="km-fine">{L.noFees}</p>
        {firstOrder && <p className="km-fine">{L.firstOrder} {L.location}</p>}
        <button type="button" className="km-btn km-btn-cta km-send" disabled={sending || !cart.count || !canOrder} onClick={onSend}>
          {sending ? L.sending : <><span>{L.send}</span><b>{rwf(total)}</b></>}
        </button>
      </div>
    </div>
  );
}
