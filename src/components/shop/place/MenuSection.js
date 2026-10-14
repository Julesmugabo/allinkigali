/**
 * MenuSection.js — the menu grouped by category with tabs. When the place
 * delivers, each dish has a + / − to add it to the order in the action box.
 * Shows 8 dishes, then "See full menu".
 */
import React, { useMemo, useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { radius, spacing } from '../../../theme';
import Section from './Section';
import { useShopTheme, useShopStyles } from '../../../theme/shopThemes';

const SHORT = 8;
export const rwf = (n) => `${Number(n || 0).toLocaleString()} RWF`;

export default function MenuSection({ menu, canOrder, cart, onAdd, onRemove }) {
  const c = useShopTheme(); // eslint-disable-line no-unused-vars
  const styles = useShopStyles(makeStyles);
  const categories = useMemo(() => [...new Set(menu.map((m) => m.category || 'Menu'))], [menu]);
  const [tab, setTab] = useState(null);
  const [full, setFull] = useState(false);
  if (!menu.length) return null;
  const active = tab || categories[0];
  const items = menu.filter((m) => (m.category || 'Menu') === active);
  const shown = full ? items : items.slice(0, SHORT);

  return (
    <Section id="menu" title="Menu"
      right={canOrder ? <Text style={styles.hint}>Add dishes to order delivery</Text> : null}>
      <View style={styles.tabs}>
        {categories.map((c) => (
          <Pressable key={c} onPress={() => { setTab(c); setFull(false); }} style={[styles.tab, c === active && styles.tabOn]}>
            <Text style={[styles.tabLabel, c === active && styles.tabLabelOn]}>{c}</Text>
          </Pressable>
        ))}
      </View>
      {shown.map((m) => {
        const qty = cart[m.id]?.qty || 0;
        return (
          <View key={m.id} style={styles.item}>
            {m.photo_url ? <Image source={{ uri: m.photo_url }} style={styles.photo} /> : null}
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{m.name}</Text>
              {m.description ? <Text style={styles.desc} numberOfLines={2}>{m.description}</Text> : null}
            </View>
            <Text style={styles.price}>{rwf(m.price)}</Text>
            {canOrder ? (
              <View style={styles.stepper}>
                {qty > 0 && <Pressable onPress={() => onRemove(m)} style={styles.step}><MaterialCommunityIcons name="minus" size={16} color={c.text} /></Pressable>}
                {qty > 0 && <Text style={styles.qty}>{qty}</Text>}
                <Pressable onPress={() => onAdd(m)} style={[styles.step, styles.add]} accessibilityLabel={`Add ${m.name}`}>
                  <MaterialCommunityIcons name="plus" size={16} color={c.text} />
                </Pressable>
              </View>
            ) : null}
          </View>
        );
      })}
      {items.length > SHORT && (
        <Pressable onPress={() => setFull((f) => !f)}><Text style={styles.more}>{full ? 'Show less' : `See full menu (${items.length})`}</Text></Pressable>
      )}
    </Section>
  );
}

const makeStyles = (c) => StyleSheet.create({
  hint: { color: c.textMuted, fontSize: 13 },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  tab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: c.borderStrong },
  tabOn: { backgroundColor: c.accent, borderColor: c.accent },
  tabLabel: { color: c.textSoft, fontWeight: '600', fontSize: 13.5 },
  tabLabelOn: { color: c.text },
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.border },
  photo: { width: 56, height: 56, borderRadius: radius.sm },
  name: { color: c.text, fontSize: 15, fontWeight: '600' },
  desc: { color: c.textMuted, fontSize: 13, marginTop: 2 },
  price: { color: '#60C080', fontWeight: '700', fontSize: 14 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 92, justifyContent: 'flex-end' },
  step: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: c.surfaceAlt },
  add: { backgroundColor: c.accent },
  qty: { color: c.text, fontWeight: '700', minWidth: 14, textAlign: 'center' },
  more: { color: c.accentText, fontWeight: '600', marginTop: spacing.md },
});
