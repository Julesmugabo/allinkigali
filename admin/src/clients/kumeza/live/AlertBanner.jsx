/**
 * AlertBanner.jsx — the big, short-lived line a service screen shows when
 * something happens ("Table 4 is calling a waiter"), with its sound.
 *   const [alert, raise] = useAlert();  raise('Table 4: new order', 'urgent')
 *   <AlertBanner alert={alert} />
 */
import React, { useCallback, useRef, useState } from 'react';
import { BellRing } from 'lucide-react';
import { t } from '../../../theme';
import { chime } from './shift';

const COLORS = { urgent: '#F87171', normal: t.accent, soft: t.textSecondary };

export function useAlert() {
  const [alert, setAlert] = useState(null);
  const timer = useRef(null);
  const raise = useCallback((text, kind = 'normal') => {
    chime(kind);
    setAlert({ text, kind, id: Date.now() });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setAlert(null), kind === 'urgent' ? 10000 : 6000);
  }, []);
  return [alert, raise];
}

export default function AlertBanner({ alert }) {
  if (!alert) return null;
  const color = COLORS[alert.kind] || t.accent;
  return (
    <div key={alert.id} style={{ ...s.banner, borderColor: color, color }}>
      <BellRing size={20} />
      <span>{alert.text}</span>
    </div>
  );
}

const s = {
  banner: { display: 'flex', alignItems: 'center', gap: 10, border: '2px solid', background: t.bgSidebar, borderRadius: t.radiusLg, padding: '12px 16px', marginBottom: 16, fontSize: 17, fontWeight: 800 },
};
