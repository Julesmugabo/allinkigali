/**
 * SupportStart.jsx — where the Staff Portal's "Open dashboard" lands
 * (/support#code=…). Trades the one-minute code for a read-only support
 * sign-in (kept in this tab only), then shows the client's dashboard with
 * the support banner.
 */
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { t } from '../../theme';
import { session } from '../session';

export default function SupportStart({ onSignedIn }) {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return; // React's development mode runs effects twice
    started.current = true;
    const code = new URLSearchParams(window.location.hash.slice(1)).get('code');
    window.history.replaceState(window.history.state, '', '/support'); // keep the code out of history
    if (!code) { setError('This link is incomplete. Open the client again from the Staff Portal.'); return; }
    session.supportExchange(code)
      .then(() => { onSignedIn(); navigate('/', { replace: true }); })
      .catch((e) => setError(e.message));
  }, [onSignedIn, navigate]);
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.bg, color: error ? t.danger : t.textSecondary, fontFamily: t.font, padding: 24, textAlign: 'center' }}>
      {error || 'Opening the client\'s dashboard…'}
    </div>
  );
}
