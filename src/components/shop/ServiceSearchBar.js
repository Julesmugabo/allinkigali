/**
 * ServiceSearchBar.js — Agasanduku ko gusaba serivisi mu magambo asanzwe.
 *
 * Kept separate from ShopSearchBar (products) even though they look alike:
 * this one is meant for free-form natural-language requests ("gym hafi
 * yanjye") that will eventually go through an AI backend, not a plain
 * keyword field — so its behaviour is free to diverge later.
 */
import React from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, radius } from '../../theme';

const ServiceSearchBar = React.forwardRef(function ServiceSearchBar(
  { value, onChangeText, onSubmit, placeholder = "Ubwira iki? Urugero: 'gym hafi yanjye'", autoFocus = false },
  ref
) {
  const hasValue = Boolean(value && value.length);

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="text-search" size={20} color={colors.blue300} />

      <TextInput
        ref={ref}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor="rgba(133,183,235,0.55)"
        style={styles.input}
        returnKeyType="search"
        autoCorrect={false}
        autoFocus={autoFocus}
        selectionColor={colors.blue300}
        accessibilityLabel="Andika icyo ushaka"
      />

      {hasValue ? (
        <Pressable
          onPress={() => onChangeText('')}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Siba ibyanditse"
        >
          <MaterialCommunityIcons name="close-circle" size={18} color="rgba(133,183,235,0.7)" />
        </Pressable>
      ) : (
        <Pressable
          onPress={onSubmit}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Shakisha"
        >
          <MaterialCommunityIcons name="send-circle" size={26} color={colors.blue500} />
        </Pressable>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg - 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.3)',
  },
  input: {
    flex: 1,
    marginLeft: spacing.sm,
    marginRight: spacing.sm,
    ...typography.input,
    color: colors.textOnNavy,
    paddingVertical: spacing.md,
  },
});

export default ServiceSearchBar;
