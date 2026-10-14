/**
 * AdTag.js — the small "ITANGAZO" label every ad carries, so sponsored
 * content is never mistaken for news.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AdTag({ style }) {
  return <View style={[styles.tag, style]}><Text style={styles.text}>ITANGAZO</Text></View>;
}

const styles = StyleSheet.create({
  tag: { alignSelf: 'flex-start', backgroundColor: 'rgba(245,197,24,0.95)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  text: { fontSize: 9.5, fontWeight: '800', letterSpacing: 0.6, color: '#1C1C1E' },
});
