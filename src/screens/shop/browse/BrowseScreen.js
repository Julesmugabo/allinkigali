/**
 * BrowseScreen.js — the wide-web list page behind each Resto/Coffee card
 * (restaurants, coffee shops, wedding venues). Search (dishes included),
 * two chip rows, an open filter column, a card grid, sorting and an
 * optional map. Every choice lives in the web address so a filtered list
 * can be shared. Phones keep the original market screens.
 */
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import GradientBackground from '../../../components/common/GradientBackground';
import WebContainer from '../../../web/layout/WebContainer';
import PlacesMapView from '../../../components/map/PlacesMapView';
import BrowseCard from '../../../components/shop/browse/BrowseCard';
import ChipRow from '../../../components/shop/browse/ChipRow';
import FilterSidebar from '../../../components/shop/browse/FilterSidebar';
import SortMenu from '../../../components/shop/browse/SortMenu';
import EmptyResults from '../../../components/shop/browse/EmptyResults';
import useSavedPlaces from '../../../hooks/useSavedPlaces';
import { EMPTY_LOCATION } from '../../../utils/placeLocation';
import { colors, radius, spacing } from '../../../theme';
import usePlaces from './usePlaces';
import { SORTS, stateFromParams, paramsFromState, applyBrowse, buildIndex, describeChoices } from './browseLogic';

const EMPTY = { q: '', picks: [], groups: {}, loc: EMPTY_LOCATION, sort: 'recommended' };
const toggleIn = (arr = [], v) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

