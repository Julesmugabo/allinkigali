/**
 * Overview.jsx — the Sales Partners admin's day: applications waiting,
 * clients by kind, open now, delivery partners.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { t } from '../../../../theme';
import Button from '../../../../components/common/Button';
import { Panel, Kpi, KpiGrid, Loading, ErrorText } from '../../../../components/ui';
import { useSellers } from '../../SellersContext';

export default function Overview() {
  const navigate = useNavigate();
  const { places, applications, loading, error } = useSellers();
  if (loading) return <Loading />;
  const waiting = applications.filter((a) => a.status === 'pending');
  const open = places.filter((p) => /^open/i.test(p.open_status || '') && p.is_active !== false);
  return (
    <>
      <ErrorText>{error}</ErrorText>
      <KpiGrid>
        <Kpi label="Applications waiting" value={waiting.length} color={waiting.length ? t.warning : t.textSecondary} onClick={() => navigate('/sellers/applications')} />
        <Kpi label="Restaurants" value={places.filter((p) => p.type === 'restaurant').length} onClick={() => navigate('/restaurants/list')} />
        <Kpi label="Coffee shops" value={places.filter((p) => p.type === 'coffeeshop').length} color="#A78BFA" onClick={() => navigate('/coffee-shops/list')} />
        <Kpi label="Open right now" value={open.length} color={t.success} />
        <Kpi label="Delivering" value={places.filter((p) => p.delivery_enabled).length} color="#60A5FA" onClick={() => navigate('/sellers/deliveries')} />
        <Kpi label="Hidden from the app" value={places.filter((p) => p.is_active === false).length} color={t.textSecondary} />
      </KpiGrid>
      {waiting.length > 0 && (
        <Panel title="Waiting for your review" actions={<Button size="sm" variant="info" onClick={() => navigate('/sellers/applications')}>Review</Button>}>
          {waiting.slice(0, 5).map((a) => (
            <div key={a.id} style={s.row}>
              <b>{a.business_name}</b>
              <span style={{ color: t.textSecondary }}>{a.type === 'restaurant' ? 'Restaurant' : 'Coffee shop'} · {a.location}</span>
              <span style={{ color: t.textMuted, marginLeft: 'auto' }}>{new Date(a.created_at).toLocaleDateString('en-GB')}</span>
            </div>
          ))}
        </Panel>
      )}
    </>
  );
}

const s = { row: { display: 'flex', gap: 12, padding: '8px 0', borderBottom: `1px solid ${t.border}`, fontSize: 14, color: t.text } };
