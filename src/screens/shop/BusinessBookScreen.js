/**
 * BusinessBookScreen.js — Gutumiza serivisi (book a business, no payment yet).
 *
 * Pick a date, how many (people / rides / months), an optional note, then
 * confirm. PAYMENT IS NOT BUILT YET, same convention as CheckoutScreen: the
 * booking is recorded with paymentMethod: null so the flow can be exercised
 * end to end already.
 */
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Linking,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../../components/common/GradientBackground';
import TextField from '../../components/common/TextField';
import PrimaryButton from '../../components/common/PrimaryButton';
import QuantityStepper from '../../components/shop/QuantityStepper';
import EmptyState from '../../components/common/EmptyState';

import { useBusinesses } from '../../context/BusinessContext';
import { useBookings } from '../../context/BookingContext';
import { notifySeller } from '../../services/sellerNotify';
import { formatPrice } from '../../utils/format';
import { colors, typography, spacing, radius, gutter } from '../../theme';
import AppTopBar from '../../components/common/AppTopBar';

const DATE_OPTIONS = ['Uyu munsi', 'Ejo', 'Ejo bundi'];

export default function BusinessBookScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { getBusinessById } = useBusinesses();
  const { placeBooking } = useBookings();
  const business = getBusinessById(route.params?.businessId);
  const firstAvailableItem = business?.items?.find((i) => i.available) || business?.items?.[0];

  const [selectedItemId, setSelectedItemId] = useState(firstAvailableItem?.id || null);
  const [quantity, setQuantity] = useState(1);
  const [date, setDate] = useState(DATE_OPTIONS[0]);
  const [note, setNote] = useState('');
  const [isPlacing, setIsPlacing] = useState(false);
  const [placedBooking, setPlacedBooking] = useState(null);
  const [error, setError] = useState(null);

  const selectedItem = business?.items?.find((i) => i.id === selectedItemId) || null;
  const unitPrice = business?.items ? selectedItem?.price || 0 : business?.priceFrom || 0;
  const total = unitPrice * quantity;

  const handleConfirm = useCallback(async () => {
    setIsPlacing(true);
    setError(null);
    const requestDetails = {
      itemLabel: selectedItem?.label || null,
      quantity,
      date,
      note: note.trim(),
      total,
    };

    await Promise.all([
      new Promise((resolve) => setTimeout(resolve, 600)),
      notifySeller(business, requestDetails),
    ]);

    // placeBooking now writes to our own backend and resolves to null on
    // failure rather than throwing — must be awaited and checked, or a
    // failed request would silently show the success screen (this
    // screen's own version of a bug already hit and fixed in
    // SalesPartnerScreen.js: never assign a Promise into state expecting
    // the resolved value).
    const booking = await placeBooking({
      business,
      itemLabel: selectedItem?.label,
      quantity,
      date,
      note: note.trim(),
    });
    setIsPlacing(false);

    if (!booking) {
      setError('Ntibyashobotse kohereza icyifuzo. Gerageza nanone.');
      return;
    }
    setPlacedBooking(booking);
  }, [placeBooking, business, selectedItem, quantity, date, note, total]);

  const handleCall = useCallback(() => {
    if (business?.phone) Linking.openURL(`tel:${business.phone}`);
  }, [business]);

  if (!business) {
    return (
      <GradientBackground>
        <View style={styles.emptyWrap}>
          <EmptyState tone="dark" icon="alert-circle-outline" title="Iyi serivisi ntibonetse" />
        </View>
      </GradientBackground>
    );
  }

  if (placedBooking) {
    return (
      <GradientBackground>
        <View style={[styles.emptyWrap, { paddingTop: insets.top + spacing.huge }]}>
          <EmptyState
            tone="dark"
            icon="check-circle-outline"
            title="Icyifuzo cyawe cyoherejwe!"
            message={`Twamenyesheje ${business.name} icyifuzo cyawe. Bazakwakira vuba kugira ngo mwumvikane. Kwishyura biracyategurwa — muzumvikana uko mwishyurana.`}
            actionLabel="Subira ku bucuruzi"
            onActionPress={() => navigation.navigate('Shop')}
          />
          {business.phone ? (
            <Pressable onPress={handleCall} style={styles.callRow} accessibilityRole="button">
              <MaterialCommunityIcons name="phone" size={16} color={colors.blue300} />
              <Text style={styles.callText}>Cyangwa hamagara {business.name} ubu — {business.phone}</Text>
            </Pressable>
          ) : null}
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
          <AppTopBar variant="slim" style={{ paddingHorizontal: gutter, marginTop: spacing.xs }} />
          <View style={styles.topBar}>
            <Text style={styles.title}>Tumiza</Text>
          </View>

          <View style={styles.summaryCard}>
            <MaterialCommunityIcons name={business.icon || 'store-outline'} size={28} color={colors.blue300} />
            <View style={styles.summaryBody}>
              <Text style={styles.summaryName}>{business.name}</Text>
              <Text style={styles.summaryLocation}>{business.location}</Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>Ni ryari?</Text>
          <View style={styles.chips}>
            {DATE_OPTIONS.map((option) => (
              <Pressable
                key={option}
                onPress={() => setDate(option)}
                accessibilityRole="button"
                style={[styles.chip, date === option && styles.chipActive]}
              >
                <Text style={[styles.chipLabel, date === option && styles.chipLabelActive]}>
                  {option}
                </Text>
              </Pressable>
            ))}
          </View>

          {business.items?.length ? (
            <>
              <Text style={styles.sectionLabel}>Hitamo icyo ushaka</Text>
              <View style={styles.chips}>
                {business.items.map((item) => {
                  const active = selectedItemId === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => item.available && setSelectedItemId(item.id)}
                      disabled={!item.available}
                      accessibilityRole="button"
                      style={[
                        styles.itemChip,
                        active && styles.chipActive,
                        !item.available && styles.itemChipDisabled,
                      ]}
                    >
                      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                        {item.label} — {formatPrice(item.price, business.currency)}
                        {!item.available ? ' (Ntibihari)' : ''}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : null}

          <Text style={styles.sectionLabel}>Umubare</Text>
          <View style={styles.quantityRow}>
            <Text style={styles.quantityUnit}>{business.items ? selectedItem?.label : business.priceUnit}</Text>
            <QuantityStepper value={quantity} onChange={setQuantity} min={1} max={30} />
          </View>

          <TextField
            label="Andika ikindi (si ngombwa)"
            value={note}
            onChangeText={setNote}
            placeholder="Urugero: nzaza n'abana babiri"
            multiline
          />

          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Igiteranyo giteganyijwe</Text>
            <Text style={styles.totalValue}>{formatPrice(total, business.currency)}</Text>
          </View>

          <View style={styles.notice}>
            <MaterialCommunityIcons name="information-outline" size={17} color={colors.blue300} />
            <Text style={styles.noticeText}>
              Kwishyura biracyategurwa. Ubu icyifuzo cyoherezwa, ukishyura igihe serivisi itanzwe.
            </Text>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <PrimaryButton
            label="Emeza icyifuzo"
            icon="check"
            onPress={handleConfirm}
            loading={isPlacing}
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
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl },
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
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.22)',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  summaryBody: { marginLeft: spacing.md },
  summaryName: { ...typography.bodyStrong, color: colors.white },
  summaryLocation: { ...typography.caption, color: colors.textOnNavyFaint, marginTop: 2 },
  sectionLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.blue300,
    letterSpacing: 0.3,
    marginBottom: spacing.md,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.xl },
  chip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.3)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    height: 38,
    justifyContent: 'center',
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  chipActive: { backgroundColor: colors.blue500, borderColor: colors.blue500 },
  chipLabel: { fontSize: 13, color: colors.textOnNavy },
  chipLabelActive: { color: colors.white, fontWeight: '600' },
  itemChip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.3)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    height: 44,
    justifyContent: 'center',
    marginBottom: spacing.sm,
    width: '100%',
  },
  itemChipDisabled: { opacity: 0.4 },
  callRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  callText: {
    ...typography.caption,
    color: colors.blue300,
    marginLeft: spacing.xs,
    textAlign: 'center',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  quantityUnit: { ...typography.body, color: colors.textOnNavy, textTransform: 'capitalize' },
  totalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.22)',
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  totalLabel: { ...typography.bodyStrong, color: colors.white },
  totalValue: { ...typography.price, fontSize: 18, color: colors.white },
  errorText: { ...typography.caption, color: colors.breaking, marginBottom: spacing.md },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(55,138,221,0.16)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(55,138,221,0.35)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  noticeText: {
    flex: 1,
    ...typography.caption,
    fontSize: 12,
    lineHeight: 17,
    color: colors.blue300,
    marginLeft: spacing.sm,
  },
});
