/**
 * PropertyAdminDashboardScreen.js — Admin dashboard for house listings.
 * Used for both Inzu Zamacye (rent) and House for Sale (sale) via route params.
 *   route.params.mode = 'rent' | 'sale'
 *
 * Access granted by director:
 *   'inzuzamacye' role → rent mode
 *   'salehouse' role   → sale mode
 *
 * Front-end only: wraps PropertyContext so any houses listed through the
 * customer app appear here too within the same session.
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, FlatList, Pressable, TextInput, ActivityIndicator, StyleSheet, Image,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../components/common/GradientBackground';
import EmptyState from '../components/common/EmptyState';

import { useProperties } from '../context/PropertyContext';
import { PROVINCES, findDistrictLabel } from '../data/rwandaLocations';
import { formatPrice } from '../utils/format';
import { showAlert } from '../utils/showAlert';
import { getToken } from '../services/apiClient';
import { pickAndUpload } from '../utils/uploadPhoto';
import { colors, typography, spacing, radius, gutter } from '../theme';

const MODE_META = {
  rent: {
    title: 'Inzu Zamacye Admin',
    sub: 'Rental listings management',
    statusLabel: (sold) => sold ? 'Rented out' : 'Available',
    markLabel: (sold) => sold ? 'Mark available' : 'Mark rented',
    icon: 'home-search-outline',
    statusColor: '#2E9E5B',
    rentedColor: '#BA7517',
  },
  sale: {
    title: 'House for Sale Admin',
    sub: 'Sale listings management',
    statusLabel: (sold) => sold ? 'Sold' : 'For sale',
    markLabel: (sold) => sold ? 'Mark for sale' : 'Mark sold',
    icon: 'home-city-outline',
    statusColor: '#2E9E5B',
    rentedColor: '#D0342C',
  },
};

const FILTERS = [
  { key: 'all',       label: 'All' },
  { key: 'available', label: 'Available' },
  { key: 'rented',    label: 'Sold/Rented' },
];

export default function PropertyAdminDashboardScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const mode = route.params?.mode === 'sale' ? 'sale' : 'rent';
  const meta = MODE_META[mode];
  const { properties } = useProperties();

  const { pinProperty, toggleStatus, removeProperty, updatePropertyPhotos } = useProperties();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedPhotoId, setExpandedPhotoId] = useState(null);
  const [newPhotoLabel, setNewPhotoLabel] = useState('');
  const [photoBusy, setPhotoBusy] = useState(false);

  const listings = useMemo(() => {
    const q = search.trim().toLowerCase();
    return properties
      .filter((p) => p.listingType === mode)
      .filter((p) => {
        if (filter === 'available') return !p.rentedSold;
        if (filter === 'rented')    return p.rentedSold;
        return true;
      })
      .filter((p) => !q || p.title.toLowerCase().includes(q) || p.sector.toLowerCase().includes(q))
      .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  }, [properties, mode, filter, search]);

  const total     = properties.filter((p) => p.listingType === mode).length;
  const rented    = properties.filter((p) => p.listingType === mode && p.rentedSold).length;
  const available = total - rented;
  const featured  = properties.filter((p) => p.listingType === mode && p.pinned).length;

  const toggleRented   = useCallback(async (id) => {
    try { await toggleStatus(id); } catch { showAlert('Error', 'Could not update listing.'); }
  }, [toggleStatus]);
  const toggleFeatured = useCallback(async (id) => {
    try { await pinProperty(id); } catch { showAlert('Error', 'Could not update listing.'); }
  }, [pinProperty]);
  const addPhoto = useCallback(async (item) => {
    const label = newPhotoLabel.trim();
    if (!label) { showAlert('Required', 'Enter a label first, then pick a photo.'); return; }
    setPhotoBusy(true);
    try {
      const token = await getToken();
      const url   = await pickAndUpload(token);
      if (!url) return;
      const updated = [...(item.photos || []), { url, label, isVideo: false }];
      await updatePropertyPhotos(item.id, updated);
      setNewPhotoLabel('');
    } catch (e) { showAlert('Error', e.message || 'Could not upload photo.'); }
    finally { setPhotoBusy(false); }
  }, [newPhotoLabel, updatePropertyPhotos]);

  const removePhoto = useCallback(async (item, idx) => {
    setPhotoBusy(true);
    try {
      const updated = (item.photos || []).filter((_, i) => i !== idx);
      await updatePropertyPhotos(item.id, updated);
    } catch { showAlert('Error', 'Could not remove photo.'); }
    finally { setPhotoBusy(false); }
  }, [updatePropertyPhotos]);

  const removeListing  = useCallback((id) => {
    showAlert('Remove listing', 'Hide this listing from the public view.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try { await removeProperty(id); } catch { showAlert('Error', 'Could not remove listing.'); }
      }},
    ]);
  }, [removeProperty]);

  return (
    <GradientBackground>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.headerBack}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textOnNavy} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{meta.title}</Text>
          <Text style={styles.headerSub}>{meta.sub}</Text>
        </View>
        <Pressable
          onPress={() => showAlert('Add listing', 'Listing creation form coming soon.')}
          accessibilityRole="button"
          accessibilityLabel="Add listing"
          style={styles.headerAction}
        >
          <MaterialCommunityIcons name="plus" size={20} color={colors.white} />
        </Pressable>
      </View>

      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.huge }]}
        ListHeaderComponent={
          <>
            {/* Stats */}
            <View style={styles.statsRow}>
              <StatCard label="Total"     value={total}    icon={meta.icon} />
              <StatCard label="Available" value={available} icon="check-circle-outline" color={meta.statusColor} />
              <StatCard label={mode === 'rent' ? 'Rented' : 'Sold'} value={rented} icon="tag-check-outline" color={meta.rentedColor} />
              <StatCard label="Pinned"    value={featured} icon="star-outline" color={colors.blue300} />
            </View>

            {/* Search */}
            <View style={styles.searchRow}>
              <MaterialCommunityIcons name="magnify" size={16} color={colors.textOnNavyFaint} style={styles.searchIcon} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search title or sector…"
                placeholderTextColor={colors.textOnNavyFaint}
                style={styles.searchInput}
              />
            </View>

            {/* Filter tabs */}
            <View style={styles.filterRow}>
              {FILTERS.map((f) => {
                const active = filter === f.key;
                return (
                  <Pressable key={f.key} accessibilityRole="button" onPress={() => setFilter(f.key)}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                  >
                    <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>{f.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.countLabel}>{listings.length} listings</Text>
          </>
        }
        ListEmptyComponent={
          <EmptyState tone="dark" icon={meta.icon} title="No listings match" message="Adjust your search or filter." />
        }
        renderItem={({ item }) => {
          const isRented   = item.rentedSold;
          const isFeatured = item.pinned;
          const district   = findDistrictLabel(item.province, item.district);
          const provLabel  = PROVINCES.find((p) => p.key === item.province)?.label || item.province;
          const priceSuffix = mode === 'rent' ? '/mo' : '';
          return (
            <View style={[styles.card, isRented && styles.cardRented]}>
              <View style={styles.cardTop}>
                <View style={styles.cardIconWell}>
                  <MaterialCommunityIcons name={meta.icon} size={16} color={isRented ? colors.textOnNavyFaint : colors.blue300} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.cardMeta}>
                    {item.bedrooms}bd · {item.bathrooms}ba · {item.sizeSqm}m² · {item.sector}, {district}
                  </Text>
                </View>
                <Text style={styles.cardPrice}>{formatPrice(item.price)}{priceSuffix}</Text>
              </View>

              <View style={styles.cardTags}>
                <View style={styles.typeChip}>
                  <Text style={styles.typeChipLabel}>{provLabel}</Text>
                </View>
                {isFeatured && (
                  <View style={[styles.typeChip, styles.featuredChip]}>
                    <MaterialCommunityIcons name="star" size={10} color="#f4c542" />
                    <Text style={[styles.typeChipLabel, { color: '#f4c542', marginLeft: 3 }]}>Pinned</Text>
                  </View>
                )}
                <View style={[styles.typeChip, isRented ? styles.rentedChip : styles.availableChip]}>
                  <Text style={[styles.typeChipLabel, { color: isRented ? meta.rentedColor : meta.statusColor }]}>
                    {meta.statusLabel(isRented)}
                  </Text>
                </View>
              </View>

              <View style={styles.cardActions}>
                <ActionBtn
                  icon={isFeatured ? 'star' : 'star-outline'}
                  label={isFeatured ? 'Unpin' : 'Pin'}
                  color={isFeatured ? '#f4c542' : colors.blue300}
                  onPress={() => toggleFeatured(item.id)}
                />
                <ActionBtn
                  icon={isRented ? 'home-outline' : 'tag-check-outline'}
                  label={meta.markLabel(isRented)}
                  color={isRented ? colors.textOnNavyFaint : meta.rentedColor}
                  onPress={() => toggleRented(item.id)}
                />
                <ActionBtn
                  icon="image-multiple-outline"
                  label={`Photos (${(item.photos || []).length})`}
                  color={colors.blue300}
                  onPress={() => setExpandedPhotoId((prev) => prev === item.id ? null : item.id)}
                />
                <ActionBtn
                  icon="trash-can-outline"
                  label="Remove"
                  color={colors.breaking}
                  onPress={() => removeListing(item.id)}
                />
              </View>

              {/* Photo management panel */}
              {expandedPhotoId === item.id && (
                <View style={styles.photoPanel}>
                  {(item.photos || []).map((ph, idx) => (
                    <View key={idx} style={styles.photoRow}>
                      {ph.url ? (
                        <Image source={{ uri: ph.url }} style={styles.photoThumb} />
                      ) : (
                        <MaterialCommunityIcons name="image-outline" size={28} color={colors.blue300} style={styles.photoThumb} />
                      )}
                      <Text style={styles.photoRowLabel} numberOfLines={1}>{ph.label}</Text>
                      <Pressable onPress={() => removePhoto(item, idx)} accessibilityRole="button" accessibilityLabel="Remove photo">
                        <MaterialCommunityIcons name="close" size={16} color={colors.breaking} />
                      </Pressable>
                    </View>
                  ))}
                  <View style={styles.photoAddRow}>
                    <TextInput
                      value={newPhotoLabel}
                      onChangeText={setNewPhotoLabel}
                      placeholder="Label (e.g. Living room)"
                      placeholderTextColor={colors.textOnNavyFaint}
                      style={[styles.photoInput, { flex: 1, marginBottom: 0, marginRight: spacing.sm }]}
                    />
                    <Pressable
                      onPress={() => addPhoto(item)}
                      disabled={photoBusy}
                      style={styles.photoAddBtn}
                      accessibilityRole="button"
                      accessibilityLabel="Pick and upload photo"
                    >
                      {photoBusy
                        ? <ActivityIndicator size="small" color={colors.white} />
                        : <MaterialCommunityIcons name="image-plus" size={16} color={colors.white} />}
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          );
        }}
      />
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
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: gutter, paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(133,183,235,0.2)',
  },
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

  filterRow: { flexDirection: 'row', marginBottom: spacing.sm },
  filterChip: { borderRadius: radius.pill, paddingHorizontal: spacing.md, height: 30, justifyContent: 'center', marginRight: spacing.sm, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(133,183,235,0.25)' },
  filterChipActive: { backgroundColor: colors.blue500, borderColor: colors.blue500 },
  filterLabel: { fontSize: 12, color: colors.textOnNavy },
  filterLabelActive: { color: colors.white, fontWeight: '600' },
  countLabel: { ...typography.caption, color: colors.textOnNavyFaint, marginBottom: spacing.sm },

  card: { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(133,183,235,0.22)', borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  cardRented: { opacity: 0.65 },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  cardIconWell: { width: 34, height: 34, borderRadius: radius.sm, backgroundColor: 'rgba(55,138,221,0.18)', alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 13, fontWeight: '600', color: colors.white },
  cardMeta: { fontSize: 10.5, color: colors.textOnNavyFaint, marginTop: 1 },
  cardPrice: { fontSize: 13, fontWeight: '700', color: colors.blue300 },

  cardTags: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm },
  typeChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(133,183,235,0.12)', borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 3, marginRight: 5, marginBottom: 4 },
  typeChipLabel: { fontSize: 10, color: colors.blue300 },
  featuredChip: { backgroundColor: 'rgba(244,197,66,0.12)' },
  rentedChip: { backgroundColor: 'rgba(186,117,23,0.15)' },
  availableChip: { backgroundColor: 'rgba(46,158,91,0.12)' },

  cardActions: { flexDirection: 'row', flexWrap: 'wrap', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(133,183,235,0.15)', paddingTop: spacing.sm },
  actionBtn: { flexDirection: 'row', alignItems: 'center', marginRight: spacing.md, marginBottom: 4 },
  actionBtnPressed: { opacity: 0.6 },
  actionLabel: { fontSize: 11, fontWeight: '600', marginLeft: 4 },

  photoPanel: { marginTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(133,183,235,0.15)', paddingTop: spacing.sm },
  photoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, gap: spacing.sm },
  photoThumb: { width: 40, height: 40, borderRadius: radius.sm, backgroundColor: 'rgba(55,138,221,0.15)' },
  photoRowLabel: { flex: 1, fontSize: 11, color: colors.textOnNavy },
  photoInput: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 6, fontSize: 12, color: colors.white, marginBottom: spacing.xs, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(133,183,235,0.25)' },
  photoAddRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  photoAddBtn: { width: 40, height: 40, borderRadius: radius.sm, backgroundColor: colors.blue500, alignItems: 'center', justifyContent: 'center' },
});
