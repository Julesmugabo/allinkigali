/**
 * AdMedia.js — an ad's photo, or its video (muted, never auto-playing,
 * with a play mark so it reads as a video), filling its box.
 */
import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '../../../theme';

export default function AdMedia({ ad, style }) {
  if (ad.type !== 'video') return <Image source={{ uri: ad.mediaUri }} style={[styles.fill, style]} resizeMode="cover" />;
  return (
    <View style={[styles.fill, style]}>
      <Video source={{ uri: ad.mediaUri }} style={StyleSheet.absoluteFill} resizeMode={ResizeMode.COVER} isMuted shouldPlay={false} />
      <View style={styles.play}><MaterialCommunityIcons name="play" size={18} color={colors.white} /></View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { width: '100%', height: '100%', backgroundColor: '#0B2E52' },
  play: { position: 'absolute', alignSelf: 'center', top: '50%', marginTop: -16, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
});
