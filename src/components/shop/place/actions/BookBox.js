/**
 * BookBox.js — book a table / reserve a seat / request a venue visit,
 * right on the page. Anyone can fill it; pressing the button asks a guest
 * to log in first and keeps what they chose. The place confirms or declines
 * from its dashboard, as before. Dishes picked from the menu with + show
 * here as "Dishes for your table" and go with the booking.
 */
import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { apiFetch } from '../../../../services/apiClient';
import { rwf } from '../../../../utils/money';
import { withPreorder } from '../../../../utils/preorder';
import { radius } from '../../../../theme';
import { makeBoxStyles } from './boxStyles';
import { useShopTheme, useShopStyles } from '../../../../theme/shopThemes';

const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function nextDays(n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(); d.setDate(d.getDate() + i);
    out.push({ value: iso(d), label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : `${DAY[d.getDay()]} ${d.getDate()}` });
  }
  return out;
}

export default function BookBox({ kind, place, user, closedNow, onLogin, dishes = [], onDishQty, onBooked }) {
  const c = useShopTheme(); // eslint-disable-line no-unused-vars
  const styles = useShopStyles(makeStyles);
  const box = useShopStyles(makeBoxStyles);
  const cfg = kind.booking;
  const days = useMemo(() => nextDays(14), []);
  const [date, setDate] = useState(closedNow ? days[1].value : days[0].value);
  const [time, setTime] = useState(cfg.times[Math.floor(cfg.times.length / 2)]);
  const [guests, setGuests] = useState(kind.key === 'wedding' ? 200 : 2);
  const [name, setName] = useState(null); // null = use the account's details
  const [phone, setPhone] = useState(null);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState({ busy: false, error: '', done: false });

  const guestName = name ?? [user?.firstName, user?.lastName].filter(Boolean).join(' ');
  const guestPhone = phone ?? (user?.phone || '');
  const step = kind.key === 'wedding' ? 50 : 1;
  const menuKind = !!kind.menuPath && !!onDishQty; // weddings have no menu

  const submit = async () => {
    if (!user) { onLogin(); return; }
    if (!guestName.trim() || !guestPhone.trim()) { setStatus({ error: 'Add your name and phone so the place can reach you.' }); return; }
    setStatus({ busy: true, error: '' });
    try {
      await apiFetch('/resto-bookings', {
        method: 'POST',
        body: { type: cfg.type, placeId: place.id, placeName: place.name, guestName: guestName.trim(), guestPhone: guestPhone.trim(), date, time, partySize: guests, notes: withPreorder(notes, dishes) },
      });
      setStatus({ busy: false, error: '', done: true, sentDishes: dishes.length });
      onBooked?.();
    } catch (e) { setStatus({ busy: false, error: e.message || 'Could not send. Please try again.' }); }
  };

  if (status.done) {
    return (
      <View style={box.card}>
        <MaterialCommunityIcons name="check-circle-outline" size={40} color="#60C080" />
        <Text style={box.title}>Request sent</Text>
        <Text style={box.muted}>{place.name} will confirm your {cfg.type === 'wedding' ? 'visit' : 'booking'} for {days.find((d) => d.value === date)?.label} at {time}. {status.sentDishes ? ` Your ${status.sentDishes} dish${status.sentDishes > 1 ? 'es are' : ' is'} on the booking too.` : ''} You'll get a notification, and it's listed under Me → My Bookings.</Text>
      </View>
    );
  }

  return (
    <View style={box.card}>
      <View style={box.titleRow}><MaterialCommunityIcons name={cfg.icon} size={20} color={c.accentText} /><Text style={box.title}>{cfg.title}</Text></View>
      {cfg.note ? <Text style={box.muted}>{cfg.note}</Text> : null}
      {closedNow && kind.key !== 'wedding' ? <Text style={styles.closed}>Closed right now — pick another day or time.</Text> : null}

      <Text style={box.label}>Day</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {days.map((d) => <Chip key={d.value} label={d.label} on={d.value === date} onPress={() => setDate(d.value)} />)}
      </ScrollView>

      <Text style={box.label}>Time</Text>
      <View style={[styles.chips, styles.wrap]}>
        {cfg.times.map((t) => <Chip key={t} label={t} on={t === time} onPress={() => setTime(t)} />)}
      </View>

      <Text style={box.label}>{cfg.guests}</Text>
      <View style={styles.stepper}>
        <Pressable onPress={() => setGuests((g) => Math.max(1, g - step))} style={styles.step}><MaterialCommunityIcons name="minus" size={18} color={c.text} /></Pressable>
        <Text style={styles.guests}>{guests}</Text>
        <Pressable onPress={() => setGuests((g) => g + step)} style={styles.step}><MaterialCommunityIcons name="plus" size={18} color={c.text} /></Pressable>
      </View>

      {menuKind ? (
        <View style={styles.dishes}>
          <Text style={box.label}>Dishes for your table</Text>
          {dishes.length ? dishes.map((d) => (
            <View key={d.id} style={styles.dish}>
              <Text style={styles.dishName} numberOfLines={1}>{d.name}</Text>
              <Pressable onPress={() => onDishQty(d.id, d.qty - 1)} style={styles.dishStep} accessibilityLabel={`One less ${d.name}`}><MaterialCommunityIcons name={d.qty === 1 ? 'trash-can-outline' : 'minus'} size={14} color={c.text} /></Pressable>
              <Text style={styles.dishQty}>{d.qty}</Text>
              <Pressable onPress={() => onDishQty(d.id, d.qty + 1)} style={styles.dishStep} accessibilityLabel={`One more ${d.name}`}><MaterialCommunityIcons name="plus" size={14} color={c.text} /></Pressable>
              <Text style={styles.dishPrice}>{rwf(d.price * d.qty)}</Text>
            </View>
          )) : <Text style={box.muted}>Want it ready when you arrive? Add dishes from the menu with +.</Text>}
          {dishes.length ? <Text style={box.muted}>≈ {rwf(dishes.reduce((s, d) => s + d.price * d.qty, 0))} · you pay at the {kind.key === 'coffee' ? 'café' : 'restaurant'}</Text> : null}
        </View>
      ) : null}

      {user ? (
        <>
          <TextInput value={guestName} onChangeText={setName} placeholder="Your name" placeholderTextColor={c.textMuted} style={box.input} />
          <TextInput value={guestPhone} onChangeText={setPhone} placeholder="Phone number" placeholderTextColor={c.textMuted} style={box.input} />
          <TextInput value={notes} onChangeText={setNotes} placeholder="Anything to add? (optional)" placeholderTextColor={c.textMuted} style={box.input} />
        </>
      ) : null}
      {status.error ? <Text style={box.error}>{status.error}</Text> : null}
      <Pressable onPress={submit} disabled={status.busy} style={[box.primary, status.busy && { opacity: 0.6 }]}>
        <Text style={box.primaryLabel}>{status.busy ? 'Sending…' : user ? cfg.button : `Log in to ${cfg.button.toLowerCase()}`}</Text>
      </Pressable>
    </View>
  );
}

