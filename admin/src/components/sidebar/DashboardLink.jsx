/**
 * DashboardLink.jsx — a sidebar dashboard entry. If the dashboard has
 * sub-items (navigation/subNav.js) they open underneath it while you're
 * inside that dashboard; the chevron lets you open/close them by hand.
 */
import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { t } from '../../theme';
import SubNavItem from './SubNavItem';

const isMobile = () => window.innerWidth < 768;

export default function DashboardLink({ link, children = [], onNavigate }) {
  const { pathname } = useLocation();
  const inside = pathname === link.to || pathname.startsWith(`${link.to}/`);
  const [open, setOpen] = useState(inside);

  // Follow navigation: entering a dashboard opens its sub-items.
  useEffect(() => { if (inside) setOpen(true); }, [inside]);

  const hasChildren = children.length > 0;
  const Chevron = open ? ChevronDown : ChevronRight;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <NavLink
          to={link.to}
          end={link.end}
          // On phones keep the sidebar open after tapping a dashboard that has
          // sub-items, so its sections are visible to pick from.
          onClick={() => { if (hasChildren) setOpen(true); else if (isMobile()) onNavigate?.(); }}
          style={() => ({ ...s.link, ...(inside ? s.linkActive : {}), flex: 1 })}
        >
          <link.icon size={17} color={t.lime} strokeWidth={2.2} />
          <span style={{ flex: 1 }}>{link.label}</span>
        </NavLink>
        {hasChildren && (
          <button onClick={() => setOpen((v) => !v)} style={s.chevron} aria-label={open ? 'Collapse' : 'Expand'}>
            <Chevron size={15} />
          </button>
        )}
      </div>
      {hasChildren && open && (
        <div style={s.children}>
          {children.map((c) => (
            <SubNavItem key={c.to || c.label} item={c} onNavigate={() => isMobile() && onNavigate?.()} />
          ))}
        </div>
      )}
    </div>
  );
}

const s = {
  link: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '9px 12px', borderRadius: t.radius,
    color: t.textSecondary, fontSize: 14, fontWeight: 500,
    textDecoration: 'none', transition: 'all 0.15s',
  },
  linkActive: { background: t.bgActive, color: t.inkAccent },
  chevron: { background: 'transparent', color: t.textMuted, padding: '8px 6px' },
  children: { margin: '2px 0 6px 21px', paddingLeft: 10, borderLeft: `1px solid ${t.borderLight}`, display: 'flex', flexDirection: 'column', gap: 1 },
};
