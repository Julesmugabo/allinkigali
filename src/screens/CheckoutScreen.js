/**
 * CheckoutScreen.js — Kwemeza icyifuzo.
 *
 * Review the basket, say where it's going, then place the order.
 *
 * PAYMENT IS NOT BUILT YET. The button below creates the order with
 * paymentMethod: null and status "Byakiriwe", which is enough to exercise the
 * tracking flow. When you add MoMo / card, insert the payment step between
 * validation and placeOrder() — nothing else has to change.
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../components/common/GradientBackground';
import TextField from '../components/common/TextField';
import PrimaryButton from '../components/common/PrimaryButton';
import QuantityStepper from '../components/shop/QuantityStepper';
import EmptyState from '../components/common/EmptyState';

import { useCart } from '../context/CartContext';
import { useOrders } from '../context/OrdersContext';
import { useUser } from '../context/UserContext';
import { formatPrice, isValidPhone } from '../utils/format';
import { colors, typography, spacing, radius, gutter } from '../theme';

function LineItem({ item, onChangeQuantity, onRemove }) {
  return (
    <View style={styles.line}>
      <View style={styles.lineIcon}>
        <MaterialCommunityIcons name={item.icon || 'package-variant'} size={22} color={colors.blue300} />
      </View>

      <View style={styles.lineBody}>
        <Text style={styles.lineName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.linePrice}>{formatPrice(item.price)}</Text>
      </View>

      <View style={styles.lineActions}>
        <QuantityStepper
          value={item.quantity}
          onChange={(next) => (next === 0 ? onRemove(item.productId) : onChangeQuantity(item.productId, next))}
          size="sm"
        />
      </View>
    </View>
  );
}

export default function CheckoutScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { items, count, subtotal, deliveryFee, total, setQuantity, removeItem, clearCart } = useCart();
  const { placeOrder } = useOrders();
  const { user } = useUser();

  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState(user ? user.phone || '' : '');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState({});
  const [isPlacing, setIsPlacing] = useState(false);

  const validate = useCallback(() => {
    const next = {};
    if (!address.trim()) next.address = 'Andika aho ushaka ko bikugeraho.';
    if (!phone.trim()) next.phone = 'Andika nomero ya telefone.';
    else if (!isValidPhone(phone)) next.phone = 'Nomero igomba gutangira na 07.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [address, phone]);

  const handlePlaceOrder = useCallback(() => {
    if (!validate()) return;

    setIsPlacing(true);

    // >>> PAYMENT STEP GOES HERE <<<
    // e.g. const payment = await startMomoPayment({ phone, amount: total });
    // and then pass payment.reference into placeOrder below.

    setTimeout(() => {
      const order = placeOrder({
        items,
        subtotal,
        deliveryFee,
        total,
        deliveryAddress: address.trim(),
        phone: phone.trim(),
        note: note.trim(),
      });

      clearCart();
      setIsPlacing(false);

      // Jump to the tracking page inside the "Jyewe" tab.
      navigation.navigate('AccountTab', {
        screen: 'OrderDetail',
        params: { orderId: order.id, justPlaced: true },
      });
    }, 600);
  }, [validate, placeOrder, items, subtotal, deliveryFee, total, address, phone, note, clearCart, navigation]);

  if (!count) {
    return (
      <GradientBackground>
        <View style={[styles.emptyWrap, { paddingTop: insets.top + spacing.huge }]}>
          <EmptyState
            tone="dark"
            icon="basket-outline"
            title="Agatebo karimo ubusa"
            message="Shakisha 'gaz' hanyuma wongereho icyo ukeneye."
            actionLabel="Subira mu bucuruzi"
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
            <Text style={styles.title}>Kwemeza icyifuzo</Text>
          </View>

          {/* --- Basket ------------------------------------------------- */}
          <Text style={styles.sectionLabel}>Ibyo watumije</Text>
          <View style={styles.card}>
            {items.map((item, index) => (
              <View key={item.productId}>
                <LineItem
                  item={item}
                  onChangeQuantity={setQuantity}
                  onRemove={removeItem}
                />
                {index < items.length - 1 ? <View style={styles.lineDivider} /> : null}
              </View>
            ))}
          </View>

          {/* --- Delivery ------------------------------------------------ */}
          <Text style={styles.sectionLabel}>Aho bigomba kugera</Text>
          <TextField
            label="Aderesi"
            value={address}
            onChangeText={setAddress}
            placeholder="Urugero: Kimironko, KG 11 Ave, inzu ya 4"
            icon="map-marker-outline"
            error={errors.address}
          />
          <TextField
            label="Telefone"
            value={phone}
            onChangeText={setPhone}
            placeholder="0788 000 000"
            icon="phone-outline"
            keyboardType="phone-pad"
            error={errors.phone}
          />
          <TextField
            label="Andika ikindi (si ngombwa)"
            value={note}
            onChangeText={setNote}
            placeholder="Urugero: hamagara ugeze ku irembo"
            multiline
          />

          {/* --- Totals -------------------------------------------------- */}
          <Text style={styles.sectionLabel}>Igiteranyo</Text>
          <View style={styles.card}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Ibicuruzwa ({count})</Text>
              <Text style={styles.totalValue}>{formatPrice(subtotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Kubigeza aho uri</Text>
              <Text style={styles.totalValue}>
                {deliveryFee === 0 ? 'Ubuntu' : formatPrice(deliveryFee)}
              </Text>
            </View>
            <View style={styles.lineDivider} />
            <View style={styles.totalRow}>
              <Text style={styles.grandLabel}>Yose hamwe</Text>
              <Text style={styles.grandValue}>{formatPrice(total)}</Text>
            </View>
          </View>

          {/* --- Payment notice ------------------------------------------ */}
          <View style={styles.notice}>
            <MaterialCommunityIcons name="information-outline" size={17} color={colors.blue300} />
            <Text style={styles.noticeText}>
              Kwishyura ukoresheje MoMo biracyategurwa. Ubu icyifuzo cyoherezwa, ukishyura
              igihe bakugeje ibicuruzwa.
            </Text>
          </View>

          <PrimaryButton
            label="Ohereza icyifuzo"
            icon="check"
            onPress={handlePlaceOrder}
            loading={isPlacing}
            style={styles.submit}
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
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: -0.3,
  },
  sectionLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.blue300,
    letterSpacing: 0.3,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(133,183,235,0.22)',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  line: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  lineIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(2,28,54,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineBody: { flex: 1, marginHorizontal: spacing.md },
  lineName: {
    ...typography.body,
    fontSize: 13.5,
    fontWeight: '500',
    color: colors.textOnNavy,
  },
  linePrice: {
    ...typography.caption,
    color: colors.blue300,
    marginTop: 2,
    fontWeight: '600',
  },
  lineActions: { alignItems: 'flex-end' },
  lineDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(133,183,235,0.2)',
    marginVertical: spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm - 2,
  },
  totalLabel: { ...typography.body, fontSize: 13.5, color: colors.textOnNavyFaint },
  totalValue: { ...typography.body, fontSize: 13.5, color: colors.textOnNavy, fontWeight: '600' },
  grandLabel: { ...typography.bodyStrong, color: colors.white },
  grandValue: { ...typography.price, fontSize: 18, color: colors.white },
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
  submit: { marginBottom: spacing.xl },
});
