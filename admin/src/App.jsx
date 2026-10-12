import React, { useState, useCallback, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { getUser, logout as apiLogout, apiFetch, setUser as saveUser } from './api';
import { t } from './theme';
import Login from './pages/Login';
import Sidebar from './components/Sidebar';
import Overview from './pages/Overview';
import NewsDashboard from './pages/NewsDashboard';
import SellersDashboard from './pages/SellersDashboard';
import RestaurantsDashboard from './pages/RestaurantsDashboard';
import CoffeeShopsDashboard from './pages/CoffeeShopsDashboard';
import FinanceDashboard from './pages/FinanceDashboard';
import AdminUsers from './pages/AdminUsers';

export default function App() {
  const [user, setUser] = useState(getUser);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const onResize = () => setSidebarOpen(window.innerWidth >= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleLogin = useCallback((u) => setUser(u), []);

  const handleLogout = useCallback(() => {
    apiLogout();
    setUser(null);
  }, []);

  if (!user) return <Login onLogin={handleLogin} />;

  const isDirector = user.role === 'director';

  return (
    <div style={styles.layout}>
      <Sidebar
        user={user}
        onLogout={handleLogout}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <main style={{
        ...styles.main,
        marginLeft: sidebarOpen && window.innerWidth >= 768 ? 260 : 0,
      }}>
        <div style={styles.content}>
          <Routes>
            {isDirector ? (
              <>
                <Route path="/" element={<Overview />} />
                <Route path="/news" element={<NewsDashboard />} />
                <Route path="/sellers" element={<SellersDashboard />} />
                <Route path="/restaurants" element={<RestaurantsDashboard />} />
                <Route path="/coffee-shops" element={<CoffeeShopsDashboard />} />
                <Route path="/finance" element={<FinanceDashboard />} />
                <Route path="/admins" element={<AdminUsers />} />
              </>
            ) : user.role === 'news' ? (
              <Route path="/" element={<NewsDashboard />} />
            ) : user.role === 'sellers' ? (
              <>
                <Route path="/" element={<SellersDashboard />} />
                <Route path="/restaurants" element={<RestaurantsDashboard />} />
                <Route path="/coffee-shops" element={<CoffeeShopsDashboard />} />
              </>
            ) : user.role === 'restaurant' ? (
              <Route path="/" element={<RestaurantsDashboard />} />
            ) : user.role === 'coffeeshop' ? (
              <Route path="/" element={<CoffeeShopsDashboard />} />
            ) : user.role === 'finance' ? (
              <Route path="/" element={<FinanceDashboard />} />
            ) : null}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

const styles = {
  layout: {
    display: 'flex', height: '100vh', background: t.bg,
  },
  main: {
    flex: 1, height: '100vh', overflowY: 'auto',
    transition: 'margin-left 0.2s ease',
  },
  content: {
    padding: '24px 24px 40px',
    maxWidth: 1200, margin: '0 auto',
  },
};
