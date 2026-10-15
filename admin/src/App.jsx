import React, { useState, useCallback, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { getUser, logout as apiLogout, apiFetch, STAFF_ROLES, rolesOf } from './api';
import { t } from './theme';
import Login from './pages/Login';
import Sidebar from './components/Sidebar';

// Staff Portal pages (all roles)
import StaffHome    from './pages/StaffHome';
import Announcements from './pages/Announcements';
import Documents    from './pages/Documents';
import Contracts    from './pages/Contracts';

// Role-specific dashboards
import DirectorDashboard   from './dashboards/director/DirectorDashboard';
import NewsDashboard       from './dashboards/news/NewsDashboard';
import SellersDashboard    from './dashboards/sellers/SellersDashboard';
import PlacesDashboard     from './dashboards/places/PlacesDashboard';
import FinanceDashboard    from './dashboards/finance/FinanceDashboard';

export default function App() {
  // Restaurants, cafés and venues have their own dashboard now (business.allinkigali.rw);
  // an old client sign-in kept in this browser is dropped.
  const [user, setUser] = useState(() => {
    const u = getUser();
    if (u && !rolesOf(u).some((r) => STAFF_ROLES.includes(r))) { apiLogout(); return null; }
    return u;
  });
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

  const has = (r) => rolesOf(user).includes(r); // one person can hold several dashboards
  const isDirector = has('director');

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
              <Route path="/overview/:section?" element={<DirectorDashboard />} />
              <Route path="/news/:section?" element={<NewsDashboard />} />
              <Route path="/sellers/:section?" element={<SellersDashboard />} />
              <Route path="/restaurants/:section?" element={<PlacesDashboard kind="restaurant" />} />
              <Route path="/coffee-shops/:section?" element={<PlacesDashboard kind="coffeeshop" />} />
              <Route path="/finance/:section?" element={<FinanceDashboard />} />
              <Route path="/admins" element={<Navigate to="/overview/team" replace />} />
            </>}

            {/* ── Role-specific dashboards ── */}
            {!isDirector && has('news') && <Route path="/news/:section?" element={<NewsDashboard />} />}
            {!isDirector && has('sellers') && <>
              <Route path="/sellers/:section?" element={<SellersDashboard />} />
              <Route path="/restaurants/:section?" element={<PlacesDashboard kind="restaurant" />} />
              <Route path="/coffee-shops/:section?" element={<PlacesDashboard kind="coffeeshop" />} />
            </>}
            {!isDirector && has('finance') && <Route path="/finance/:section?" element={<FinanceDashboard />} />}

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
