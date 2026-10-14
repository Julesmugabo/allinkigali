/**
 * StaffBanner.jsx — reminds platform staff they are inside a client's
 * dashboard, with a way back to where they came from.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { t } from '../../theme';

export default function StaffBanner({ name }) {
  const navigate = useNavigate();
  return (
    <div style={s.banner}>
      <button onClick={() => navigate(-1)} style={s.back}><ArrowLeft size={15} /> Back</button>
      <span style={s.sep} />
      <span style={{ color: t.textSecondary, fontSize: 13 }}>You are managing</span>
      <b style={{ color: '#FBBF24' }}>{name}</b>
      <span style={{ color: t.textMuted, fontSize: 12 }}>— changes here are made on the client's behalf</span>
    </div>
  );
}

const s = {
  banner: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', background: '#1C1A0F', border: '1px solid #FBBF2440', borderRadius: 10, padding: '10px 16px', marginBottom: 18 },
  back: { display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', color: t.accent, padding: 0, fontSize: 13, fontWeight: 600 },
  sep: { width: 1, height: 18, background: t.border },
};
