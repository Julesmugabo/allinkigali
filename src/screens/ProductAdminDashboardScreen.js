/**
 * ProductAdminDashboardScreen.js — Admin dashboard for Allingadget and
 * Uruhu Rwiza product catalogs, shared via route.params.store.
 *
 * Access granted by director:
 *   'allingadget' role → store = 'allingadget'
 *   'uruhurwiza'  role → store = 'uruhu-rwiza'
 *
 * Front-end only: local state overlays the static catalog — badge changes,
 * price edits and removals live for the session only.
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, FlatList, Pressable, TextInput, Modal,
  KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../components/common/GradientBackground';
import EmptyState from '../components/common/EmptyState';

import { STORES, BADGE_META } from '../data/productCatalogs';
import { formatPrice } from '../utils/format';
import { showAlert } from '../utils/showAlert';
import { colors, typography, spacing, radius, gutter } from '../theme';

const BADGE_OPTIONS = [
  { key: null,          label: 'None' },
  { key: 'best_seller', label: 'Best Seller' },
  { key: 'new',         label: 'New' },
  { key: 'hot',         label: 'Hot' },
  { key: 'luxury',      label: 'Luxury' },
];

export default function ProductAdminDashboardScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const store  = STORES[route.params?.store] || STORES.allingadget;

  // Overlays: badge overrides, price overrides, removed ids
  const [badgeOverrides, setBadgeOverrides] = useState({});   // { id: badge_key | null }
  const [priceOverrides, setPriceOverrides] = useState({});   // { id: number }
  const [removedIds,     setRemovedIds]     = useState(new Set());
  const [categoryFilter, setCategoryFilter] = useState(null); // null = All
  const [search,         setSearch]         = useState('');

  // Edit-price modal state
  const [editingProduct, setEditingProduct] = useState(null);
  const [editPriceText,  setEditPriceText]  = useState('');

  const products = useMemo(() => {
    const q = search.trim().toLowerCase();
    return store.products
      .filter((p) => !removedIds.has(p.id))
      .filter((p) => !categoryFilter || p.category === categoryFilter)
      .filter((p) => !q || `${p.brand} ${p.name}`.toLowerCase().includes(q));
  }, [store, removedIds, categoryFilter, search]);

  const total    = store.products.filter((p) => !removedIds.has(p.id)).length;
  const badgedCount = store.products.filter((p) => !removedIds.has(p.id) && (badgeOverrides[p.id] !== undefined ? badgeOverrides[p.id] : p.badge)).length;

  const setBadge = useCallback((id, badge) => {
    setBadgeOverrides((prev) => ({ ...prev, [id]: badge }));
  }, []);

  const openPriceEdit = useCallback((product) => {
    const current = priceOverrides[product.id] ?? product.price;
    setEditingProduct(product);
    setEditPriceText(String(current));
  }, [priceOverrides]);

  const savePriceEdit = useCallback(() => {
    const val = parseInt(editPriceText, 10);
    if (!isNaN(val) && val > 0 && editingProduct) {
      setPriceOverrides((prev) => ({ ...prev, [editingProduct.id]: val }));
    }
    setEditingProduct(null);
  }, [editingProduct, editPriceText]);

  const removeProduct = useCallback((id) => {
    showAlert('Remove product', 'Hide this product from the store.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setRemovedIds((p) => new Set([...p, id])) },
    ]);
  }, []);

  return (
    <GradientBackground>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Pressable onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Go back" style={styles.headerBack}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textOnNavy} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{store.name} Admin</Text>
          <Text style={styles.headerSub}>{store.tagline}</Text>
        </View>
        <Pressable
          onPress={() => showAlert('Add product', 'Product creation form coming soon.')}
          accessibilityRole="button"
          accessibilityLabel="Add product"
          style={styles.headerAction}
        >
          <MaterialCommunityIcons name="plus" size={20} color={colors.white} />
        </Pressable>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.huge }]}
        ListHeaderComponent={
          <>
            {/* Stats */}
            <View style={styles.statsRow}>
              <StatCard label="Products"    value={total}         icon="package-variant-closed" />
              <StatCard label="Badged"      value={badgedCount}   icon="tag-outline"   color="#BA7517" />
              <StatCard label="Categories"  value={store.categories.length} icon="shape-outline" color={colors.blue300} />
              <StatCard label="Removed"     value={removedIds.size} icon="trash-can-outline" color={colors.breaking} />
            </View>

            {/* Search */}
            <View style={styles.searchRow}>
              <MaterialCommunityIcons name="magnify" size={16} color={colors.textOnNavyFaint} style={styles.searchIcon} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search brand or product…"
                placeholderTextColor={colors.textOnNavyFaint}
                style={styles.searchInput}
              />
            </View>

            {/* Category tabs */}
            <View style={styles.catRow}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setCategoryFilter(null)}
                style={[styles.catChip, !categoryFilter && styles.catChipActive]}
              >
                <Text style={[styles.catLabel, !categoryFilter && styles.catLabelActive]}>All</Text>
              </Pressable>
              {store.categories.map((c) => {
                const active = categoryFilter === c.key;
                return (
                  <Pressable key={c.key} accessibilityRole="button" onPress={() => setCategoryFilter(c.key)}
                    style={[styles.catChip, active && styles.catChipActive]}
                  >
                    <MaterialCommunityIcons name={c.icon} size={12} color={active ? colors.white : colors.blue300} />
                    <Text style={[styles.catLabel, { marginLeft: 4 }, active && styles.catLabelActive]} numberOfLines={1}>{c.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.countLabel}>{products.length} products</Text>
          </>
        }
        ListEmptyComponent={
          <EmptyState tone="dark" icon="package-variant" title="No products match" message="Adjust your search or filter." />
        }
        renderItem={({ item }) => {
          const effectiveBadge = badgeOverrides[item.id] !== undefined ? badgeOverrides[item.id] : item.badge;
          const effectivePrice = priceOverrides[item.id] ?? item.price;
          const badgeMeta = effectiveBadge ? BADGE_META[effectiveBadge] : null;
          const cat = store.categories.find((c) => c.key === item.category);
          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.cardIconWell}>
                  <MaterialCommunityIcons name={item.icon} size={18} color={colors.blue300} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardBrand}>{item.brand}</Text>
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
                  {cat && <Text style={styles.cardMeta}>{cat.label}</Text>}
                </View>
                <Text style={styles.cardPrice}>{formatPrice(effectivePrice)}</Text>
              </View>

              {/* Badge selector */}
              <View style={styles.badgeRow}>
                <Text style={styles.badgePickerLabel}>Badge: </Text>
                <View style={styles.badgePills}>
                  {BADGE_OPTIONS.map((opt) => {
                    const selected = effectiveBadge === opt.key;
                    const bm = opt.key ? BADGE_META[opt.key] : null;
                    return (
                      <Pressable
                        key={opt.key || 'none'}
                        accessibilityRole="button"
                        onPress={() => setBadge(item.id, opt.key)}
                        style={[
                          styles.badgePill,
                          selected && { backgroundColor: bm ? bm.backgroundColor : 'rgba(133,183,235,0.25)' },
                        ]}
                      >
                        <Text style={[styles.badgePillLabel, selected && { color: '#fff', fontWeight: '700' }]}>{opt.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Actions */}
              <View style={styles.cardActions}>
                <ActionBtn
                  icon="pencil-outline"
                  label="Edit price"
                  color={colors.blue300}
                  onPress={() => openPriceEdit(item)}
                />
                <ActionBtn
                  icon="trash-can-outline"
                  label="Remove"
                  color={colors.breaking}
                  onPress={() => removeProduct(item.id)}
                />
              </View>
            </View>
          );
        }}
      />

      {/* Price edit modal */}
      <Modal visible={!!editingProduct} transparent animationType="fade" onRequestClose={() => setEditingProduct(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Edit price</Text>
            {editingProduct && (
              <Text style={styles.modalProduct} numberOfLines={1}>{editingProduct.brand} {editingProduct.name}</Text>
            )}
            <TextInput
              value={editPriceText}
              onChangeText={setEditPriceText}
              keyboardType="numeric"
              placeholder="Price in RWF"
              placeholderTextColor={colors.textOnNavyFaint}
              style={styles.modalInput}
              autoFocus
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setEditingProduct(null)} accessibilityRole="button" style={styles.modalCancel}>
                <Text style={styles.modalCancelLabel}>Cancel</Text>
              </Pressable>
              <Pressable onPress={savePriceEdit} accessibilityRole="button" style={styles.modalSave}>
                <Text style={styles.modalSaveLabel}>Save</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </GradientBackground>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <View style={styles.statCard}>
      <MaterialCommunityIcons name={icon} size={18} color={color || colors.textOnNavyFaint} />
      <Text style={[styles.statValue, color && { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ActionBtn({ icon, label, color, onPress }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}
      style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
    >
      <MaterialCommunityIcons name={icon} size={14} color={color} />
      <Text style={[styles.actionLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: gutter, paddingBottom: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(133,183,235,0.2)' },
  headerBack: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, marginLeft: spacing.md },
  headerTitle: { ...typography.bodyStrong, fontSize: 16, color: colors.white },
  headerSub: { fontSize: 11, color: colors.textOnNavyFaint, marginTop: 1 },
  headerAction: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.blue500, alignItems: 'center', justifyContent: 'center' },

  content: { paddingHorizontal: gutter, paddingTop: spacing.lg },

  statsRow: { flexDirection: 'row', marginBottom: spacing.lg },
  statCard: { flex: 1, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(133,183,235,0.2)', borderRadius: radius.md, paddingVertical: spacing.md, marginRight: spacing.xs },
  statValue: { fontSize: 20, fontWeight: '800', color: colors.white, marginTop: 3 },
  statLabel: { fontSize: 9.5, color: colors.textOnNavyFaint, marginTop: 1 },

  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(133,183,235,0.2)', borderRadius: radius.md, paddingHorizontal: spacing.md, marginBottom: spacing.md, height: 40 },
  searchIcon: { marginRight: spacing.sm },
  searchInput: { flex: 1, color: colors.white, fontSize: 13 },

  catRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm },
  catChip: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.pill, paddingHorizontal: spacing.md, height: 30, justifyContent: 'center', marginRight: spacing.sm, marginBottom: spacing.sm, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(133,183,235,0.25)' },
  catChipActive: { backgroundColor: colors.blue500, borderColor: colors.blue500 },
  catLabel: { fontSize: 11.5, color: colors.textOnNavy },
  catLabelActive: { color: colors.white, fontWeight: '600' },
  countLabel: { ...typography.caption, color: colors.textOnNavyFaint, marginBottom: spacing.sm },

  card: { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(133,183,235,0.22)', borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  cardIconWell: { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: 'rgba(55,138,221,0.18)', alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  cardInfo: { flex: 1 },
  cardBrand: { fontSize: 9.5, fontWeight: '700', color: colors.blue300, letterSpacing: 0.3 },
  cardTitle: { fontSize: 13, fontWeight: '600', color: colors.white },
  cardMeta: { fontSize: 10.5, color: colors.textOnNavyFaint, marginTop: 1 },
  cardPrice: { fontSize: 13, fontWeight: '700', color: colors.blue300 },

  badgeRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: spacing.sm },
  badgePickerLabel: { fontSize: 11, color: colors.textOnNavyFaint },
  badgePills: { flexDirection: 'row', flexWrap: 'wrap' },
  badgePill: { borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3, marginRight: 5, marginBottom: 3, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(133,183,235,0.25)' },
  badgePillLabel: { fontSize: 10, color: colors.textOnNavy },

  cardActions: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(133,183,235,0.15)', paddingTop: spacing.sm },
  actionBtn: { flexDirection: 'row', alignItems: 'center', marginRight: spacing.lg },
  actionBtnPressed: { opacity: 0.6 },
  actionLabel: { fontSize: 11, fontWeight: '600', marginLeft: 4 },

  // Price edit modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  modalBox: { width: '80%', backgroundColor: '#0d2d4e', borderRadius: radius.lg, padding: spacing.xl, borderWidth: 1, borderColor: 'rgba(133,183,235,0.3)' },
  modalTitle: { ...typography.bodyStrong, fontSize: 16, color: colors.white, marginBottom: spacing.xs },
  modalProduct: { fontSize: 12, color: colors.textOnNavyFaint, marginBottom: spacing.md },
  modalInput: { color: colors.white, fontSize: 18, fontWeight: '700', borderBottomWidth: 1, borderBottomColor: 'rgba(133,183,235,0.4)', paddingVertical: spacing.sm, marginBottom: spacing.lg },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  modalCancel: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, marginRight: spacing.sm },
  modalCancelLabel: { fontSize: 13, color: colors.textOnNavyFaint },
  modalSave: { backgroundColor: colors.blue500, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  modalSaveLabel: { fontSize: 13, fontWeight: '700', color: colors.white },
});
