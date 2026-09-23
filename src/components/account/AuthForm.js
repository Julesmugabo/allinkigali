/**
 * AuthForm.js — Ifishi yo kwiyandikisha.
 * First name, last name, email, password, optional phone.
 * Validation lives here; the actual account creation lives in UserContext.
 */
import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import TextField from '../common/TextField';
import PrimaryButton from '../common/PrimaryButton';
import { isValidEmail, isValidPhone } from '../../utils/format';
import { colors, typography, spacing } from '../../theme';

export default function AuthForm({ onSubmit, isLoading = false, serverError }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState({});

  const lastNameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const phoneRef = useRef(null);

  const validate = useCallback(() => {
    const next = {};

    if (!firstName.trim()) next.firstName = 'Andika izina rya mbere.';
    if (!lastName.trim()) next.lastName = 'Andika izina rya nyuma.';
    if (!email.trim()) next.email = 'Andika imeyili yawe.';
    else if (!isValidEmail(email)) next.email = 'Imeyili ntabwo ari yo.';
    if (!password) next.password = "Andika ijambo ry'ibanga.";
    else if (password.length < 6) next.password = "Rigomba kuba nibura inyuguti 6.";
    if (phone.trim() && !isValidPhone(phone)) next.phone = 'Nomero igomba gutangira na 07.';

    setErrors(next);
    return Object.keys(next).length === 0;
  }, [firstName, lastName, email, password, phone]);

  const handleSubmit = useCallback(() => {
    if (!validate()) return;
    onSubmit({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      password,
      phone: phone.trim(),
    });
  }, [validate, onSubmit, firstName, lastName, email, password, phone]);

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
        autoComplete="password-new"
        returnKeyType="next"
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
  terms: {
    ...typography.caption,
    fontSize: 10.5,
    lineHeight: 16,
    color: 'rgba(133,183,235,0.55)',
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
