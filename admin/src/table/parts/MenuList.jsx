/**
 * MenuList.jsx — the place's menu by category (a strip of categories to
 * jump between), each dish with its photo, description, price and + to add.
 */
import React, { useMemo } from 'react';
import { rwf } from './money';
import Stepper from './Stepper';

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-');

export default function MenuList({ menu, L, cart, canOrder }) {
  const groups = useMemo(() => {
    const m = new Map();
    menu.forEach((d) => { if (!m.has(d.category)) m.set(d.category, []); m.get(d.category).push(d); });
    return [...m.entries()];
  }, [menu]);
  if (!menu.length) return <p className="km-empty">{L.emptyMenu}</p>;

  return (
    <>
      {groups.length > 1 && (
        <nav className="km-cats">
          {groups.map(([cat]) => <a key={cat} href={`#cat-${slug(cat)}`}>{cat}</a>)}
        </nav>
      )}
      {groups.map(([cat, dishes]) => (
        <section key={cat} id={`cat-${slug(cat)}`} className="km-cat">
          <h3>{cat}</h3>
          {dishes.map((d) => {
            const qty = cart.qtyOf(d.id);
            return (
              <div key={d.id} className="km-dish">
                {d.photoUrl ? <img src={d.photoUrl} alt="" loading="lazy" decoding="async" /> : null}
                <div className="km-dish-text">
                  <div className="km-dish-name">{d.name}</div>
                  {d.description ? <div className="km-dish-desc">{d.description}</div> : null}
                  <div className="km-price">{rwf(d.price)}</div>
                </div>
                {canOrder && (qty
                  ? <Stepper qty={qty} onAdd={() => cart.add(d.id)} onRemove={() => cart.remove(d.id)} />
                  : <button type="button" className="km-add" aria-label={`${L.add}: ${d.name}`} onClick={() => cart.add(d.id)}>+</button>)}
              </div>
            );
          })}
        </section>
      ))}
    </>
  );
}
