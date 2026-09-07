/**
 * ShopSearchBar.js — Agasanduku ko gushakisha ibicuruzwa.
 * Live search field for the shop, styled for the dark gradient background.
 */
import React from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, radius } from '../../theme';

const ShopSearchBar = React.forwardRef(function ShopSearchBar(
  { value, onChangeText, onSubmit, placeholder = 'Shakisha igicuruzwa...', autoFocus = false },
  ref
) {
  const hasValue = Boolean(value && value.length);

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="magnify" size={20} color={colors.blue300} />

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
        autoCapitalize="none"
        autoFocus={autoFocus}
        selectionColor={colors.blue300}
        accessibilityLabel="Shakisha igicuruzwa"
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
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg - 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.3)',
  },
  input: {
    flex: 1,
    marginLeft: spacing.sm,
    ...typography.input,
    color: colors.textOnNavy,
    padding: 0,
  },
});

export default ShopSearchBar;
