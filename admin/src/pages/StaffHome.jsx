import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, FileText, FolderOpen, ChevronRight, Pin } from 'lucide-react';
import { apiFetch, getUser } from '../api';
import { t } from '../theme';
import { PageHeader, Card } from '../components/PageShell';

const ROLE_LABELS = {
  director: 'Director',
  news: 'News Admin',
  sellers: 'Sales Partners Admin',
  restaurant: 'Restaurant Admin',
  coffeeshop: 'Coffee Shop Admin',
  finance: 'Finance Officer',
};

export default function StaffHome() {
  const navigate = useNavigate();
  const user = getUser();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/staff/home')
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      <PageHeader
        title={`${greeting}, ${user?.firstName || 'there'} 👋`}
        subtitle={`You are signed in as ${ROLE_LABELS[user?.role] || user?.role}`}
      />

      {/* Quick-nav cards */}
      <div style={s.quickGrid}>
        <QuickCard
          icon={Bell}
          color="#378ADD"
          label="Announcements"
          value={loading ? '—' : data?.unreadAnnouncements > 0 ? `${data.unreadAnnouncements} unread` : 'Up to date'}
          badge={!loading && data?.unreadAnnouncements > 0 ? data.unreadAnnouncements : null}
          onClick={() => navigate('/announcements')}
        />
        <QuickCard
          icon={FolderOpen}
          color="#378ADD"
          label="Shared Documents"
          value={loading ? '—' : `${data?.documentCount ?? 0} file${data?.documentCount !== 1 ? 's' : ''}`}
          onClick={() => navigate('/documents')}
        />
        <QuickCard
          icon={FileText}
          color="#F5C518"
          label="My Contracts"
          value={loading ? '—' : `${data?.contractCount ?? 0} contract${data?.contractCount !== 1 ? 's' : ''}`}
          onClick={() => navigate('/contracts')}
        />
      </div>

      {/* Recent announcements */}
      <Card style={{ marginTop: 24 }}>
        <div style={s.sectionHeader}>
          <h2 style={s.sectionTitle}>Recent Announcements</h2>
          <button onClick={() => navigate('/announcements')} style={s.seeAll}>
            See all <ChevronRight size={14} />
          </button>
        </div>

        {loading && <div style={s.muted}>Loading...</div>}
        {!loading && !data?.announcements?.length && (
          <div style={s.muted}>No announcements yet.</div>
        )}
        {data?.announcements?.map((ann) => (
          <div
            key={ann.id}
            style={{ ...s.annRow, ...(ann.isRead ? {} : s.annUnread) }}
            onClick={() => navigate('/announcements')}
          >
            <div style={s.annLeft}>
              {ann.pinned && <Pin size={13} color={t.accent} style={{ flexShrink: 0 }} />}
              {!ann.isRead && <div style={s.unreadDot} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={s.annTitle}>{ann.title}</div>
              <div style={s.annBody}>{ann.body}</div>
              <div style={s.annMeta}>
                {ann.createdByName} · {new Date(ann.createdAt).toLocaleDateString()}
              </div>
            </div>
            <ChevronRight size={16} color={t.textMuted} />
          </div>
        ))}
      </Card>
    </div>
  );
}

function QuickCard({ icon: Icon, color, label, value, badge, onClick }) {
  return (
    <button onClick={onClick} style={s.quickCard}>
      <div style={{ ...s.quickIcon, background: color + '20', color }}>
        <Icon size={22} />
        {badge ? <div style={s.badge}>{badge}</div> : null}
      </div>
      <div style={s.quickLabel}>{label}</div>
      <div style={s.quickValue}>{value}</div>
    </button>
  );
}

const s = {
  quickGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 },
  quickCard: {
    background: t.bgCard, borderRadius: t.radiusLg,
    border: `1px solid ${t.border}`,
    padding: 20, textAlign: 'left', cursor: 'pointer',
    display: 'flex', flexDirection: 'column', gap: 8,
    transition: 'border-color 0.15s',
  },
  quickIcon: {
    position: 'relative',
    width: 44, height: 44, borderRadius: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  badge: {
    position: 'absolute', top: -4, right: -4,
    background: t.danger, color: '#fff',
    fontSize: 10, fontWeight: 700,
    minWidth: 16, height: 16, borderRadius: 8,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '0 4px',
  },
  quickLabel: { color: t.textSecondary, fontSize: 13, fontWeight: 500 },
  quickValue: { color: t.text, fontSize: 15, fontWeight: 600 },

  sectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { color: t.text, fontSize: 15, fontWeight: 600, margin: 0 },
  seeAll: {
    background: 'none', color: t.inkAccent, fontSize: 13, fontWeight: 500,
    display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer',
  },

  annRow: {
    display: 'flex', alignItems: 'flex-start', gap: 12,
    padding: '12px 0', borderBottom: `1px solid ${t.border}`,
    cursor: 'pointer',
  },
  annUnread: { background: 'rgba(55,138,221,0.08)', margin: '0 -20px', padding: '12px 20px' },
  annLeft: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, paddingTop: 3, minWidth: 14 },
  unreadDot: { width: 8, height: 8, borderRadius: '50%', background: t.accent },
  annTitle: { color: t.text, fontSize: 14, fontWeight: 600, marginBottom: 2 },
  annBody: { color: t.textSecondary, fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap',
    overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' },
  annMeta: { color: t.textMuted, fontSize: 12, marginTop: 4 },
  muted: { color: t.textMuted, fontSize: 14, padding: '16px 0' },
};
