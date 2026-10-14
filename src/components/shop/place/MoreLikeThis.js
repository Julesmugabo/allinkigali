/**
 * MoreLikeThis.js — four similar places under the page, so a visitor who
 * isn't convinced has somewhere to go next.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BrowseCard from '../browse/BrowseCard';
import useSavedPlaces from '../../../hooks/useSavedPlaces';
import { spacing } from '../../../theme';
import { useShopTheme, useShopStyles } from '../../../theme/shopThemes';

export default function MoreLikeThis({ kind, places, onOpen }) {
  const c = useShopTheme(); // eslint-disable-line no-unused-vars
  const styles = useShopStyles(makeStyles);
  const { isSaved, toggle } = useSavedPlaces();
  if (!places.length) return null;
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>More like this</Text>
      <View style={styles.row}>
        {places.map((p) => (
          <View key={p.id} style={styles.cell}>
            <BrowseCard place={p} kind={kind} saved={isSaved(kind.key, p.id)} onToggleSave={() => toggle(kind.key, p.id)} onPress={() => onOpen(p.id)} />
          </View>
        ))}
      </View>
    </View>
  );
}

const makeStyles = (c) => StyleSheet.create({
  wrap: { marginTop: spacing.huge, paddingTop: spacing.xxl, borderTopWidth: 1, borderTopColor: c.border },
  title: { color: c.text, fontSize: 22, fontWeight: '800', marginBottom: spacing.md },
  row: { flexDirection: 'row', marginHorizontal: -8 },
  cell: { width: '25%', padding: 8 },
});
