/**
 * WeddingMarketScreen.js — Browse wedding venues with sidebar filters.
 */
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, TextInput,
  Modal, Image, ActivityIndicator, Platform,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../../components/common/GradientBackground';
import PlacesMapView from '../../components/map/PlacesMapView';
import {
  WEDDING_VENUES, FACILITY_LABELS, VIEW_LABELS, PRIVACY_LABELS, PHOTO_LABELS,
} from '../../data/weddingVenueData';
import { apiFetch } from '../../services/apiClient';
import { colors, typography, spacing, radius, gutter } from '../../theme';
import { weddingColors as wc } from '../../theme/colors';

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDist(km) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

function FilterSection({ title, options, labelMap, active, onToggle }) {
  return (
    <View style={styles.filterGroup}>
      <Text style={styles.filterGroupTitle}>{title}</Text>
      {options.map(opt => {
        const on = active.includes(opt);
        return (
          <Pressable key={opt} style={styles.filterRow} onPress={() => onToggle(opt)}>
            <View style={[styles.checkbox, on && styles.checkboxOn]}>
              {on && <MaterialCommunityIcons name="check" size={12} color={colors.white} />}
            </View>
            <Text style={styles.filterLabel}>{labelMap[opt] || opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function WeddingMarketScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [committedSearch, setCommittedSearch] = useState('');
  const submitSearch = () => setCommittedSearch(search.trim());
  const [liveVenues, setLiveVenues] = useState(WEDDING_VENUES);
  const [viewMode, setViewMode] = useState('list');
  const [userLocation, setUserLocation] = useState(null);
  const [nearMeLoading, setNearMeLoading] = useState(false);

  useEffect(() => {
    apiFetch('/wedding-venues')
      .then(data => { if (Array.isArray(data) && data.length) setLiveVenues(data); })
      .catch(() => {});
  }, []);

  const toggleNearMe = useCallback(() => {
    if (userLocation) { setUserLocation(null); return; }
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
      setNearMeLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => { setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setNearMeLoading(false); },
        () => { setNearMeLoading(false); alert('Could not get your location. Please allow location access.'); },
        { timeout: 8000 }
      );
    }
  }, [userLocation]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [facilities, setFacilities] = useState([]);
  const [views, setViews] = useState([]);
  const [privacy, setPrivacy] = useState([]);
  const [photography, setPhotography] = useState([]);

  const toggle = (setter) => (val) => setter(prev =>
    prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
  );

  const clearAll = () => {
    setFacilities([]); setViews([]); setPrivacy([]); setPhotography([]);
  };
  const activeCount = facilities.length + views.length + privacy.length + photography.length;

  const results = useMemo(() => {
    let list = liveVenues;
    if (committedSearch) {
      const q = committedSearch.toLowerCase();
      list = list.filter(v =>
        v.name.toLowerCase().includes(q) ||
        v.location.toLowerCase().includes(q) ||
        (v.district || '').toLowerCase().includes(q) ||
        (v.description || '').toLowerCase().includes(q) ||
        (v.facilities || []).some(f => (FACILITY_LABELS[f] || f).toLowerCase().includes(q)) ||
        (v.views || []).some(f => (VIEW_LABELS[f] || f).toLowerCase().includes(q))
      );
    }
    if (facilities.length) list = list.filter(v => facilities.every(f => (v.facilities || []).includes(f)));
    if (views.length)      list = list.filter(v => views.every(f => (v.views || []).includes(f)));
    if (privacy.length)    list = list.filter(v => privacy.every(f => (v.privacy || []).includes(f)));
    if (photography.length) list = list.filter(v => photography.every(f => (v.photography || []).includes(f)));
    if (userLocation) {
      list = list.map(v => ({
        ...v,
        _dist: v.lat && v.lng ? haversineKm(userLocation.lat, userLocation.lng, parseFloat(v.lat), parseFloat(v.lng)) : 9999,
      })).sort((a, b) => a._dist - b._dist);
    }
    return list;
  }, [committedSearch, facilities, views, privacy, photography, userLocation]);

  return (
    <GradientBackground colorsOverride={wc.gradient}>
      <View style={{ flex: 1, paddingTop: insets.top }}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.back} hitSlop={8}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.white} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Wedding Venues</Text>
            <Text style={styles.headerSub}>{results.length} venue{results.length !== 1 ? 's' : ''} in Kigali</Text>
          </View>
        </View>

        {/* Action chips */}
        <View style={styles.chipRow}>
          <Pressable onPress={toggleNearMe} style={[styles.actionChip, userLocation && styles.actionChipActive]}>
            {nearMeLoading
              ? <ActivityIndicator size="small" color={colors.white} />
              : <MaterialCommunityIcons name="crosshairs-gps" size={14} color={userLocation ? '#FFFFFF' : '#8E8E93'} />}
            <Text style={[styles.actionChipLabel, userLocation && styles.actionChipLabelActive]}>{userLocation ? 'Near Me ✓' : 'Near Me'}</Text>
          </Pressable>
          <Pressable onPress={() => setViewMode(viewMode === 'list' ? 'map' : 'list')} style={[styles.actionChip, viewMode === 'map' && styles.actionChipActive]}>
            <MaterialCommunityIcons name={viewMode === 'map' ? 'format-list-bulleted' : 'map-outline'} size={14} color={viewMode === 'map' ? '#FFFFFF' : '#8E8E93'} />
            <Text style={[styles.actionChipLabel, viewMode === 'map' && styles.actionChipLabelActive]}>{viewMode === 'map' ? 'List' : 'Map'}</Text>
          </Pressable>
          <Pressable onPress={() => setSidebarOpen(true)} style={[styles.actionChip, activeCount > 0 && styles.actionChipActive]}>
            <MaterialCommunityIcons name="tune" size={14} color={activeCount > 0 ? '#FFFFFF' : '#8E8E93'} />
            <Text style={[styles.actionChipLabel, activeCount > 0 && styles.actionChipLabelActive]}>Filter{activeCount > 0 ? ` (${activeCount})` : ''}</Text>
          </Pressable>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Pressable onPress={submitSearch} hitSlop={8}>
            <MaterialCommunityIcons name="magnify" size={18} color={colors.textOnNavyFaint} style={{ marginRight: spacing.xs }} />
          </Pressable>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={submitSearch}
            returnKeyType="search"
            placeholder="Search venues..."
            placeholderTextColor={colors.textOnNavyFaint}
          />
          {search.length > 0 && (
            <Pressable onPress={() => { setSearch(''); setCommittedSearch(''); }} hitSlop={8}>
              <MaterialCommunityIcons name="close-circle" size={18} color={colors.textOnNavyFaint} />
            </Pressable>
          )}
        </View>

        {/* Results */}
        {viewMode === 'map' ? (
          <View style={{ flex: 1 }}>
            <PlacesMapView
              places={results.map(v => ({ ...v, lat: parseFloat(v.lat), lng: parseFloat(v.lng) }))}
              userLocation={userLocation}
              onPress={(v) => navigation.navigate('WeddingDetail', { id: v.id })}
            />
          </View>
        ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: insets.bottom + spacing.xl }}
          showsVerticalScrollIndicator={false}
        >
          {results.length === 0 ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons name="flower-outline" size={56} color={colors.textOnNavyFaint} />
              <Text style={styles.emptyText}>No venues match your filters.</Text>
            </View>
          ) : results.map(venue => (
            <Pressable
              key={venue.id}
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.88 }]}
              onPress={() => navigation.navigate('WeddingDetail', { id: venue.id })}
            >
              <View style={styles.cardPhoto}>
                {venue.photos?.[0]?.url ? (
                  <Image source={{ uri: venue.photos[0].url }} style={styles.cardImage} resizeMode="cover" />
                ) : (
                  <MaterialCommunityIcons name="flower" size={40} color={colors.blue300} />
                )}
                <View style={styles.capacityBadge}>
                  <MaterialCommunityIcons name="account-group-outline" size={11} color={colors.white} />
                  <Text style={styles.capacityText}>up to {venue.capacity}</Text>
                </View>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardName} numberOfLines={1}>{venue.name}</Text>
                  <View style={styles.ratingPill}>
                    <MaterialCommunityIcons name="star" size={11} color="#F5C518" />
                    <Text style={styles.ratingText}>{venue.rating.toFixed(1)}</Text>
                  </View>
                </View>
                <View style={styles.locationDistRow}>
                  <Text style={styles.cardLocation} numberOfLines={1}>
                    <MaterialCommunityIcons name="map-marker-outline" size={12} color={colors.blue300} />
                    {' '}{venue.location}
                  </Text>
                  {venue._dist != null && venue._dist < 9999 && (
                    <View style={styles.distBadge}>
                      <MaterialCommunityIcons name="navigation" size={10} color="#1A7A4A" />
                      <Text style={styles.distLabel}>{formatDist(venue._dist)}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardDesc} numberOfLines={2}>{venue.description}</Text>
                <View style={styles.facilityRow}>
                  {(venue.facilities || []).slice(0, 4).map(f => (
                    <View key={f} style={styles.facTag}>
                      <Text style={styles.facTagText}>{FACILITY_LABELS[f]}</Text>
                    </View>
                  ))}
                  {(venue.facilities || []).length > 4 && (
                    <Text style={styles.facMore}>+{venue.facilities.length - 4} more</Text>
                  )}
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>
        )}
      </View>

      {/* Filter sidebar */}
      <Modal visible={sidebarOpen} animationType="slide" transparent onRequestClose={() => setSidebarOpen(false)}>
        <Pressable style={styles.sidebarBackdrop} onPress={() => setSidebarOpen(false)} />
        <View style={[styles.sidebar, { paddingTop: insets.top, paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.sidebarHeader}>
            <Text style={styles.sidebarTitle}>Filters</Text>
            {activeCount > 0 && (
              <Pressable onPress={clearAll} hitSlop={8}>
                <Text style={styles.clearBtn}>Clear all</Text>
              </Pressable>
            )}
            <Pressable onPress={() => setSidebarOpen(false)} hitSlop={8} style={styles.sidebarClose}>
              <MaterialCommunityIcons name="close" size={22} color={colors.white} />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <FilterSection
              title="Venue Facilities"
              options={Object.keys(FACILITY_LABELS)}
              labelMap={FACILITY_LABELS}
              active={facilities}
              onToggle={toggle(setFacilities)}
            />
            <FilterSection
              title="Views & Atmosphere"
              options={Object.keys(VIEW_LABELS)}
              labelMap={VIEW_LABELS}
              active={views}
              onToggle={toggle(setViews)}
            />
            <FilterSection
              title="Privacy & Exclusivity"
              options={Object.keys(PRIVACY_LABELS)}
              labelMap={PRIVACY_LABELS}
              active={privacy}
              onToggle={toggle(setPrivacy)}
            />
            <FilterSection
              title="Photography"
              options={Object.keys(PHOTO_LABELS)}
              labelMap={PHOTO_LABELS}
              active={photography}
              onToggle={toggle(setPhotography)}
            />
          </ScrollView>
          <Pressable style={styles.applyBtn} onPress={() => setSidebarOpen(false)}>
            <Text style={styles.applyBtnText}>Show {results.length} result{results.length !== 1 ? 's' : ''}</Text>
          </Pressable>
        </View>
      </Modal>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: gutter, paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(133,183,235,0.22)' },
  back: { padding: 4, marginRight: spacing.sm },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.white },
  headerSub: { fontSize: 12, color: colors.textOnNavyFaint },
  chipRow: { flexDirection: 'row', paddingHorizontal: gutter, marginBottom: spacing.sm, gap: spacing.xs },
  actionChip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 4, paddingHorizontal: spacing.sm + 2, paddingVertical: 6 },
  actionChipActive: { backgroundColor: wc.accent, borderColor: wc.accent },
  actionChipLabel: { fontSize: 12, color: '#8E8E93', fontWeight: '600' },
  actionChipLabelActive: { color: '#FFFFFF' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', marginHorizontal: gutter, marginTop: spacing.sm, marginBottom: spacing.xs, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(133,183,235,0.22)', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  searchInput: { flex: 1, fontSize: 14, color: colors.white },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: spacing.md },
  emptyText: { fontSize: 14, color: colors.textOnNavyFaint },
  card: { backgroundColor: wc.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(11,45,66,0.12)', borderRadius: radius.lg, marginBottom: spacing.md, overflow: 'hidden' },
  cardPhoto: { width: '100%', aspectRatio: 16 / 9, backgroundColor: wc.accentSoft, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  cardImage: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  capacityBadge: { position: 'absolute', bottom: spacing.sm, right: gutter, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: wc.highlight, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  capacityText: { fontSize: 11, color: colors.white, fontWeight: '600' },
  cardBody: { padding: spacing.md },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  cardName: { flex: 1, fontSize: 15, fontWeight: '700', color: wc.text },
  ratingPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(244,176,0,0.15)', borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3, gap: 3, marginLeft: spacing.xs },
  ratingText: { fontSize: 12, fontWeight: '700', color: wc.gold },
  locationDistRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  cardLocation: { fontSize: 12, color: wc.textMuted, flex: 1 },
  distBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(26,122,74,0.12)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginLeft: spacing.xs },
  distLabel: { fontSize: 11, fontWeight: '600', color: '#1A7A4A' },
  cardDesc: { fontSize: 13, lineHeight: 19, color: wc.textMuted, marginBottom: spacing.sm },
  facilityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  facTag: { backgroundColor: wc.accentSoft, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  facTagText: { fontSize: 11, color: wc.accent, fontWeight: '600' },
  facMore: { fontSize: 11, color: wc.textMuted, alignSelf: 'center' },
  // Sidebar
  sidebarBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
  sidebar: { position: 'absolute', right: 0, top: 0, bottom: 0, width: '78%', backgroundColor: wc.primary, borderLeftWidth: 1, borderLeftColor: 'rgba(77,168,218,0.3)', paddingHorizontal: gutter },
  sidebarHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg, paddingTop: spacing.sm },
  sidebarTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: colors.white },
  clearBtn: { fontSize: 13, color: wc.skyBlue, fontWeight: '600', marginRight: spacing.md },
  sidebarClose: { padding: 4 },
  filterGroup: { marginBottom: spacing.lg },
  filterGroupTitle: { fontSize: 11, fontWeight: '700', color: 'rgba(77,168,218,0.7)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: spacing.sm },
  filterRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, gap: spacing.sm },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(77,168,218,0.4)', alignItems: 'center', justifyContent: 'center' },
  checkboxOn: { backgroundColor: wc.accent, borderColor: wc.accent },
  filterLabel: { fontSize: 13.5, color: colors.textOnNavy, flex: 1 },
  applyBtn: { backgroundColor: colors.blue500, borderRadius: radius.md, paddingVertical: spacing.md + 2, alignItems: 'center', marginTop: spacing.sm },
  applyBtnText: { fontSize: 15, fontWeight: '700', color: colors.white },
});
