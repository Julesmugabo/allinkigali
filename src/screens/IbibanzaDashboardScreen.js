/**
 * IbibanzaDashboardScreen.js — Admin dashboard for Ibibanza (land listings).
 * Access granted by the director via assign-role → 'ibibanza'.
 *
 * Front-end only: manages the in-memory LAND_LISTINGS array. A real backend
 * (REST or direct DB) would replace the local state here.
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, FlatList, Pressable, TextInput, ActivityIndicator, StyleSheet, Image,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../components/common/GradientBackground';
import EmptyState from '../components/common/EmptyState';

import { LAND_TYPES } from '../data/landListings';
import { useLand } from '../context/LandContext';
import { PROVINCES, findDistrictLabel } from '../data/rwandaLocations';
import { formatPrice } from '../utils/format';
import { showAlert } from '../utils/showAlert';
import { getToken } from '../services/apiClient';
import { pickAndUpload } from '../utils/uploadPhoto';
import { colors, typography, spacing, radius, gutter } from '../theme';

const FILTERS = [
  { key: 'all',    label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'sold',   label: 'Sold' },
];

const PROVINCE_LABEL = (k) => PROVINCES.find((p) => p.key === k)?.label || k;

export default function IbibanzaDashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { listings: allListings, isLoading, pinLand, markSold, removeLand, updateLandPhotos } = useLand();

  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedPhotoId, setExpandedPhotoId] = useState(null);
  const [newPhotoUrl,   setNewPhotoUrl]   = useState('');
  const [newPhotoLabel, setNewPhotoLabel] = useState('');
  const [newPhotoVideo, setNewPhotoVideo] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);

  const listings = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allListings
      .filter((l) => {
        if (filter === 'active') return !l.sold;
        if (filter === 'sold')   return l.sold;
        return true;
      })
      .filter((l) => !q || l.title.toLowerCase().includes(q) || l.sector.toLowerCase().includes(q))
      .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  }, [allListings, filter, search]);

  const total    = allListings.length;
  const active   = allListings.filter((l) => !l.sold).length;
  const sold     = allListings.filter((l) => l.sold).length;
  const featured = allListings.filter((l) => l.pinned).length;

  const toggleSold = useCallback(async (id) => {
    try { await markSold(id); } catch { showAlert('Error', 'Could not update listing.'); }
  }, [markSold]);

  const toggleFeatured = useCallback(async (id) => {
    try { await pinLand(id); } catch { showAlert('Error', 'Could not update listing.'); }
  }, [pinLand]);

  const addPhoto = useCallback(async (item) => {
    const label = newPhotoLabel.trim();
    if (!label) { showAlert('Required', 'Enter a label first, then pick a photo.'); return; }
    setPhotoBusy(true);
    try {
      const token = await getToken();
      const url   = await pickAndUpload(token);
      if (!url) return; // user cancelled
      const updated = [...(item.photos || []), { url, label, isVideo: false }];
      await updateLandPhotos(item.id, updated);
      setNewPhotoLabel('');
    } catch (e) { showAlert('Error', e.message || 'Could not upload photo.'); }
    finally { setPhotoBusy(false); }
  }, [newPhotoLabel, updateLandPhotos]);

  const removePhoto = useCallback(async (item, idx) => {
    setPhotoBusy(true);
    try {
      const updated = (item.photos || []).filter((_, i) => i !== idx);
      await updateLandPhotos(item.id, updated);
    } catch { showAlert('Error', 'Could not remove photo.'); }
    finally { setPhotoBusy(false); }
  }, [updateLandPhotos]);

  const removeListing = useCallback((id) => {
    showAlert('Remove listing', 'This will hide the plot from the public listing.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try { await removeLand(id); } catch { showAlert('Error', 'Could not remove listing.'); }
      }},
    ]);
  }, [removeLand]);

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
          <Text style={styles.headerTitle}>Ibibanza Admin</Text>
          <Text style={styles.headerSub}>Land listings management</Text>
        </View>
        <Pressable
          onPress={() => showAlert('Add Plot', 'Plot creation form coming soon.')}
          accessibilityRole="button"
          accessibilityLabel="Add plot"
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
              <StatCard label="Total" value={total}    icon="terrain"              />
              <StatCard label="Active" value={active}  icon="check-circle-outline" color={colors.success} />
              <StatCard label="Sold"  value={sold}     icon="tag-check-outline"    color="#BA7517" />
              <StatCard label="Pinned" value={featured} icon="star-outline"        color={colors.blue300} />
            </View>

            {/* Search */}
            <View style={styles.searchRow}>
              <MaterialCommunityIcons name="magnify" size={16} color={colors.textOnNavyFaint} style={styles.searchIcon} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search by title or sector…"
                placeholderTextColor={colors.textOnNavyFaint}
                style={styles.searchInput}
              />
            </View>

            {/* Filter tabs */}
            <View style={styles.filterRow}>
              {FILTERS.map((f) => {
                const active = filter === f.key;
                return (
                  <Pressable
                    key={f.key}
                    accessibilityRole="button"
                    onPress={() => setFilter(f.key)}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                  >
                    <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>{f.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.countLabel}>{listings.length} plots</Text>
          </>
        }
        ListEmptyComponent={
          <EmptyState tone="dark" icon="terrain" title="No plots match" message="Adjust your search or filter." />
        }
        renderItem={({ item }) => {
          const typeMeta = LAND_TYPES[item.type] || LAND_TYPES.residential;
          const isSold     = item.sold;
          const isFeatured = item.pinned;
          const district   = findDistrictLabel(item.province, item.district);
          return (
            <View style={[styles.card, isSold && styles.cardSold]}>
              {/* Top row */}
              <View style={styles.cardTop}>
                <View style={styles.cardIconWell}>
                  <MaterialCommunityIcons name={typeMeta.icon} size={18} color={isSold ? colors.textOnNavyFaint : colors.blue300} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.cardMeta}>{item.sector}, {district} · {item.sizeSqm.toLocaleString()} m²</Text>
                </View>
                <Text style={styles.cardPrice}>{formatPrice(item.price)}</Text>
              </View>

              {/* Tags */}
              <View style={styles.cardTags}>
                <View style={styles.typeChip}>
                  <Text style={styles.typeChipLabel}>{typeMeta.label}</Text>
                </View>
                <View style={styles.typeChip}>
                  <Text style={styles.typeChipLabel}>{PROVINCE_LABEL(item.province)}</Text>
                </View>
                {isFeatured && (
                  <View style={[styles.typeChip, styles.featuredChip]}>
                    <MaterialCommunityIcons name="star" size={10} color="#f4c542" />
                    <Text style={[styles.typeChipLabel, { color: '#f4c542', marginLeft: 3 }]}>Pinned</Text>
                  </View>
                )}
                {isSold && (
                  <View style={[styles.typeChip, styles.soldChip]}>
                    <Text style={[styles.typeChipLabel, { color: '#BA7517' }]}>Sold</Text>
                  </View>
                )}
                {item.titled && (
                  <View style={[styles.typeChip, styles.titledChip]}>
                    <Text style={[styles.typeChipLabel, { color: colors.success }]}>Titled</Text>
                  </View>
                )}
              </View>

              {/* Actions */}
              <View style={styles.cardActions}>
                <ActionBtn
                  icon={isFeatured ? 'star' : 'star-outline'}
                  label={isFeatured ? 'Unpin' : 'Pin to top'}
                  color={isFeatured ? '#f4c542' : colors.blue300}
                  onPress={() => toggleFeatured(item.id)}
                />
                <ActionBtn
                  icon={isSold ? 'tag-off-outline' : 'tag-check-outline'}
                  label={isSold ? 'Mark active' : 'Mark sold'}
                  color={isSold ? colors.textOnNavyFaint : '#BA7517'}
                  onPress={() => toggleSold(item.id)}
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
                  {/* Existing photos */}
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

                  {/* Add new photo */}
                  <View style={styles.photoAddRow}>
                    <TextInput
                      value={newPhotoLabel}
                      onChangeText={setNewPhotoLabel}
                      placeholder="Label (e.g. Plot view)"
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
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
    >
      <MaterialCommunityIcons name={icon} size={14} color={color} />
      <Text style={[styles.actionLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: gutter,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(133,183,235,0.2)',
  },
  headerBack: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1, marginLeft: spacing.md },
  headerTitle: { ...typography.bodyStrong, fontSize: 16, color: colors.white },
  headerSub: { fontSize: 11, color: colors.textOnNavyFaint, marginTop: 1 },
  headerAction: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.blue500,
    alignItems: 'center', justifyContent: 'center',
  },

  content: { paddingHorizontal: gutter, paddingTop: spacing.lg },

  statsRow: { flexDirection: 'row', marginBottom: spacing.lg },
  statCard: {
    flex: 1, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(133,183,235,0.2)',
    borderRadius: radius.md, paddingVertical: spacing.md,
    marginRight: spacing.xs,
  },
  statValue: { fontSize: 20, fontWeight: '800', color: colors.white, marginTop: 3 },
  statLabel: { fontSize: 9.5, color: colors.textOnNavyFaint, marginTop: 1 },

  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(133,183,235,0.2)',
    borderRadius: radius.md, paddingHorizontal: spacing.md,
    marginBottom: spacing.md, height: 40,
  },
  searchIcon: { marginRight: spacing.sm },
  searchInput: { flex: 1, color: colors.white, fontSize: 13 },

  filterRow: { flexDirection: 'row', marginBottom: spacing.sm },
  filterChip: {
    borderRadius: radius.pill, paddingHorizontal: spacing.md, height: 30,
    justifyContent: 'center', marginRight: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(133,183,235,0.25)',
  },
  filterChipActive: { backgroundColor: colors.blue500, borderColor: colors.blue500 },
  filterLabel: { fontSize: 12, color: colors.textOnNavy },
  filterLabelActive: { color: colors.white, fontWeight: '600' },

  countLabel: { ...typography.caption, color: colors.textOnNavyFaint, marginBottom: spacing.sm },

  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(133,183,235,0.22)',
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  cardSold: { opacity: 0.65 },

  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  cardIconWell: {
    width: 34, height: 34, borderRadius: radius.sm,
    backgroundColor: 'rgba(55,138,221,0.18)',
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm,
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 13, fontWeight: '600', color: colors.white },
  cardMeta: { fontSize: 11, color: colors.textOnNavyFaint, marginTop: 1 },
  cardPrice: { fontSize: 13, fontWeight: '700', color: colors.blue300 },

  cardTags: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm },
  typeChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(133,183,235,0.12)',
    borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 3,
    marginRight: 5, marginBottom: 4,
  },
  typeChipLabel: { fontSize: 10, color: colors.blue300 },
  featuredChip: { backgroundColor: 'rgba(244,197,66,0.12)' },
  soldChip: { backgroundColor: 'rgba(186,117,23,0.15)' },
  titledChip: { backgroundColor: 'rgba(46,158,91,0.15)' },

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
