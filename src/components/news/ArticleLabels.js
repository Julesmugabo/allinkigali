/**
 * ArticleLabels.js — The row of small tags (BREAKING, EXCLUSIVE, ...) an
 * article carries. Renders nothing when it has none, so cards without labels
 * take no extra space.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';

import Badge from '../common/Badge';
import { LABELS, getArticleLabelKeys } from '../../data/articleLabels';
import { colors, spacing } from '../../theme';

export default function ArticleLabels({ article, style }) {
  const keys = getArticleLabelKeys(article);
  if (!keys.length) return null;

  return (
    <View style={[styles.row, style]}>
      {keys.map((key) => (
        <Badge
          key={key}
          label={LABELS[key].text}
          color={colors.white}
          backgroundColor={LABELS[key].backgroundColor}
          style={styles.badge}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  badge: { marginRight: spacing.xs, marginBottom: spacing.xs },
});
