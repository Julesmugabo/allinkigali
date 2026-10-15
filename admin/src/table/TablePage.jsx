/**
 * TablePage.jsx — a table's Ku Meza page (allinkigali.rw/t/<token>): the
 * place and the table, the table's running tab with Call waiter and Ask for
 * the bill, the menu with RWF prices, and the guest's order — every price
 * and the total shown before Send.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { tableApi, whereAmI } from './api';
import { useLang } from './i18n';
import useCart from './useCart';
import useTab from './useTab';
import TopBar from './parts/TopBar';
import TabPanel from './parts/TabPanel';
import MenuList from './parts/MenuList';
import CartBar from './parts/CartBar';
import CartSheet from './parts/CartSheet';
import Notice from './parts/Notice';

export default function TablePage({ token }) {
  const [L, lang, setLang] = useLang();
  const [data, setData] = useState(null); // { table, place, menu, tab }
  const [error, setError] = useState(null);
  useEffect(() => { tableApi.table(token).then(setData).catch(setError); }, [token]);

  if (error) return <Notice L={L} lang={lang} setLang={setLang} text={L.err(error)} />;
  if (!data) return <div className="km-loading" aria-busy="true" />;
  return <Ordering token={token} data={data} L={L} lang={lang} setLang={setLang} />;
}

function Ordering({ token, data, L, lang, setLang }) {
  const { table, place, menu } = data;
  const [tab, setTab] = useTab(token, data.tab);
  const cart = useCart(token);
  const [sheet, setSheet] = useState(false);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState('');
  const timer = useRef(null);
  const byId = useMemo(() => new Map(menu.map((d) => [d.id, d])), [menu]);
  useEffect(() => { cart.keepOnly(new Set(byId.keys())); }, [byId]); // eslint-disable-line react-hooks/exhaustive-deps
  const total = cart.lines.reduce((s, l) => s + (byId.get(l.id)?.price || 0) * l.qty, 0);

  const flash = (text) => {
    setToast(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(''), 4000);
  };
  const send = async () => {
    setSending(true);
    try {
      const where = await whereAmI();
      const d = await tableApi.order(token, cart.lines.map((l) => ({ menuItemId: l.id, qty: l.qty, notes: l.notes })), where);
      setTab(d.tab);
      cart.clear();
      setSheet(false);
      flash(L.sent);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) { flash(L.err(e)); }
    setSending(false);
  };
  const cancel = async (order) => {
    if (!window.confirm(L.cancelSure)) return;
    try { setTab((await tableApi.cancel(token, order.id)).tab); } catch (e) { flash(L.err(e)); }
  };
  const request = async (type) => {
    try { setTab((await tableApi.request(token, type)).tab); flash(type === 'bill' ? L.billAsked : L.waiterCalled); } catch (e) { flash(L.err(e)); }
  };

  return (
    <div className={`km${place.type === 'coffeeshop' ? ' km-coffee' : ''}`}>
      <TopBar title={place.name} sub={table.label} lang={lang} setLang={setLang} />
      <main className="km-main">
        {!place.open && <div className="km-closed">{L.closed(place.name)}</div>}
        {tab?.orders.length ? <TabPanel tab={tab} L={L} onCancel={cancel} onRequest={request} /> : null}
        <MenuList menu={menu} L={L} cart={cart} canOrder={place.open} />
      </main>
      {cart.count > 0 && !sheet && <CartBar label={L.viewOrder(cart.count)} total={total} onOpen={() => setSheet(true)} />}
      {sheet && (
        <CartSheet
          L={L} cart={cart} byId={byId} total={total} sending={sending} canOrder={place.open}
          firstOrder={tab?.myStatus !== 'confirmed'} onSend={send} onClose={() => setSheet(false)}
        />
      )}
      {toast && <div className="km-toast" role="status">{toast}</div>}
      <footer className="km-foot">Ku Meza · allinkigali</footer>
    </div>
  );
}
