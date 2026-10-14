/**
 * FoodOrderStatusScreen.js — after checkout: every place's part of the
 * order with its own progress (Received → Confirmed → Preparing → On the
 * way → Delivered), refreshed every 15 seconds as the restaurants move it
 * along in their dashboards.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import GradientBackground from '../../../components/common/GradientBackground';
import WebContainer from '../../../web/layout/WebContainer';
import { rwf } from '../../../components/shop/place/MenuSection';
import { apiFetch } from '../../../services/apiClient';
import { useShopTheme, useShopStyles } from '../../../theme/shopThemes';
import { radius, spacing } from '../../../theme';

const STEPS = [['pending', 'Received'], ['confirmed', 'Confirmed'], ['preparing', 'Preparing'], ['ready', 'On the way'], ['delivered', 'Delivered']];

export default function FoodOrderStatusScreen({ navigation, route }) {
  const c = useShopTheme();
  const styles = useShopStyles(makeStyles);
  const { checkoutId } = route.params || {};
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    const load = () => apiFetch(`/food-orders/checkout/${checkoutId}`)
      .then((d) => live && setOrders(d)).catch((e) => live && setError(e.message));
    load();
    const t = setInterval(load, 15000);
    return () => { live = false; clearInterval(t); };
  }, [checkoutId]);

  return (
    <GradientBackground colorsOverride={c.gradient}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <WebContainer style={{ maxWidth: 820 }}>
          <MaterialCommunityIcons name="check-circle-outline" size={52} color="#7BC67E" />
          <Text style={styles.heading}>Thank you — your order is in!</Text>
          <Text style={styles.sub}>Each place prepares its part and you'll get a notification at every step. This page updates by itself.</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {!orders && !error ? <ActivityIndicator color={c.accentText} style={{ marginTop: spacing.xl }} /> : null}
          {(orders || []).map((o) => {
            const at = STEPS.findIndex(([k]) => k === o.status);
            return (
              <View key={o.id} style={styles.card}>
                <View style={styles.row}><Text style={styles.place}>{o.placeName}</Text><Text style={styles.code}>#{o.code}</Text></View>
                {o.status === 'cancelled' ? <Text style={styles.cancelled}>This part was cancelled.</Text> : (
                  <View style={styles.steps}>
                    {STEPS.map(([k, label], i) => (
                      <View key={k} style={styles.step}>
                        <View style={[styles.dot, i <= at && styles.dotOn]}>{i <= at ? <MaterialCommunityIcons name="check" size={12} color="#FFFFFF" /> : null}</View>
                        <Text style={[styles.stepLabel, i === at && styles.stepNow]}>{label}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {o.items.map((i) => <Text key={i.id} style={styles.item}>{i.qty} × {i.name}{i.note ? ` — “${i.note}”` : ''}</Text>)}
                <Text style={styles.total}>Total {rwf(o.total)} · cash on delivery</Text>
              </View>
            );
          })}
          <View style={styles.actions}>
            <Pressable onPress={() => navigation.navigate('OrderFood')} style={styles.btn}><Text style={styles.btnText}>Order something else</Text></Pressable>
            <Pressable onPress={() => navigation.navigate('AccountTab', { screen: 'Orders' })}><Text style={styles.link}>See all my orders</Text></Pressable>
          </View>
        </WebContainer>
      </ScrollView>
    </GradientBackground>
  );
}

const makeStyles = (c) => StyleSheet.create({
  scroll: { paddingTop: spacing.huge, paddingBottom: 120 },
  heading: { color: c.text, fontSize: 28, fontWeight: '800', marginTop: spacing.sm },
  sub: { color: c.textSoft, fontSize: 15, marginTop: 6, marginBottom: spacing.lg },
  error: { color: '#F87171' },
  card: { backgroundColor: c.panel, borderRadius: radius.lg, borderWidth: 1, borderColor: c.border, padding: 18, gap: 8, marginTop: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  place: { color: c.text, fontSize: 18, fontWeight: '800' },
  code: { color: c.textMuted, fontWeight: '700' },
  steps: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 },
  step: { alignItems: 'center', gap: 6, flex: 1 },
  dot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: c.borderStrong, alignItems: 'center', justifyContent: 'center' },
  dotOn: { backgroundColor: '#2E8B57', borderColor: '#2E8B57' },
  stepLabel: { color: c.textMuted, fontSize: 12.5, textAlign: 'center' },
  stepNow: { color: c.text, fontWeight: '800' },
  cancelled: { color: '#F87171', fontWeight: '700' },
  item: { color: c.textSoft, fontSize: 14 },
  total: { color: c.text, fontWeight: '700', marginTop: 4 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: spacing.xl },
  btn: { backgroundColor: c.cta, borderRadius: radius.md, paddingHorizontal: 18, paddingVertical: 12 },
  btnText: { color: c.ctaText, fontWeight: '800' },
  link: { color: c.accentText, fontWeight: '700' },
});
