/**
 * ShareArticleButton.js — "Sangiza": shares a news article's link.
 *
 * Phones (app): the phone's own share sheet (WhatsApp, SMS, …).
 * Web: the share sheet on phone browsers; on computers the link is copied and the button says so for a moment.
 * Every article gets it automatically: it only needs the article.
 */
import React, { useState } from 'react';
import { Text, Pressable, Share, Platform, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, spacing, radius } from '../../theme';

const SITE = (process.env.EXPO_PUBLIC_SITE_URL || 'https://allinkigali.rw').replace(/\/$/, '');
export const articleLink = (article) => `${SITE}/news/article/${article.id}`;

export default function ShareArticleButton({ article, style }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = articleLink(article);
    try {
      if (Platform.OS !== 'web') {
        await Share.share({ message: `${article.title}\n${url}`, url, title: article.title });
        return;
      }
      // Phone browsers get their share sheet; computers just copy the link.
      if (navigator.share && window.matchMedia?.('(pointer: coarse)').matches) {
        await navigator.share({ title: article.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // The person closed the share sheet: nothing to do.
    }
  };

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
