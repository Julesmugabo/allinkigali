/**
 * GoogleButton.js — "Continue with Google" (web). Google draws the button
 * itself; after the person picks their account we sign them in through
 * UserContext and call onSignedIn(user). Shows nothing where Google sign-in
 * isn't available (the phone app for now), so nobody taps a dead button.
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useUser } from '../../context/UserContext';
import { isGoogleAvailable, renderGoogleButton } from '../../services/googleAuth';
import { colors, typography, spacing } from '../../theme';

export default function GoogleButton({ onSignedIn, text = 'continue_with', style }) {
  const { signInWithGoogle } = useUser();
  const box = useRef(null);
  const [width, setWidth] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const handler = useRef(null);
  handler.current = async (credential) => {
    setBusy(true); setError('');
    try {
      const user = await signInWithGoogle(credential);
      onSignedIn?.(user);
    } catch (e) {
      setError(e?.message || 'Google sign-in failed. Try again or use your email.');
    }
    setBusy(false);
  };

  useEffect(() => {
    if (!width || !box.current) return;
    renderGoogleButton(box.current, { text, width, onCredential: (c) => handler.current(c) })
      .catch((e) => setError(e.message));
  }, [width, text]);

  if (!isGoogleAvailable()) return null;
  return (
    <View style={[styles.wrap, style]} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <View ref={box} style={styles.box} />
      {busy ? <Text style={styles.note}>Signing you in…</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch', alignItems: 'center' },
  box: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  note: { ...typography.caption, color: colors.textOnNavyFaint, marginTop: spacing.sm },
  error: { ...typography.caption, color: '#FCA5A5', marginTop: spacing.sm, textAlign: 'center' },
});
