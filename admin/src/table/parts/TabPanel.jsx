/**
 * TabPanel.jsx — the table's running tab, live: every order from every phone
 * at the table with its status in words ("Your waiter is on it"), the
 * table's total, Call waiter and Ask for the bill. A guest can cancel their
 * own order until the kitchen starts it.
 */
import React from 'react';
import { rwf } from './money';

const CANCELLABLE = ['needs_confirm', 'placed', 'accepted'];

export default function TabPanel({ tab, L, onCancel, onRequest }) {
  const orders = tab.orders.filter((o) => o.mine || !['cancelled', 'rejected'].includes(o.status));
  return (
    <section className="km-tab" aria-live="polite">
      <h2>{L.tableOrders}</h2>
      {orders.map((o) => (
        <div key={o.id} className={`km-order st-${o.status}`}>
          <div className="km-order-head">
            <span className="km-pill">{L.status[o.status] || o.status}</span>
            <span className="km-who">{o.mine ? L.yours : L.someoneElse}</span>
          </div>
          <ul className="km-order-items">
            {o.items.map((i) => (
              <li key={i.id}>{i.qty}× {i.name}{i.notes ? <em> — {i.notes}</em> : null}</li>
            ))}
          </ul>
          <div className="km-order-foot">
            <span>{rwf(o.total)}</span>
            {o.mine && CANCELLABLE.includes(o.status) && <button type="button" className="km-link" onClick={() => onCancel(o)}>{L.cancel}</button>}
          </div>
        </div>
      ))}
      <div className="km-tab-total"><span>{L.tableTotal}</span><b>{rwf(tab.total)}</b></div>
      <div className="km-actions">
        <button type="button" className="km-btn km-btn-ghost" disabled={tab.waiterCalled} onClick={() => onRequest('call_waiter')}>
          {tab.waiterCalled ? L.waiterCalled : L.callWaiter}
        </button>
        <button type="button" className="km-btn km-btn-ghost" disabled={tab.billRequested} onClick={() => onRequest('bill')}>
          {tab.billRequested ? L.billAsked : L.askBill}
        </button>
      </div>
    </section>
  );
}