function Chip({ label, on, onPress }) {
  const c = useShopTheme(); // eslint-disable-line no-unused-vars
  const styles = useShopStyles(makeStyles);
  const box = useShopStyles(makeBoxStyles);
  return <Pressable onPress={onPress} style={[styles.chip, on && styles.chipOn]}><Text style={[styles.chipLabel, on && styles.chipLabelOn]}>{label}</Text></Pressable>;
}

const makeStyles = (c) => StyleSheet.create({
  closed: { color: '#FBBF24', fontSize: 13 },
  chips: { gap: 6 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.sm, borderWidth: 1, borderColor: c.borderStrong },
  chipOn: { backgroundColor: c.accent, borderColor: c.accent },
  chipLabel: { color: c.textSoft, fontSize: 13, fontWeight: '600' },
  chipLabelOn: { color: c.text },
  dishes: { gap: 6, paddingTop: 4, borderTopWidth: 1, borderTopColor: c.border },
  dish: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dishName: { flex: 1, color: c.text, fontSize: 13.5 },
  dishStep: { width: 24, height: 24, borderRadius: 12, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  dishQty: { color: c.text, fontWeight: '700', minWidth: 14, textAlign: 'center' },
  dishPrice: { color: c.text, fontSize: 13, fontWeight: '600', minWidth: 70, textAlign: 'right' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  step: { width: 34, height: 34, borderRadius: 17, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  guests: { color: c.text, fontSize: 18, fontWeight: '800', minWidth: 40, textAlign: 'center' },
});
