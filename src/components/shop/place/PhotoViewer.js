/**
 * PhotoViewer.js — full-screen photo viewer for the place page: arrows,
 * keyboard (← → Esc), a counter and the photo's label.
 */
import React, { useEffect, useState } from 'react';
import { Modal, View, Text, Image, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '../../../theme';

export default function PhotoViewer({ photos, start, onClose }) {
  const [i, setI] = useState(start);
  const go = (d) => setI((x) => Math.max(0, Math.min(photos.length - 1, x + d)));

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onKey = (e) => {
      if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]); // eslint-disable-line react-hooks/exhaustive-deps

  const photo = photos[i];
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Image source={{ uri: photo.url }} style={styles.img} resizeMode="contain" />
        <Text style={styles.counter}>{i + 1} / {photos.length}{photo.label ? `  ·  ${photo.label}` : ''}</Text>
        {i > 0 && <Pressable onPress={() => go(-1)} style={[styles.arrow, { left: 24 }]}><MaterialCommunityIcons name="chevron-left" size={34} color={colors.white} /></Pressable>}
        {i < photos.length - 1 && <Pressable onPress={() => go(1)} style={[styles.arrow, { right: 24 }]}><MaterialCommunityIcons name="chevron-right" size={34} color={colors.white} /></Pressable>}
        <Pressable onPress={onClose} style={styles.close} accessibilityLabel="Close"><MaterialCommunityIcons name="close" size={26} color={colors.white} /></Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.94)', alignItems: 'center', justifyContent: 'center' },
  img: { width: '86%', height: '82%' },
  counter: { color: 'rgba(255,255,255,0.8)', marginTop: 14, fontSize: 14 },
  arrow: { position: 'absolute', top: '50%', marginTop: -28, width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  close: { position: 'absolute', top: 24, right: 24, width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
});
