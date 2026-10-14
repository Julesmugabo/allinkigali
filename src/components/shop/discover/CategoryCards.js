/**
 * CategoryCards.js — the four doors of the Resto/Coffee tab: big photo
 * cards, each with a live line ("9 open now", "4 quiet now"). Four in a
 * row on the website; `compact` puts them two by two for phones.
 */
import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, radius } from '../../../theme';

export default function CategoryCards({ cards, compact = false }) {
  return (
    <View style={[styles.grid, compact && styles.gridCompact]}>
      {cards.map((c) => (
        <Pressable key={c.key} onPress={c.onPress} accessibilityRole="button" accessibilityLabel={c.label}
          style={({ hovered, pressed }) => [styles.card, compact ? styles.cardCompact : styles.cardWide, (hovered || pressed) && styles.hover]}>
          {c.photo ? <Image source={{ uri: c.photo }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : null}
          <View style={styles.shade} />
          <View style={styles.icon}><MaterialCommunityIcons name={c.icon} size={compact ? 18 : 22} color={colors.white} /></View>
          <View style={styles.text}>
            <Text style={[styles.label, compact && styles.labelCompact]}>{c.label}</Text>
            <Text style={[styles.stat, compact && styles.statCompact]} numberOfLines={2}>{c.stat}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', gap: 16 },
  gridCompact: { flexWrap: 'wrap', justifyContent: 'space-between', gap: 0, rowGap: 12 },
  cardWide: { flex: 1, height: 320 },
  cardCompact: { width: '48.3%', aspectRatio: 0.92 },
  labelCompact: { fontSize: 17 },
  statCompact: { fontSize: 11.5, marginTop: 3 },
  card: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: '#0B3A66', justifyContent: 'flex-end' },
  hover: { transform: [{ translateY: -3 }] },
  shade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(2,20,40,0.45)' },
  icon: { position: 'absolute', top: 14, left: 14, width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  text: { padding: 16 },
  label: { color: colors.white, fontSize: 24, fontWeight: '800' },
  stat: { color: 'rgba(230,240,255,0.9)', fontSize: 14, marginTop: 4, fontWeight: '600' },
});
