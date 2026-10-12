import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Newspaper, Store, UtensilsCrossed,
  Coffee, Wallet, Users, LogOut, Menu, X,
} from 'lucide-react';
import { t } from '../theme';

const ROLE_LINKS = {
  director: [
    { to: '/', icon: LayoutDashboard, label: 'Overview' },
    { to: '/news', icon: Newspaper, label: 'News' },
    { to: '/sellers', icon: Store, label: 'Sales Partners' },
    { to: '/restaurants', icon: UtensilsCrossed, label: 'Restaurants' },
    { to: '/coffee-shops', icon: Coffee, label: 'Coffee Shops' },
    { to: '/finance', icon: Wallet, label: 'Finance' },
    { to: '/admins', icon: Users, label: 'Admin Users' },
  ],
  news: [
    { to: '/', icon: Newspaper, label: 'News Dashboard' },
  ],
  sellers: [
    { to: '/', icon: Store, label: 'Sales Partners' },
    { to: '/restaurants', icon: UtensilsCrossed, label: 'Restaurants' },
    { to: '/coffee-shops', icon: Coffee, label: 'Coffee Shops' },
  ],
  restaurant: [
    { to: '/', icon: UtensilsCrossed, label: 'My Restaurant' },
  ],
  coffeeshop: [
    { to: '/', icon: Coffee, label: 'My Coffee Shop' },
  ],
  finance: [
    { to: '/', icon: Wallet, label: 'Finance Dashboard' },
  ],
};

export default function Sidebar({ user, onLogout, open, onToggle }) {
  const links = ROLE_LINKS[user.role] || ROLE_LINKS.director;

  return (
    <>
      {/* Mobile toggle */}
      <button onClick={onToggle} style={styles.toggle}>
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay on mobile */}
      {open && <div onClick={onToggle} style={styles.overlay} />}

      <aside style={{ ...styles.sidebar, ...(open ? styles.sidebarOpen : {}) }}>
        <div style={styles.brand}>
          <div style={styles.brandIcon}>A</div>
          <span style={styles.brandText}>AllInKigali</span>
        </div>

        <nav style={styles.nav}>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              onClick={() => window.innerWidth < 768 && onToggle()}
              style={({ isActive }) => ({
                ...styles.navLink,
                ...(isActive ? styles.navLinkActive : {}),
              })}
            >
              <link.icon size={18} />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div style={styles.footer}>
          <div style={styles.userInfo}>
            <div style={styles.avatar}>
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
            <div>
              <div style={styles.userName}>{user.firstName} {user.lastName}</div>
              <div style={styles.userRole}>{user.role}</div>
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
    borderRight: `1px solid ${t.border}`,
    display: 'flex', flexDirection: 'column',
    zIndex: 100,
    transform: 'translateX(-100%)',
    transition: 'transform 0.2s ease',
  },
  sidebarOpen: {
    transform: 'translateX(0)',
  },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    zIndex: 99,
  },
  toggle: {
    position: 'fixed', top: 12, left: 12, zIndex: 101,
    background: t.bgCard, color: t.text,
    width: 40, height: 40, borderRadius: t.radius,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 0, border: `1px solid ${t.border}`,
  },
  brand: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '20px 20px 16px',
  },
  brandIcon: {
    width: 36, height: 36, borderRadius: 10, background: t.accent,
    color: t.bg, fontSize: 18, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  brandText: { color: t.text, fontSize: 17, fontWeight: 700 },
  nav: {
    flex: 1, padding: '8px 12px', overflowY: 'auto',
    display: 'flex', flexDirection: 'column', gap: 2,
  },
  navLink: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 12px', borderRadius: t.radius,
    color: t.textSecondary, fontSize: 14, fontWeight: 500,
    textDecoration: 'none', transition: 'all 0.15s',
  },
  navLinkActive: {
    background: t.bgActive, color: t.accent,
  },
  footer: {
    padding: 16, borderTop: `1px solid ${t.border}`,
  },
  userInfo: {
    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
  },
  avatar: {
    width: 36, height: 36, borderRadius: '50%',
    background: t.bgHover, color: t.text,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 600,
  },
  userName: { color: t.text, fontSize: 13, fontWeight: 600 },
  userRole: { color: t.textMuted, fontSize: 12, textTransform: 'capitalize' },
  logoutBtn: {
    display: 'flex', alignItems: 'center', gap: 8,
    width: '100%', padding: '8px 12px', borderRadius: t.radius,
    background: 'transparent', color: t.danger, fontSize: 13,
  },
};
