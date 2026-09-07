/**
 * AuthForm.js — Ifishi yo kwiyandikisha.
 * First name, last name, email, optional phone, plus the Google shortcut.
 * Validation lives here; the actual account creation lives in UserContext.
 */
import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import TextField from '../common/TextField';
import PrimaryButton from '../common/PrimaryButton';
import GoogleButton from './GoogleButton';
import { isValidEmail, isValidPhone } from '../../utils/format';
import { colors, typography, spacing } from '../../theme';

export default function AuthForm({ onSubmit, onGooglePress, isLoading = false, serverError }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState({});

  const lastNameRef = useRef(null);
  const emailRef = useRef(null);
  const phoneRef = useRef(null);

  const validate = useCallback(() => {
    const next = {};

    if (!firstName.trim()) next.firstName = 'Andika izina rya mbere.';
    if (!lastName.trim()) next.lastName = 'Andika izina rya nyuma.';
    if (!email.trim()) next.email = 'Andika imeyili yawe.';
    else if (!isValidEmail(email)) next.email = 'Imeyili ntabwo ari yo.';
    if (phone.trim() && !isValidPhone(phone)) next.phone = 'Nomero igomba gutangira na 07.';

    setErrors(next);
    return Object.keys(next).length === 0;
  }, [firstName, lastName, email, phone]);

  const handleSubmit = useCallback(() => {
    if (!validate()) return;
    onSubmit({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
    });
  }, [validate, onSubmit, firstName, lastName, email, phone]);

  return (
    <View style={styles.container}>
      <TextField
        label="Izina rya mbere"
        value={firstName}
        onChangeText={setFirstName}
        placeholder="Urugero: Jean"
        icon="account-outline"
        error={errors.firstName}
        autoCapitalize="words"
        autoComplete="name-given"
        onSubmitEditing={() => lastNameRef.current && lastNameRef.current.focus()}
      />

      <TextField
        ref={lastNameRef}
        label="Izina rya nyuma"
        value={lastName}
        onChangeText={setLastName}
        placeholder="Urugero: Habimana"
        icon="account-outline"
        error={errors.lastName}
        autoCapitalize="words"
        autoComplete="name-family"
        onSubmitEditing={() => emailRef.current && emailRef.current.focus()}
      />

      <TextField
        ref={emailRef}
        label="Imeyili"
        value={email}
        onChangeText={setEmail}
        placeholder="izina@imeyili.com"
        icon="email-outline"
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        onSubmitEditing={() => phoneRef.current && phoneRef.current.focus()}
      />

      <TextField
        ref={phoneRef}
        label="Telefone (si ngombwa)"
        value={phone}
        onChangeText={setPhone}
        placeholder="0788 000 000"
        icon="phone-outline"
        error={errors.phone}
        keyboardType="phone-pad"
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
      />

      {serverError ? <Text style={styles.serverError}>{serverError}</Text> : null}

      <PrimaryButton
        label="Fungura konti"
        onPress={handleSubmit}
        loading={isLoading}
        icon="account-plus-outline"
        style={styles.submit}
      />

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerLabel}>cyangwa</Text>
        <View style={styles.dividerLine} />
      </View>

      <GoogleButton onPress={onGooglePress} loading={isLoading} />

      <Text style={styles.terms}>
        Ukomeje, wemera amabwiriza yo gukoresha allinkigali n'uburyo amakuru yawe abikwa.
      </Text>
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(133,183,235,0.3)',
  },
  dividerLabel: {
    ...typography.caption,
    color: colors.textOnNavyFaint,
    marginHorizontal: spacing.md,
  },
  terms: {
    ...typography.caption,
    fontSize: 10.5,
    lineHeight: 16,
    color: 'rgba(133,183,235,0.55)',
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
