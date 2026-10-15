/**
 * ServicesPanel.js — Igice cyo gushakisha serivisi (AI-style business search).
 *
 * Self-contained: owns its own search state and its own scroll view, so it
 * drops into ShopScreen as a sibling of the product list rather than being
 * mixed into it. The 500ms delay before showing results stands in for the
 * future backend/Gemini round trip — swap runSearch's body for a real
 * network call later and nothing else here has to change.
 */
import React, { useCallback } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

import BusinessCard from './BusinessCard';
import FlierCarousel from './FlierCarousel';
import MarketplaceMenu from './MarketplaceMenu';

import { useBusinesses } from '../../context/BusinessContext';
import { useFliers } from '../../context/FliersContext';
import { colors, typography, spacing } from '../../theme';

const GAP_2CM = 76;

export default function ServicesPanel({ navigation, topPadding }) {
  const { businesses, incrementBusinessView } = useBusinesses();
  const { fliers } = useFliers();

  const handleViewDetails = useCallback(
    (business) => {
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
      <Text style={styles.title}>Restaurants & Cafés</Text>
      <MarketplaceMenu navigation={navigation} />
      <FlierCarousel
        fliers={fliers}
        businesses={businesses}
        onPressFlier={handlePressFlier}
        style={styles.flierCarousel}
      />
      {businesses.length > 0 && (
        <Text style={styles.sectionLabel}>All businesses</Text>
      )}
    </View>
  );

  return (
    <FlatList
      data={businesses}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <BusinessCard business={item} onViewDetails={handleViewDetails} onBook={handleBook} />
      )}
      ListHeaderComponent={header}
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
    marginBottom: spacing.md,
  },
  flierCarousel: { marginTop: GAP_2CM, marginBottom: GAP_2CM },
  sectionLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.blue300,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    letterSpacing: 0.3,
  },
});
