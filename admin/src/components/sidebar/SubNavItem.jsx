/**
 * SubNavItem.jsx — one sub-item under a dashboard in the sidebar. An item
 * with its own `children` (e.g. News › Ads › App ads / Web ads) shows them
 * nested underneath it, one level further in, opening while you're on any
 * of them or when its chevron is clicked.
 */
import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { t } from '../../theme';

export default function SubNavItem({ item, onNavigate }) {
  const { pathname } = useLocation();
  const kids = item.children || [];
  const inside = kids.some((c) => pathname === c.to);
  const [open, setOpen] = useState(inside);
  useEffect(() => { if (inside) setOpen(true); }, [inside]);

  if (!kids.length) {
    return (
      <NavLink to={item.to} end onClick={onNavigate} style={({ isActive }) => ({ ...s.child, ...(isActive ? s.childActive : {}) })}>
        {item.label}
      </NavLink>
    );
  }

  const Chevron = open ? ChevronDown : ChevronRight;
  return (
    <div>
      <button type="button" onClick={() => setOpen((v) => !v)} style={{ ...s.child, ...s.group, ...(inside ? s.groupActive : {}) }}>
        <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
        <Chevron size={14} />
      </button>
      {open && (
        <div style={s.nested}>
          {kids.map((c) => <SubNavItem key={c.to} item={c} onNavigate={onNavigate} />)}
        </div>
      )}
    </div>
  );
}

const s = {
  child: { display: 'block', padding: '6px 10px', borderRadius: 6, color: t.textMuted, fontSize: 13, textDecoration: 'none' },
  childActive: { color: t.accent, background: 'rgba(56,189,248,0.08)', fontWeight: 600 },
  group: { display: 'flex', alignItems: 'center', width: '100%', background: 'transparent', border: 'none', cursor: 'pointer' },
  groupActive: { color: t.text, fontWeight: 600 },
  nested: { margin: '1px 0 4px 12px', paddingLeft: 8, borderLeft: `1px solid ${t.borderLight}`, display: 'flex', flexDirection: 'column', gap: 1 },
};