export default function BrowseScreen({ kind, navigation, route }) {
  const { places, loading } = usePlaces(kind);
  const { isSaved, toggle: toggleSaved } = useSavedPlaces();
  const groups = useMemo(() => kind.filterGroups(places), [kind, places]);
  const primary = useMemo(() => kind.primaryChips(places), [kind, places]);
  const chips = useMemo(() => [...primary, ...kind.momentChips], [primary, kind]);
  const index = useMemo(() => buildIndex(places, kind), [places, kind]);

  const [state, setState] = useState(() => stateFromParams(route.params, kind.filterGroups(kind.fallback)));
  const [history, setHistory] = useState([]); // order of choices, for "Remove last choice"
  const [showMap, setShowMap] = useState(false);
  const [here, setHere] = useState(null);

  // Keep the web address in step with the choices (debounced for typing).
  useEffect(() => {
    const t = setTimeout(() => navigation.setParams(paramsFromState(state, groups)), 250);
    return () => clearTimeout(t);
  }, [state, groups, navigation]);

  const results = useMemo(
    () => applyBrowse({ places, index, state, chips, groups, here }),
    [places, index, state, chips, groups, here],
  );

  const togglePick = useCallback((key) => {
    setState((s) => ({ ...s, picks: toggleIn(s.picks, key) }));
    setHistory((h) => [...h, { type: 'pick', key }]);
  }, []);
  const toggleGroup = useCallback((group, value) => {
    setState((s) => ({ ...s, groups: { ...s.groups, [group]: toggleIn(s.groups[group], value) } }));
    setHistory((h) => [...h, { type: 'group', group, value }]);
  }, []);
  const setLocation = useCallback((loc) => {
    setState((s) => ({ ...s, loc }));
    setHistory((h) => [...h, { type: 'loc' }]);
  }, []);
  const clearAll = useCallback(() => { setState((s) => ({ ...EMPTY, sort: s.sort })); setHistory([]); }, []);
  const undoLast = useCallback(() => {
    const last = history[history.length - 1];
    if (!last) return;
    setHistory((h) => h.slice(0, -1));
    if (last.type === 'loc') setState((s) => ({ ...s, loc: EMPTY_LOCATION }));
    else if (last.type === 'pick') setState((s) => ({ ...s, picks: s.picks.filter((k) => k !== last.key) }));
    else setState((s) => ({ ...s, groups: { ...s.groups, [last.group]: (s.groups[last.group] || []).filter((v) => v !== last.value) } }));
  }, [history]);

  const setSort = useCallback((sort) => {
    setState((s) => ({ ...s, sort }));
    if (sort === 'near' && !here && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setHere({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setState((s) => ({ ...s, sort: 'recommended' })),
        { timeout: 8000 },
      );
    }
  }, [here]);

  const hasChoices = !!state.q || !!state.loc.province || state.picks.length > 0 || Object.values(state.groups).some((v) => v.length);
  const open = (id) => navigation.navigate(kind.detailRoute, { id });
  const columns = showMap ? 2 : 3;
  const noun = kind.noun[results.length === 1 ? 0 : 1];

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.scroll}>
        <WebContainer>
          <Pressable onPress={() => navigation.navigate('Shop')} style={styles.back}>
            <MaterialCommunityIcons name="arrow-left" size={18} color={colors.blue300} />
            <Text style={styles.backLabel}>Resto/Coffee</Text>
          </Pressable>
          <Text style={styles.heading}>{kind.heading}</Text>

          <View style={styles.searchRow}>
            <View style={styles.search}>
              <MaterialCommunityIcons name="magnify" size={20} color={colors.textOnNavyFaint} />
              <TextInput value={state.q} onChangeText={(q) => setState((s) => ({ ...s, q }))} placeholder={kind.searchHint}
                placeholderTextColor={colors.textOnNavyFaint} style={styles.input} />
              {state.q ? <Pressable onPress={() => setState((s) => ({ ...s, q: '' }))}><MaterialCommunityIcons name="close-circle" size={18} color={colors.textOnNavyFaint} /></Pressable> : null}
            </View>
            <Pressable onPress={() => setShowMap((m) => !m)} style={[styles.mapBtn, showMap && styles.mapBtnOn]}>
              <MaterialCommunityIcons name={showMap ? 'view-grid-outline' : 'map-outline'} size={18} color={colors.white} />
              <Text style={styles.mapLabel}>{showMap ? 'Hide map' : 'Show map'}</Text>
            </Pressable>
          </View>

          <ChipRow chips={primary} active={state.picks} onToggle={togglePick} />
          <ChipRow chips={kind.momentChips} active={state.picks} onToggle={togglePick} />

          <View style={styles.body}>
            <FilterSidebar groups={groups} state={state} onToggle={toggleGroup} onLocation={setLocation} onClear={clearAll} hasChoices={hasChoices} />

            <View style={styles.results}>
              <View style={styles.resultsHead}>
                <Text style={styles.count}>{loading ? 'Loading…' : `${results.length} ${noun}`}</Text>
                <SortMenu sorts={SORTS} value={state.sort} onChange={setSort} />
              </View>
              {loading && !results.length ? <ActivityIndicator color={colors.blue300} style={{ marginTop: spacing.huge }} /> : null}
              {!loading && !results.length ? (
                <EmptyResults icon={kind.icon} noun={kind.noun[1]} summary={describeChoices(state, chips, groups)}
                  onUndo={history.length ? undoLast : null} onClear={clearAll} />
              ) : (
                <View style={styles.grid}>
                  {results.map((p) => (
                    <View key={p.id} style={{ width: `${100 / columns}%`, padding: 8 }}>
                      <BrowseCard place={p} kind={kind} saved={isSaved(kind.key, p.id)}
                        onToggleSave={() => toggleSaved(kind.key, p.id)} onPress={() => open(p.id)} />
                    </View>
                  ))}
                </View>
              )}
            </View>

            {showMap && (
              <View style={styles.map}>
                <PlacesMapView places={results} accentColor="#378ADD" onPlacePress={open} style={{ flex: 1 }} />
              </View>
            )}
          </View>
        </WebContainer>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingTop: spacing.xl, paddingBottom: spacing.huge * 2 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  backLabel: { color: colors.blue300, fontSize: 14, fontWeight: '600' },
  heading: { color: colors.white, fontSize: 30, fontWeight: '800', marginTop: spacing.sm, marginBottom: spacing.lg },
  searchRow: { flexDirection: 'row', gap: 12, marginBottom: spacing.md },
  search: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, height: 50, borderRadius: 26, paddingHorizontal: 18, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(133,183,235,0.25)' },
  input: { flex: 1, color: colors.white, fontSize: 15.5, outlineStyle: 'none' },
  mapBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, borderRadius: 26, borderWidth: 1, borderColor: 'rgba(133,183,235,0.35)' },
  mapBtnOn: { backgroundColor: colors.blue500, borderColor: colors.blue500 },
  mapLabel: { color: colors.white, fontWeight: '700', fontSize: 14 },
  body: { flexDirection: 'row', gap: spacing.xxl, marginTop: spacing.xl, alignItems: 'flex-start' },
  results: { flex: 1, minWidth: 0 },
  resultsHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 8, zIndex: 20 },
  count: { color: colors.white, fontSize: 15, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  map: { width: 420, height: 640, borderRadius: radius.lg, overflow: 'hidden', position: 'sticky', top: 16, borderWidth: 1, borderColor: 'rgba(133,183,235,0.2)' },
});
