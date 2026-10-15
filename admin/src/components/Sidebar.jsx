import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home, Bell, FolderOpen, FileText,
  LayoutDashboard, Newspaper, Store, UtensilsCrossed,
  Coffee, Wallet, Users, LogOut, Menu, X,
} from 'lucide-react';
import { t } from '../theme';
import DashboardLink from './sidebar/DashboardLink';
import { SUB_NAV } from '../navigation/subNav';
import { rolesOf } from '../api';

// ─── Portal links (visible to ALL staff) ───────────────────────────────────
const PORTAL_LINKS = [
  { to: '/',              icon: Home,       label: 'Home',         end: true },
  { to: '/announcements', icon: Bell,       label: 'Announcements' },
  { to: '/documents',     icon: FolderOpen, label: 'Documents' },
  { to: '/contracts',     icon: FileText,   label: 'My Contracts' },
];

// ─── Role-specific dashboard links ─────────────────────────────────────────
const ROLE_LINKS = {
  director: [
    { to: '/overview',      icon: LayoutDashboard, label: 'Overview' },
    { to: '/news',          icon: Newspaper,       label: 'News' },
    { to: '/sellers',       icon: Store,           label: 'Sales Partners' },
    { to: '/restaurants',   icon: UtensilsCrossed, label: 'Restaurants' },
    { to: '/coffee-shops',  icon: Coffee,          label: 'Coffee Shops' },
    { to: '/finance',       icon: Wallet,          label: 'Finance' },
  ],
  news: [
    { to: '/news',     icon: Newspaper,       label: 'News Dashboard' },
  ],
  sellers: [
    { to: '/sellers',      icon: Store,           label: 'Sales Partners' },
    { to: '/restaurants',  icon: UtensilsCrossed, label: 'Restaurants' },
    { to: '/coffee-shops', icon: Coffee,          label: 'Coffee Shops' },
  ],
  finance: [
    { to: '/finance', icon: Wallet, label: 'Finance Dashboard' },
  ],
};

export default function Sidebar({ user, onLogout, open, onToggle, unreadCount }) {
  // Every dashboard the person holds (director: all of them), each once.
  const roles = rolesOf(user);
  const dashboardLinks = (roles.includes('director') ? ROLE_LINKS.director : roles.flatMap((r) => ROLE_LINKS[r] || []))
    .filter((l, i, all) => all.findIndex((x) => x.to === l.to) === i);

  return (
    <>
      {/* Mobile toggle — on desktop the sidebar is always shown */}
      {window.innerWidth < 768 && <button onClick={onToggle} style={styles.toggle}>
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>}

      {/* Overlay on mobile only — not on desktop where sidebar sits beside content */}
      {open && window.innerWidth < 768 && <div onClick={onToggle} style={styles.overlay} />}

      <aside style={{ ...styles.sidebar, ...(open ? styles.sidebarOpen : {}) }}>
        {/* Brand */}
        <div style={{ ...styles.brand, ...(window.innerWidth < 768 ? { paddingLeft: 64 } : {}) }}>
          <NavLink to="/" aria-label="Home"><img src="/logo-wordmark.png" alt="AllInKigali" style={styles.brandWordmark} /></NavLink>
          <div style={styles.brandSub}>Staff Portal</div>
        </div>

        <nav style={styles.nav}>
          {/* ── Staff Portal section ── */}
          <div style={styles.sectionLabel}>PORTAL</div>
          {PORTAL_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={() => window.innerWidth < 768 && onToggle()}
              style={({ isActive }) => ({ ...styles.navLink, ...(isActive ? styles.navLinkActive : {}) })}
            >
              <link.icon size={17} color={t.sideIcon} strokeWidth={2.2} />
              <span style={{ flex: 1 }}>{link.label}</span>
              {link.to === '/announcements' && unreadCount > 0 && (
                <span style={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </NavLink>
          ))}

          {/* ── Dashboards section (role-specific) ── */}
          {dashboardLinks.length > 0 && (
            <>
              <div style={{ ...styles.sectionLabel, marginTop: 16 }}>
                {roles.includes('director') || dashboardLinks.length > 1 ? 'DASHBOARDS' : 'MY DASHBOARD'}
              </div>
              {dashboardLinks.map((link) => (
                <DashboardLink
                  key={link.to}
                  link={{ ...link, end: link.to === '/overview' }}
                  children={SUB_NAV[link.to]}
                  onNavigate={onToggle}
                />
              ))}
            </>
          )}
        </nav>

        {/* Footer */}
        <div style={styles.footer}>
          <div style={styles.userInfo}>
            <div style={styles.avatar}>
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={styles.userName}>{user.firstName} {user.lastName}</div>
              <div style={styles.userRole}>{roles.join(' · ')}</div>
            </div>
          </div>
          <button onClick={onLogout} style={styles.logoutBtn}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

const styles = {
  sidebar: {
    position: 'fixed', top: 0, left: 0, bottom: 0,
    width: 260, background: t.bgSidebar,
    borderRight: 'none',
    display: 'flex', flexDirection: 'column',
    zIndex: 100,
    transform: 'translateX(-100%)',
    transition: 'transform 0.2s ease',
  },
  sidebarOpen: { transform: 'translateX(0)' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(4,44,83,0.35)', zIndex: 99 },
  toggle: {
    position: 'fixed', top: 12, left: 12, zIndex: 101,
    background: t.bgCard, color: t.text,
    width: 40, height: 40, borderRadius: t.radius,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 0, border: `1px solid ${t.border}`,
  },
  brand: {
    padding: '20px 20px 12px',
  },
  brandWordmark: {
    width: 120, height: 'auto',
    objectFit: 'contain', display: 'block',
    marginBottom: 4,
  },
  brandSub: { color: t.sideMuted, fontSize: 11, fontWeight: 500, letterSpacing: 0.3, paddingLeft: 2 },

  nav: { flex: 1, padding: '8px 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 },
  sectionLabel: {
    color: t.sideMuted, fontSize: 10, fontWeight: 700,
    letterSpacing: 0.8, padding: '4px 12px 2px',
  },
  navLink: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '9px 12px', borderRadius: t.radius,
    color: t.sideText, fontSize: 14, fontWeight: 500,
    textDecoration: 'none', transition: 'all 0.15s',
  },
  navLinkActive: { background: t.sideActiveBg, color: '#FFFFFF', fontWeight: 600 },
  badge: {
    background: t.danger, color: '#fff',
    fontSize: 10, fontWeight: 700,
    minWidth: 18, height: 18, borderRadius: 9,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '0 4px',
  },

  footer: { padding: 16, borderTop: `1px solid ${t.sideBorder}` },
  userInfo: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
  avatar: {
    width: 36, height: 36, borderRadius: '50%',
    background: t.accent, color: '#FFFFFF',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 600, flexShrink: 0,
  },
  userName: { color: t.sideText, fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  userRole: { color: t.sideMuted, fontSize: 12, textTransform: 'capitalize' },
  logoutBtn: {
    display: 'flex', alignItems: 'center', gap: 8,
    width: '100%', padding: '8px 12px', borderRadius: t.radius,
    background: 'transparent', color: t.sideText, fontSize: 13,
  },
};
