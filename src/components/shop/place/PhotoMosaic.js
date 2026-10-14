/**
 * PhotoMosaic.js — one big photo with up to four smaller ones beside it;
 * the last tile says "+N photos". Any photo opens the full-screen viewer.
 */
import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { radius } from '../../../theme';
import { useShopTheme, useShopStyles } from '../../../theme/shopThemes';

function Tile({ photo, onPress, style, more }) {
  const c = useShopTheme(); // eslint-disable-line no-unused-vars
  const styles = useShopStyles(makeStyles);
  return (
    <Pressable onPress={onPress} style={({ hovered }) => [styles.tile, style, hovered && styles.hover]}>
      <Image source={{ uri: photo.url }} style={styles.img} resizeMode="cover" />
      {more ? <View style={styles.more}><Text style={styles.moreText}>+{more} photos</Text></View> : null}
    </Pressable>
  );
}

export default function PhotoMosaic({ photos, icon, onOpen }) {
  const c = useShopTheme(); // eslint-disable-line no-unused-vars
  const styles = useShopStyles(makeStyles);
  if (!photos.length) {
    return (
      <View style={[styles.wrap, styles.empty]}>
        <MaterialCommunityIcons name={icon} size={64} color={c.textMuted} />
        <Text style={styles.emptyText}>No photos yet</Text>
      </View>
    );
  }
  const side = photos.slice(1, 5);
  const extra = photos.length - 5;
  return (
    <View style={styles.wrap}>
      <Tile photo={photos[0]} onPress={() => onOpen(0)} style={side.length ? styles.main : styles.full} />
      {side.length > 0 && (
        <View style={styles.side}>
          {side.map((p, i) => (
            <Tile key={p.url + i} photo={p} onPress={() => onOpen(i + 1)} style={side.length === 1 ? styles.full : styles.small}
              more={i === side.length - 1 && extra > 0 ? extra : 0} />
          ))}
        </View>
      )}
    </View>
  );
}

const makeStyles = (c) => StyleSheet.create({
  wrap: { flexDirection: 'row', gap: 8, height: 420, borderRadius: radius.lg, overflow: 'hidden' },
  empty: { alignItems: 'center', justifyContent: 'center', backgroundColor: c.surface, flexDirection: 'column', gap: 8, height: 260 },
  emptyText: { color: c.textMuted },
  tile: { overflow: 'hidden', backgroundColor: c.photoWell },
  hover: { opacity: 0.88 },
  main: { flex: 2 },
  full: { flex: 1 },
  side: { flex: 1.4, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  small: { width: 'calc(50% - 4px)', height: 'calc(50% - 4px)' },
  img: { width: '100%', height: '100%' },
  more: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(2,20,40,0.6)', alignItems: 'center', justifyContent: 'center' },
  moreText: { color: c.text, fontSize: 18, fontWeight: '800' },
});
