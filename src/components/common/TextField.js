/**
 * TextField.js — Umwanya wo kwandika (labelled text input).
 * Designed for the dark gradient background used by the account and checkout
 * screens. Shows its own error text so forms stay simple.
 */
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, radius } from '../../theme';

const TextField = React.forwardRef(function TextField(
  {
    label,
    value,
    onChangeText,
    placeholder,
    icon,
    error,
    keyboardType = 'default',
    autoCapitalize = 'sentences',
    autoComplete,
    multiline = false,
    returnKeyType = 'next',
    onSubmitEditing,
    editable = true,
    secureTextEntry = false, // passwords: dots, never plain text
    style,
  },
  ref
) {
  const [focused, setFocused] = useState(false);
  const [shown, setShown] = useState(false); // the eye: show what was typed in a password box

  return (
    <View style={[styles.container, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View
        style={[
          styles.field,
          multiline && styles.fieldMultiline,
          focused && styles.fieldFocused,
          Boolean(error) && styles.fieldError,
          !editable && styles.fieldDisabled,
        ]}
      >
        {icon ? (
          <MaterialCommunityIcons
            name={icon}
            size={18}
            color={focused ? colors.blue300 : 'rgba(133,183,235,0.65)'}
            style={styles.icon}
          />
        ) : null}

        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(133,183,235,0.45)"
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          autoCorrect={false}
          multiline={multiline}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          editable={editable}
          secureTextEntry={secureTextEntry && !shown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          selectionColor={colors.blue300}
          accessibilityLabel={label}
          style={[styles.input, multiline && styles.inputMultiline]}
        />

        {secureTextEntry ? (
          <Pressable
            onPress={() => setShown((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={shown ? 'Hide password' : 'Show password'}
            hitSlop={8}
            style={styles.eye}
          >
            <MaterialCommunityIcons name={shown ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.blue300} />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <View style={styles.errorRow}>
          <MaterialCommunityIcons name="alert-circle-outline" size={13} color={colors.breaking} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  label: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.blue300,
    marginBottom: spacing.sm,
    letterSpacing: 0.2,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg - 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(133,183,235,0.22)',
  },
  fieldMultiline: {
    height: 92,
    alignItems: 'flex-start',
    paddingTop: spacing.md,
  },
  fieldFocused: {
    borderColor: colors.blue500,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  fieldError: { borderColor: colors.breaking },
  fieldDisabled: { opacity: 0.6 },
  icon: { marginRight: spacing.sm },
  eye: { marginLeft: spacing.sm, padding: 4 },
  input: {
    flex: 1,
    ...typography.input,
    color: colors.textOnNavy,
    padding: 0,
  },
  inputMultiline: {
    height: '100%',
    textAlignVertical: 'top',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs + 2,
  },
  errorText: {
    ...typography.caption,
    color: colors.breaking,
    marginLeft: 4,
  },
});

export default TextField;
