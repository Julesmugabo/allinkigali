/**
 * SignInForm.js — Email + password to log in.
 * Kept separate from AuthForm (sign-up) since a returning user doesn't need
 * name/phone fields again.
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
    if (!email.trim()) next.email = 'Enter your email.';
    else if (!isValidEmail(email)) next.email = 'That email does not look right.';
    if (!password) next.password = 'Enter your password.';
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
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="name@example.com"
        icon="email-outline"
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        onSubmitEditing={() => passwordRef.current && passwordRef.current.focus()}
      />

      <TextField
        ref={passwordRef}
        label="Password"
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

      <PrimaryButton label="Log in" onPress={handleSubmit} loading={isLoading} icon="login" style={styles.submit} />
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
