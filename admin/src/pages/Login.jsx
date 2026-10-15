import React, { useState } from 'react';
import { login } from '../api';
import { t } from '../theme';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      onLogin(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <form onSubmit={handleSubmit} style={styles.card}>
        <div style={styles.logo}>
          <img src="/logo-icon.png" alt="AllInKigali" style={styles.logoIcon} />
          <p style={styles.subtitle}>Staff Portal</p>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <label style={styles.label}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@allinkigali.rw"
          required
          style={styles.input}
        />

        <label style={styles.label}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
          style={styles.input}
        />

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100vh', background: t.bg,
  },
  card: {
    background: t.bgCard, borderRadius: t.radiusLg, padding: 40,
    width: '100%', maxWidth: 400, boxShadow: t.shadowLg,
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  logo: {
    textAlign: 'center', marginBottom: 12,
  },
  logoIcon: {
    width: 88, height: 88, borderRadius: 20,
    objectFit: 'contain', marginBottom: 12,
    display: 'block', margin: '0 auto 12px',
  },
  subtitle: { color: t.textSecondary, fontSize: 14, marginTop: 4 },
  label: { color: t.textSecondary, fontSize: 13, fontWeight: 500 },
  input: { width: '100%' },
  button: {
    background: t.accent, color: t.onAccent, fontWeight: 600,
    padding: '12px 20px', marginTop: 8, fontSize: 15,
  },
  error: {
    background: 'rgba(248,113,113,0.12)', color: t.inkStatus || t.danger,
    padding: '10px 14px', borderRadius: t.radius, fontSize: 13,
  },
};
