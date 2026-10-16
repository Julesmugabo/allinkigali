/**
 * ShareArticleButton.js — "Sangiza": the share button on the article page.
 * Every article gets it automatically: it only needs the article. The news
 * cards use the icon-only ShareIcon instead; both share the same way
 * (see useShareArticle).
 */
import React from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import useShareArticle from '../../hooks/useShareArticle';
import { colors, spacing, radius } from '../../theme';

export default function ShareArticleButton({ article, style }) {
  const { share, copied } = useShareArticle(article);

  return (
    <Pressable
      onPress={share}
      accessibilityRole="button"
      accessibilityLabel="Sangiza iyi nkuru"
      style={({ hovered, pressed }) => [styles.button, (hovered || pressed) && styles.buttonOn, style]}
    >
      <MaterialCommunityIcons name={copied ? 'check' : 'share-variant'} size={16} color={colors.white} />
      <Text style={styles.label}>{copied ? 'Link yakoporowe' : 'Sangiza'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.blue500, borderRadius: radius.pill,
    paddingHorizontal: spacing.md, paddingVertical: 6,
  },
  buttonOn: { backgroundColor: colors.blue600 },
  label: { fontSize: 13, fontWeight: '700', color: colors.white },
});
