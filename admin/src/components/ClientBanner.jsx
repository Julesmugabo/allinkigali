/**
 * ClientBanner — shown at the top of every page when the Sellers Admin (or
 * director) is inside a specific client's dashboard. Makes it impossible to
 * forget you are in someone else's space, and provides a one-click exit.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UtensilsCrossed, Coffee } from 'lucide-react';
import { useClient } from '../context/ClientContext';
import { t } from '../theme';

const TYPE_ICON = {
  restaurant: UtensilsCrossed,
  coffeeshop: Coffee,
};

const TYPE_LABEL = {
  restaurant: 'Restaurant',
  coffeeshop: 'Coffee Shop',
};

export default function ClientBanner() {
  const { client, exitClient } = useClient();
  const navigate = useNavigate();

  if (!client) return null;

  const Icon = TYPE_ICON[client.type] || UtensilsCrossed;

  const handleBack = () => {
    exitClient();
    navigate('/sellers');
  };

  return (
    <div style={s.banner}>
      <button onClick={handleBack} style={s.backBtn}>
        <ArrowLeft size={16} />
        <span>Back to Clients</span>
      </button>

      <div style={s.divider} />

      <Icon size={15} color="#FBBF24" />
      <span style={s.label}>Managing:</span>
      <span style={s.name}>{client.name}</span>
      <span style={s.pill}>{TYPE_LABEL[client.type]}</span>
    </div>
  );
}

const s = {
  banner: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: '#1C1A0F',
    border: `1px solid #FBBF2440`,
    borderRadius: 10,
    padding: '10px 16px',
    marginBottom: 20,
  },
  backBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'transparent', color: t.accent,
    fontSize: 13, fontWeight: 600, flexShrink: 0,
    padding: 0,
  },
  divider: {
    width: 1, height: 18,
    background: t.border,
    flexShrink: 0,
  },
  label: { color: t.textSecondary, fontSize: 13 },
  name: { color: '#FBBF24', fontSize: 14, fontWeight: 700 },
  pill: {
    background: '#FBBF2420',
    color: '#FBBF24',
    fontSize: 11, fontWeight: 700,
    padding: '2px 8px', borderRadius: 20,
  },
};
