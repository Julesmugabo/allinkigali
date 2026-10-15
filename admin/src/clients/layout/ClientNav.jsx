/**
 * ClientNav.jsx — the sidebar links. A group (e.g. "Ku Meza") opens to show
 * its pages indented underneath, and stays open while you're on one of them.
 */
import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { t } from '../../theme';

function Group({ item, onNavigate }) {
  const { pathname } = useLocation();
  const inside = item.children.some((c) => pathname === c.to);
  const [open, setOpen] = useState(inside);
  useEffect(() => { if (inside) setOpen(true); }, [inside]);
  const Chevron = open ? ChevronDown : ChevronRight;
  return (
    <div>
      <button type="button" onClick={() => setOpen((v) => !v)} style={{ ...s.link, ...(inside ? s.groupOn : {}), width: '100%' }}>
        <item.icon size={17} color={t.lime} strokeWidth={2.2} />
        <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
        <Chevron size={15} />
      </button>
      {open && (
        <div style={s.children}>
          {item.children.map((c) => (
            <NavLink key={c.to} to={c.to} end onClick={onNavigate} style={({ isActive }) => ({ ...s.child, ...(isActive ? s.childOn : {}) })}>
              {c.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ClientNav({ items, onNavigate }) {
  return (
    <nav style={s.nav}>
      {items.map((item) => (item.children
        ? <Group key={item.label} item={item} onNavigate={onNavigate} />
        : (
          <NavLink key={item.to} to={item.to} end onClick={onNavigate} style={({ isActive }) => ({ ...s.link, ...(isActive ? s.linkOn : {}) })}>
            <item.icon size={17} color={t.lime} strokeWidth={2.2} /><span>{item.label}</span>
          </NavLink>
        )))}
    </nav>
  );
}

const s = {
  nav: { display: 'flex', flexDirection: 'column', gap: 2, padding: '8px 12px', flex: 1, overflowY: 'auto' },
  link: { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: t.radius, color: t.textSecondary, fontSize: 14, fontWeight: 500, textDecoration: 'none', background: 'transparent', border: 'none', cursor: 'pointer' },
  linkOn: { background: t.bgActive, color: t.text, fontWeight: 600 },
  groupOn: { color: t.text },
  children: { margin: '2px 0 6px 21px', paddingLeft: 10, borderLeft: `2px solid ${t.borderLight}`, display: 'flex', flexDirection: 'column', gap: 1 },
  child: { padding: '6px 10px', borderRadius: 6, color: t.textSecondary, fontSize: 13, textDecoration: 'none' },
  childOn: { color: t.text, background: t.bgActive, fontWeight: 600, boxShadow: `inset 3px 0 0 ${t.lime}` },
};
