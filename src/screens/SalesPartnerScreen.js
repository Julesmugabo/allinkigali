/**
 * SalesPartnerScreen.js — Kwiyandikisha nk'umufatanyabikorwa (Me tab).
 *
 * Two modes in one screen, same as AccountScreen's pattern:
 *   no businessId param -> register a new business (adds to BusinessContext,
 *     owned by the signed-in user)
 *   businessId param     -> edit that business (used by the seller dashboard's
 *     "Hindura ubucuruzi" action)
 * Submitting adds/updates the business straight in BusinessContext, so it
 * shows up in Shop's service search immediately.
 */
import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../components/common/GradientBackground';
import SalesPartnerForm from '../components/account/SalesPartnerForm';
import EmptyState from '../components/common/EmptyState';

import { useBusinesses } from '../context/BusinessContext';
import { useUser } from '../context/UserContext';
import { colors, typography, spacing, radius, gutter } from '../theme';

export default function SalesPartnerScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const { addBusiness, updateBusiness, getBusinessById } = useBusinesses();
  const editingId = route?.params?.businessId || null;
  const existingBusiness = useMemo(
    () => (editingId ? getBusinessById(editingId) : null),
    [editingId, getBusinessById]
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = useCallback(
    (values) => {
      setIsSubmitting(true);
      setTimeout(() => {
        if (editingId) {
          updateBusiness(editingId, values);
          setResult({ name: values.name, edited: true });
        } else {
          const business = addBusiness({ ...values, ownerId: user?.id || null });
          setResult({ ...business, edited: false });
        }
        setIsSubmitting(false);
      }, 600);
    },
    [editingId, updateBusiness, addBusiness, user]
  );

  if (result) {
    return (
      <GradientBackground>
        <View style={[styles.emptyWrap, { paddingTop: insets.top + spacing.huge }]}>
          <EmptyState
            tone="dark"
            icon="check-circle-outline"
            title={result.edited ? 'Impinduka zabitswe!' : 'Wiyandikishije neza!'}
            message={
              result.edited
                ? `Ibiro bya ${result.name} byavuguruwe.`
                : `${result.name} ubu ushobora kuboneka mu bashakisha serivisi ku Bucuruzi.`
            }
            actionLabel={result.edited ? 'Subira kuri Dashboard' : 'Subira ku Jyewe'}
            // goBack() rather than a hardcoded route name — this screen is
            // opened both from the seller's own AccountStack and from the
            // Sales Partners admin dashboard's own stack, and each needs to
            // return to wherever it actually came from.
            onActionPress={() => navigation.goBack()}
          />
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.huge },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBar}>
            <Pressable
              onPress={() => navigation.goBack()}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Subira inyuma"
              style={styles.backButton}
            >
              <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textOnNavy} />
            </Pressable>
            <Text style={styles.title}>{editingId ? 'Hindura ubucuruzi' : 'Ba umufatanyabikorwa'}</Text>
          </View>

          <Text style={styles.subtitle}>
            {editingId
              ? 'Vugurura amakuru y\'ubucuruzi bwawe — ibi bihita bigaragara mu bashakisha.'
              : "Andikisha ubucuruzi bwawe kugira ngo bugaragare ku bantu bashakisha serivisi nk'iyo utanga."}
          </Text>

          <SalesPartnerForm
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            initialValues={existingBusiness}
            submitLabel={editingId ? 'Bika impinduka' : 'Ohereza kwiyandikisha'}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: gutter },
  emptyWrap: { flex: 1, justifyContent: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  title: { fontSize: 20, fontWeight: '700', color: colors.white, letterSpacing: -0.3 },
  subtitle: {
    ...typography.body,
    color: colors.textOnNavyFaint,
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
});
