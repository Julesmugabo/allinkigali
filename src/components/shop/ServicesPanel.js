/**
 * ServicesPanel.js — Igice cyo gushakisha serivisi (AI-style business search).
 *
 * Self-contained: owns its own search state and its own scroll view, so it
 * drops into ShopScreen as a sibling of the product list rather than being
 * mixed into it. The 500ms delay before showing results stands in for the
 * future backend/Gemini round trip — swap runSearch's body for a real
 * network call later and nothing else here has to change.
 */
import React, { useCallback, useRef, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Keyboard, StyleSheet } from 'react-native';

import ServiceSearchBar from './ServiceSearchBar';
import BusinessCard from './BusinessCard';
import FlierCarousel from './FlierCarousel';
import MarketplaceMenu from './MarketplaceMenu';
import EmptyState from '../common/EmptyState';

import { useBusinesses } from '../../context/BusinessContext';
import { useFliers } from '../../context/FliersContext';
import { searchBusinesses } from '../../services/businessSearch';
import { colors, typography, spacing } from '../../theme';

const SEARCH_DELAY_MS = 500;

// ~2cm, converted at the standard 96dp/inch (CSS-px) convention — React
// Native has no direct access to physical screen density, so this is a
// reasonable approximation of the gap the user asked for, not a measured one.
const GAP_2CM = 76;

export default function ServicesPanel({ navigation, topPadding }) {
  const searchRef = useRef(null);
  const { businesses, incrementBusinessView } = useBusinesses();
  const { fliers } = useFliers();

  const [query, setQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState([]);

  const runSearch = useCallback(
    (raw) => {
      const trimmed = (raw || '').trim();
      if (!trimmed) return;

      Keyboard.dismiss();
      setHasSearched(true);
      setIsSearching(true);

      setTimeout(() => {
        const { results: matches } = searchBusinesses(businesses, trimmed);
        setResults(matches);
        setIsSearching(false);
      }, SEARCH_DELAY_MS);
    },
    [businesses]
  );

  const handleViewDetails = useCallback(
    (business) => {
      // This is the single real customer entry point into a listing's detail
      // screen (card tap or "Reba byinshi"), so it's where a genuine profile
      // view is counted — not inside BusinessDetailScreen itself, which is
      // also reached by a seller previewing their own listing or an admin
      // browsing it, neither of which should inflate this number.
      incrementBusinessView(business.id);
      navigation.navigate('BusinessDetail', { businessId: business.id });
    },
    [navigation, incrementBusinessView]
  );

  const handleBook = useCallback(
    (business) => navigation.navigate('BusinessBook', { businessId: business.id }),
    [navigation]
  );

  const handlePressFlier = useCallback(
    (flier) => {
      const business = businesses.find((b) => b.id === flier.businessId);
      if (business) handleViewDetails(business);
    },
    [businesses, handleViewDetails]
  );

  const header = (
    <View>
      <Text style={styles.title}>Shakisha serivisi</Text>
      <Text style={styles.subtitle}>Andika icyo ukeneye, urugero: "gym hafi yanjye".</Text>

      <ServiceSearchBar
        ref={searchRef}
        value={query}
        onChangeText={setQuery}
        onSubmit={() => runSearch(query)}
      />

      <MarketplaceMenu navigation={navigation} />

      <FlierCarousel
        fliers={fliers}
        businesses={businesses}
        onPressFlier={handlePressFlier}
        style={styles.flierCarousel}
      />

      {hasSearched ? (
        <Text style={styles.resultsLabel}>
          {isSearching ? 'Turimo gushakisha...' : `Ibyabonetse (${results.length})`}
        </Text>
      ) : null}
    </View>
  );

  return (
    <FlatList
      data={hasSearched && !isSearching ? results : []}
      keyExtractor={(item) => item.id}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      renderItem={({ item }) => (
        <BusinessCard business={item} onViewDetails={handleViewDetails} onBook={handleBook} />
      )}
      ListHeaderComponent={header}
      ListEmptyComponent={
        isSearching ? (
          <ActivityIndicator color={colors.blue300} style={styles.spinner} />
        ) : hasSearched ? (
          <EmptyState
            tone="dark"
            icon="magnify-close"
            title="Nta serivisi yabonetse"
            message="Gerageza wandike ukundi, urugero 'gym' cyangwa 'moto'."
          />
        ) : null
      }
      contentContainerStyle={[styles.content, { paddingTop: topPadding }]}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16 },
  title: {
    ...typography.screenTitle,
    fontSize: 20,
    color: colors.white,
  },
  subtitle: {
    ...typography.body,
    color: colors.textOnNavyFaint,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  flierCarousel: { marginTop: GAP_2CM, marginBottom: GAP_2CM },
  resultsLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.blue300,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    letterSpacing: 0.3,
  },
  spinner: { marginTop: spacing.xxl },
});
