/**
 * VerifyEmailBox.js — "Enter the 6-digit code we sent to you@…": the code,
 * Confirm, and "Send a new code" (once a minute). onVerified(user) runs when
 * the email is confirmed. Used by the confirm screen and the booking form.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

import TextField from '../common/TextField';
import PrimaryButton from '../common/PrimaryButton';
import { useUser } from '../../context/UserContext';
import { colors, typography, spacing } from '../../theme';

const WAIT_S = 60;

export default function VerifyEmailBox({ onVerified }) {
  const { user, verifyEmail, resendVerification } = useUser();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (!wait) return undefined;
    const id = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(id);
  }, [wait]);

  const confirm = async () => {
    if (code.length !== 6) { setError('Enter the 6 digits from the email.'); return; }
    setBusy(true); setError(''); setNote('');
    try { const updated = await verifyEmail(code); onVerified?.(updated); } catch (e) { setError(e.message); }
    setBusy(false);
  };
  const resend = async () => {
    setError(''); setNote('');
    try { await resendVerification(); setNote('A new code is on its way. Check your inbox (and spam).'); setWait(WAIT_S); } catch (e) { setError(e.message); }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>
        We sent a 6-digit code to <Text style={styles.email}>{user?.email}</Text>. Enter it to confirm your email.
      </Text>
      <TextField
        label="Code"
        value={code}
        onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
        placeholder="123456"
        icon="email-check-outline"
        keyboardType="number-pad"
        autoComplete="one-time-code"
        returnKeyType="done"
        onSubmitEditing={confirm}
        error={error}
      />
      <PrimaryButton label="Confirm email" icon="check" onPress={confirm} loading={busy} style={styles.button} />
      {note ? <Text style={styles.note}>{note}</Text> : null}
      <Pressable onPress={resend} disabled={wait > 0} style={styles.resend} hitSlop={8}>
        <Text style={[styles.resendText, wait > 0 && styles.resendWaiting]}>
          {wait > 0 ? `Send a new code in ${wait}s` : "Didn't get it? Send a new code"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch' },
  text: { ...typography.body, color: colors.textOnNavy, lineHeight: 21, marginBottom: spacing.lg },
  email: { fontWeight: '700', color: colors.white },
  button: { marginTop: spacing.md },
  note: { ...typography.caption, color: colors.textOnNavyFaint, marginTop: spacing.md, textAlign: 'center' },
  resend: { alignSelf: 'center', marginTop: spacing.lg },
  resendText: { ...typography.caption, color: colors.blue300, fontWeight: '600' },
  resendWaiting: { color: colors.textOnNavyFaint },
});
