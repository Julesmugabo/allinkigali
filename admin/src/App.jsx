import React, { useState, useCallback, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { getUser, logout as apiLogout, apiFetch, setUser as saveUser } from './api';
import { t } from './theme';
import Login from './pages/Login';
import Sidebar from './components/Sidebar';

// Staff Portal pages (all roles)
import StaffHome    from './pages/StaffHome';
import Announcements from './pages/Announcements';
import Documents    from './pages/Documents';
import Contracts    from './pages/Contracts';

// Role-specific dashboards
import Overview            from './pages/Overview';
import NewsDashboard       from './pages/NewsDashboard';
import SellersDashboard    from './pages/SellersDashboard';
import RestaurantsDashboard from './pages/RestaurantsDashboard';
import CoffeeShopsDashboard from './pages/CoffeeShopsDashboard';
import FinanceDashboard    from './pages/FinanceDashboard';
import AdminUsers          from './pages/AdminUsers';

export default function App() {
  const [user, setUser] = useState(getUser);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const onResize = () => setSidebarOpen(window.innerWidth >= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Poll unread announcement count every 60 s while logged in
  useEffect(() => {
    if (!user) return;
    const fetch = () => {
      apiFetch('/staff/home')
        .then(d => setUnreadCount(d?.unreadAnnouncements ?? 0))
        .catch(() => {});
    };
    fetch();
    const id = setInterval(fetch, 60_000);
    return () => clearInterval(id);
  }, [user]);

  const handleLogin = useCallback((u) => setUser(u), []);
  const handleLogout = useCallback(() => { apiLogout(); setUser(null); }, []);

  if (!user) return <Login onLogin={handleLogin} />;

  const role = user.role;
  const isDirector = role === 'director';

  return (
    <div style={styles.layout}>
      <Sidebar
        user={user}
        onLogout={handleLogout}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(v => !v)}
        unreadCount={unreadCount}
      />
      <main style={{ ...styles.main, marginLeft: sidebarOpen && window.innerWidth >= 768 ? 260 : 0 }}>
        <div style={styles.content}>
          <Routes>
            {/* ── Staff Portal (all roles) ── */}
            <Route path="/"              element={<StaffHome />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/documents"     element={<Documents />} />
            <Route path="/contracts"     element={<Contracts />} />

            {/* ── Director dashboards ── */}
            {isDirector && <>
              <Route path="/overview"      element={<Overview />} />
              <Route path="/news"          element={<NewsDashboard />} />
              <Route path="/sellers"       element={<SellersDashboard />} />
              <Route path="/restaurants"   element={<RestaurantsDashboard />} />
              <Route path="/coffee-shops"  element={<CoffeeShopsDashboard />} />
              <Route path="/finance"       element={<FinanceDashboard />} />
              <Route path="/admins"        element={<AdminUsers />} />
            </>}

            {/* ── Role-specific dashboards ── */}
            {role === 'news'        && <Route path="/news"         element={<NewsDashboard />} />}
            {role === 'sellers'     && <>
              <Route path="/sellers"      element={<SellersDashboard />} />
              <Route path="/restaurants"  element={<RestaurantsDashboard />} />
              <Route path="/coffee-shops" element={<CoffeeShopsDashboard />} />
            </>}
            {role === 'restaurant'  && <Route path="/restaurants"  element={<RestaurantsDashboard />} />}
            {role === 'coffeeshop'  && <Route path="/coffee-shops" element={<CoffeeShopsDashboard />} />}
            {role === 'finance'     && <Route path="/finance"      element={<FinanceDashboard />} />}

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

const styles = {
  layout: { display: 'flex', height: '100vh', background: t.bg },
  main: { flex: 1, height: '100vh', overflowY: 'auto', transition: 'margin-left 0.2s ease' },
  content: { padding: '24px 24px 40px', maxWidth: 1200, margin: '0 auto' },
};
