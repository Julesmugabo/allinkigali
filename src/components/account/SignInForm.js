/**
 * SignInForm.js — Ifishi yo kwinjira (returning customer/seller sign-in).
 * Just email + password. Kept separate from AuthForm (sign-up) since a
 * returning user doesn't need name/role/phone fields again.
 */
import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import TextField from '../common/TextField';
import PrimaryButton from '../common/PrimaryButton';
import { isValidEmail } from '../../utils/format';
import { colors, typography, spacing } from '../../theme';

export default function SignInForm({ onSubmit, isLoading = false, serverError }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  const passwordRef = useRef(null);

  const validate = useCallback(() => {
    const next = {};
    if (!email.trim()) next.email = 'Andika imeyili yawe.';
    else if (!isValidEmail(email)) next.email = 'Imeyili ntabwo ari yo.';
    if (!password) next.password = "Andika ijambo ry'ibanga.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [email, password]);

  const handleSubmit = useCallback(() => {
    if (!validate()) return;
    onSubmit({ email: email.trim(), password });
  }, [validate, onSubmit, email, password]);

  return (
    <View style={styles.container}>
      <TextField
        label="Imeyili"
        value={email}
        onChangeText={setEmail}
        placeholder="izina@imeyili.com"
        icon="email-outline"
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        onSubmitEditing={() => passwordRef.current && passwordRef.current.focus()}
      />

      <TextField
        ref={passwordRef}
        label="Ijambo ry'ibanga"
        value={password}
        onChangeText={setPassword}
        placeholder="••••••••"
        icon="key-outline"
        error={errors.password}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="password"
        returnKeyType="go"
        onSubmitEditing={handleSubmit}
      />

      {serverError ? <Text style={styles.serverError}>{serverError}</Text> : null}

      <PrimaryButton label="Injira" onPress={handleSubmit} loading={isLoading} icon="login" style={styles.submit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  submit: { marginTop: spacing.xs },
  serverError: {
    ...typography.caption,
    color: colors.breaking,
    marginBottom: spacing.md,
  },
});
