import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Newspaper, Store, UtensilsCrossed, Coffee, Wallet, Users,
  TrendingUp, Clock, AlertCircle,
} from 'lucide-react';
import { apiFetch } from '../api';
import { t } from '../theme';
import { PageHeader, StatCard, Card, DataTable, Badge } from '../components/PageShell';

export default function Overview() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [admins, places, news, finance] = await Promise.all([
          apiFetch('/admin/admins').catch(() => []),
          apiFetch('/admin/restaurants-list').catch(() => []),
          apiFetch('/news/articles').catch(() => []),
          apiFetch('/finance/dashboard/summary').catch(() => null),
        ]);
        setStats({
          adminCount: admins.length,
          restaurantCount: places.filter(p => p.type === 'restaurant').length,
          coffeeShopCount: places.filter(p => p.type === 'coffeeshop').length,
          articleCount: Array.isArray(news) ? news.length : 0,
          finSummary: finance?.cards || null,
        });
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div style={s.loading}>Loading dashboard...</div>;

  return (
    <div>
      <PageHeader
        title="Director Overview"
        subtitle="Platform-wide summary"
      />

      <div style={s.grid}>
        <StatCard label="Articles" value={stats?.articleCount || 0} icon={Newspaper} color="#38BDF8" />
        <StatCard label="Restaurants" value={stats?.restaurantCount || 0} icon={UtensilsCrossed} color="#F59E0B" />
        <StatCard label="Coffee Shops" value={stats?.coffeeShopCount || 0} icon={Coffee} color="#A78BFA" />
        <StatCard label="Admin Users" value={stats?.adminCount || 0} icon={Users} color="#4ADE80" />
      </div>

      {stats?.finSummary && (
        <div style={{ ...s.grid, marginTop: 16 }}>
          <StatCard label="Cash & Bank" value={`${(stats.finSummary.cashBank || 0).toLocaleString()} RWF`} icon={Wallet} color="#38BDF8" />
          <StatCard label="Income (this period)" value={`${(stats.finSummary.income || 0).toLocaleString()} RWF`} icon={TrendingUp} color="#4ADE80" />
          <StatCard label="Expenses (this period)" value={`${(stats.finSummary.expenses || 0).toLocaleString()} RWF`} icon={AlertCircle} color="#F87171" />
        </div>
      )}

      <div style={{ ...s.grid, marginTop: 24 }}>
        <Card style={{ cursor: 'pointer' }} onClick={() => navigate('/news')}>
          <div style={s.quickCard}>
            <Newspaper size={24} color={t.accent} />
            <div>
              <div style={s.quickTitle}>News Dashboard</div>
              <div style={s.quickSub}>Manage articles, categories, stories</div>
            </div>
          </div>
        </Card>
        <Card style={{ cursor: 'pointer' }} onClick={() => navigate('/sellers')}>
          <div style={s.quickCard}>
            <Store size={24} color="#F59E0B" />
            <div>
              <div style={s.quickTitle}>Sales Partners</div>
              <div style={s.quickSub}>Pending listings, restaurants, delivery</div>
            </div>
          </div>
        </Card>
        <Card style={{ cursor: 'pointer' }} onClick={() => navigate('/finance')}>
          <div style={s.quickCard}>
            <Wallet size={24} color="#4ADE80" />
            <div>
              <div style={s.quickTitle}>Finance</div>
              <div style={s.quickSub}>Transactions, invoices, budgets</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

const s = {
  loading: { padding: 40, textAlign: 'center', color: t.textSecondary },
  grid: { display: 'flex', gap: 16, flexWrap: 'wrap' },
  quickCard: { display: 'flex', alignItems: 'center', gap: 16 },
  quickTitle: { color: t.text, fontSize: 16, fontWeight: 600 },
  quickSub: { color: t.textSecondary, fontSize: 13, marginTop: 2 },
};
