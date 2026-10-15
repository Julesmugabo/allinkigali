/**
 * ClientLayout.jsx — the client dashboard's frame: sidebar (logo, the place
 * and the signed-in person, a switcher for owners with several places, the
 * menu) and the page area, with the support banner on top when allinkigali
 * is looking in. On phones — and on kitchen screens and connected tablets,
 * which use the whole screen — the sidebar slides in from a menu button.
 */
import React, { useEffect, useState } from 'react';
import { Menu, X, LogOut } from 'lucide-react';
import { t } from '../../theme';
import { session, ROLE_LABEL, PLACE_LABEL } from '../session';
import { navFor } from '../nav';
import ClientNav from './ClientNav';
import SupportBanner from './SupportBanner';

const isPhone = () => window.innerWidth < 900;

export default function ClientLayout({ me, onChanged, children }) {
  const slim = me.role === 'kitchen' || me.kind === 'device';
  const sliding = () => slim || isPhone();
  const [open, setOpen] = useState(!sliding());
  useEffect(() => {
    const onResize = () => setOpen(!sliding());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [slim]); // eslint-disable-line react-hooks/exhaustive-deps
  const close = () => { if (sliding()) setOpen(false); };
  const switchPlace = async (memberId) => {
    try { await session.switchPlace(memberId); onChanged(); } catch (e) { alert(e.message); }
  };

  return (
    <div style={s.layout}>
      {sliding() && <button type="button" onClick={() => setOpen((v) => !v)} style={s.toggle} aria-label="Menu">{open ? <X size={20} /> : <Menu size={20} />}</button>}
      {open && sliding() && <div onClick={() => setOpen(false)} style={s.overlay} />}
      <aside style={{ ...s.side, ...(open ? s.sideOpen : {}) }}>
        <div style={{ ...s.brand, paddingLeft: sliding() ? 64 : 20 }}>
          <img src="/logo-wordmark.png" alt="AllinKigali" style={{ height: 26 }} />
          <div style={s.sub}>Business</div>
        </div>
        <div style={s.place}>
          {me.places?.length > 1 ? (
            <select value={me.places.find((p) => p.id === me.place.id && p.type === me.place.type)?.memberId} onChange={(e) => switchPlace(e.target.value)} style={s.select}>
              {me.places.map((p) => <option key={p.memberId} value={p.memberId}>{p.name}</option>)}
            </select>
          ) : <div style={s.placeName}>{me.place.name}</div>}
          <div style={s.placeMeta}>{PLACE_LABEL[me.place.type]} · {me.support ? 'allinkigali support' : `${me.name} (${ROLE_LABEL[me.role] || me.role})`}</div>
        </div>
        <ClientNav items={navFor(me)} onNavigate={close} />
        {!me.support && (
          <button type="button" onClick={() => { session.signOut(); onChanged(); }} style={s.out}><LogOut size={16} /> Sign out</button>
        )}
      </aside>
      <main style={{ ...s.main, marginLeft: open && !sliding() ? 260 : 0 }}>
        {me.support && <SupportBanner me={me} onChanged={onChanged} />}
        <div style={{ ...s.content, paddingTop: sliding() ? 64 : 24 }}>{children}</div>
      </main>
    </div>
  );
}

const s = {
  layout: { display: 'flex', minHeight: '100vh', background: t.bg, color: t.text, fontFamily: t.font },
  toggle: { position: 'fixed', top: 12, left: 12, zIndex: 60, background: t.bgCard, color: t.text, border: `1px solid ${t.borderLight}`, borderRadius: 10, padding: 8 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 },
  side: { position: 'fixed', top: 0, bottom: 0, left: 0, width: 260, background: t.bgSidebar, borderRight: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', transform: 'translateX(-100%)', transition: 'transform 0.2s ease', zIndex: 50 },
  sideOpen: { transform: 'translateX(0)' },
  brand: { padding: '18px 20px 10px' },
  sub: { color: t.accent, fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 4 },
  place: { margin: '6px 12px 8px', padding: 12, borderRadius: 10, background: t.bgCard },
  placeName: { fontWeight: 700, fontSize: 15 },
  placeMeta: { color: t.textMuted, fontSize: 12, marginTop: 4 },
  select: { width: '100%', background: t.bg, color: t.text, border: `1px solid ${t.borderLight}`, borderRadius: 8, padding: '7px 8px', fontWeight: 700, fontSize: 14 },
  out: { display: 'flex', alignItems: 'center', gap: 8, margin: 12, padding: '10px 12px', background: 'transparent', color: t.danger, border: 'none', cursor: 'pointer', fontSize: 14 },
  main: { flex: 1, minWidth: 0, transition: 'margin-left 0.2s ease' },
  content: { padding: '24px 24px 60px', maxWidth: 1280, margin: '0 auto' },
};
