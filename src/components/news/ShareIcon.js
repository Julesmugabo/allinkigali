/**
 * ShareIcon.js — the small share icon next to the views (eye) on the news
 * cards: one tap shares the article without opening it. A tick shows for a
 * moment once the link is copied (computers). `light` is for the navy hero card.
 */
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import useShareArticle from '../../hooks/useShareArticle';
import { colors } from '../../theme';

export default function ShareIcon({ article, light = false, style }) {
  const { share, copied } = useShareArticle(article);
  const tone = light ? 'rgba(133,183,235,0.85)' : colors.textMuted;

  const onPress = (e) => {
    e?.stopPropagation?.(); // share only: don't also open the article
    share();
  };

  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={copied ? 'Link yakoporowe' : 'Sangiza iyi nkuru'}
      style={({ hovered, pressed }) => [styles.icon, (hovered || pressed) && styles.iconOn, style]}
    >
      <MaterialCommunityIcons
        name={copied ? 'check' : 'share-variant-outline'}
        size={14}
        color={copied ? colors.success : tone}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  icon: { padding: 3, borderRadius: 12 },
  iconOn: { backgroundColor: 'rgba(55,138,221,0.14)' },
});
