/**
 * BookingForm.js — Table/seat reservation form for restaurants and coffee shops.
 * Anyone can fill the form; sign-in is only required at submit time.
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, Modal,
  ScrollView, ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { apiFetch } from '../../services/apiClient';
import { useUser } from '../../context/UserContext';
import { promptGoogleSignIn } from '../../services/googleAuth';
import { colors, typography, spacing, radius, gutter } from '../../theme';

const CAL_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const CAL_DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function MonthCalendar({ calMonth, setCalMonth, selectedDate, onSelect }) {
  const { year, month } = calMonth;
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const canGoPrev = year > today.getFullYear() || (year === today.getFullYear() && month > today.getMonth());

  const cells = useMemo(() => {
    const firstDow = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const out = [];
    for (let i = 0; i < firstDow; i++) out.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      out.push({ day: d, ds, past: ds < todayStr });
    }
    return out;
  }, [year, month, todayStr]);

  const prev = () => month === 0 ? setCalMonth({ year: year - 1, month: 11 }) : setCalMonth({ year, month: month - 1 });
  const next = () => month === 11 ? setCalMonth({ year: year + 1, month: 0 }) : setCalMonth({ year, month: month + 1 });

  return (
    <View style={cal.wrap}>
      <View style={cal.nav}>
        <Pressable onPress={canGoPrev ? prev : null} hitSlop={8} style={cal.navBtn}>
          <MaterialCommunityIcons name="chevron-left" size={20} color={canGoPrev ? colors.textOnNavy : 'transparent'} />
        </Pressable>
        <Text style={cal.monthLabel}>{CAL_MONTHS[month]} {year}</Text>
        <Pressable onPress={next} hitSlop={8} style={cal.navBtn}>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textOnNavy} />
        </Pressable>
      </View>
      <View style={cal.weekRow}>
        {CAL_DAYS.map(d => <Text key={d} style={cal.dayHdr}>{d}</Text>)}
      </View>
      <View style={cal.grid}>
        {cells.map((c, i) => {
          if (!c) return <View key={`e${i}`} style={cal.cell} />;
          const sel = c.ds === selectedDate;
          return (
            <Pressable key={c.ds} style={[cal.cell, sel && cal.cellSel, c.past && cal.cellPast]} onPress={() => !c.past && onSelect(c.ds)} disabled={c.past}>
              <Text style={[cal.cellTxt, sel && cal.cellTxtSel, c.past && cal.cellTxtPast]}>{c.day}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const PARTY_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];
const TIME_SLOTS = [
  '07:00','07:30','08:00','08:30','09:00','09:30','10:00','10:30',
  '11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30',
  '15:00','15:30','16:00','16:30','17:00','17:30','18:00','18:30',
  '19:00','19:30','20:00','20:30','21:00','21:30','22:00',
];

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function dateChips() {
  const chips = [];
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    chips.push({
      value: d.toISOString().slice(0, 10),
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : days[d.getDay()],
      sub: `${d.getDate()} ${months[d.getMonth()]}`,
    });
  }
  return chips;
}

export default function BookingForm({ visible, onClose, placeId, placeName, type, navigation, selectedItems = {} }) {
  const insets = useSafeAreaInsets();
  const { user, signInWithGoogle } = useUser();

  const [name, setName]         = useState(user?.name || '');
  const [phone, setPhone]       = useState(user?.phone || '');
  const [date, setDate]         = useState(todayString());
  const [time, setTime]         = useState('19:00');
  const [partySize, setPartySize] = useState(2);
  const [notes, setNotes]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);
  const [error, setError]       = useState('');
  const [showAuth, setShowAuth] = useState(false);
  const [showCal, setShowCal]   = useState(false);
  const [calMonth, setCalMonth] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() });

  const itemList = Object.values(selectedItems);

  const reset = () => {
    setName(user?.name || '');
    setPhone(user?.phone || '');
    setDate(todayString());
    setTime('19:00');
    setPartySize(2);
    setNotes('');
    setDone(false);
    setError('');
    setShowAuth(false);
    setShowCal(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const buildNotes = () => {
    let full = notes.trim();
    if (itemList.length > 0) {
      const itemsText = 'Pre-selected: ' + itemList.map(i => i.name).join(', ');
      full = full ? `${full}\n${itemsText}` : itemsText;
    }
    return full;
  };

  const submit = async () => {
    if (!user) { setShowAuth(true); return; }
    if (!name.trim() || !phone.trim()) {
      setError('Please enter your name and phone number.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await apiFetch('/resto-bookings', {
        method: 'POST',
        body: { type, placeId, placeName, guestName: name.trim(), guestPhone: phone.trim(), date, time, partySize, notes: buildNotes() },
      });
      setDone(true);
    } catch (e) {
      setError(e?.message || 'Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const chips = dateChips();

  // ── Auth gate (shown after pressing submit while logged out) ──────────────
  const authGate = (
    <View style={styles.authGate}>
      <MaterialCommunityIcons name="account-circle-outline" size={52} color={colors.blue300} style={{ marginBottom: spacing.md }} />
      <Text style={styles.authTitle}>Almost there!</Text>
      <Text style={styles.authDesc}>
        Sign in or create a free account to confirm your reservation at {placeName}.
        Your booking details are saved.
      </Text>

      {/* Google One Tap — placeholder, activated when GOOGLE_CLIENT_ID is set */}
      <Pressable
        style={styles.googleBtn}
        onPress={async () => {
          try {
            const credential = await promptGoogleSignIn();
            if (!credential) return;
            await signInWithGoogle(credential);
            // Submit directly — user state hasn't re-rendered yet so bypass the check
            setShowAuth(false);
            setError('');
            setLoading(true);
            try {
              await apiFetch('/resto-bookings', {
                method: 'POST',
                body: { type, placeId, placeName, guestName: name.trim() || 'Guest', guestPhone: phone.trim() || '', date, time, partySize, notes: buildNotes() },
              });
              setDone(true);
            } catch (e2) {
              setError(e2?.message || 'Booking failed. Please try again.');
            } finally {
              setLoading(false);
            }
          } catch (e) {
            setError('Google sign-in failed. Try email instead.');
          }
        }}
      >
        <View style={styles.googleIcon}>
          <Text style={styles.googleG}>G</Text>
        </View>
        <Text style={styles.googleLabel}>Continue with Google</Text>
      </Pressable>

      <View style={styles.authDivider}>
        <View style={styles.authDividerLine} />
        <Text style={styles.authDividerText}>or</Text>
        <View style={styles.authDividerLine} />
      </View>

      <Pressable
        style={styles.authPrimaryBtn}
        onPress={() => { handleClose(); navigation?.navigate('SignUp', { returnTo: { screen: placeName, placeId, type } }); }}
      >
        <Text style={styles.authPrimaryLabel}>Create free account</Text>
      </Pressable>
      <Pressable
        style={styles.authSecondaryBtn}
        onPress={() => { handleClose(); navigation?.navigate('Login', { returnTo: { screen: placeName, placeId, type } }); }}
      >
        <Text style={styles.authSecondaryLabel}>Sign in</Text>
      </Pressable>

      <Pressable onPress={() => setShowAuth(false)} style={styles.backLink}>
        <MaterialCommunityIcons name="arrow-left" size={14} color={colors.textOnNavyFaint} />
        <Text style={styles.backLinkLabel}>Back to booking form</Text>
      </Pressable>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.handle} />

        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Reserve a Table</Text>
          <Pressable onPress={handleClose} style={styles.closeBtn}>
            <MaterialCommunityIcons name="close" size={20} color={colors.textOnNavy} />
          </Pressable>
        </View>
        <Text style={styles.placeName}>{placeName}</Text>

        {showAuth ? authGate : done ? (
          <View style={styles.successBox}>
            <MaterialCommunityIcons name="calendar-check" size={52} color="#60C080" style={{ marginBottom: spacing.md }} />
            <Text style={styles.successTitle}>Booking requested!</Text>
            <Text style={styles.successDesc}>
              You'll get a notification once {placeName} confirms your reservation for {partySize} {partySize === 1 ? 'person' : 'people'} on {date} at {time}.
            </Text>
            <Pressable onPress={handleClose} style={styles.doneBtn}>
              <Text style={styles.doneBtnLabel}>Done</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Date */}
            <Text style={styles.fieldLabel}>Date</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              {chips.map((c) => (
                <Pressable key={c.value} onPress={() => { setDate(c.value); setShowCal(false); }} style={[styles.dateChip, date === c.value && styles.dateChipActive]}>
                  <Text style={[styles.dateChipLabel, date === c.value && styles.dateChipLabelActive]}>{c.label}</Text>
                  <Text style={[styles.dateChipSub, date === c.value && styles.dateChipSubActive]}>{c.sub}</Text>
                </Pressable>
              ))}
              <Pressable onPress={() => setShowCal(v => !v)} style={[styles.dateChip, showCal && styles.dateChipActive]}>
                <MaterialCommunityIcons name="calendar-month-outline" size={18} color={showCal ? colors.white : colors.textOnNavy} />
                <Text style={[styles.dateChipSub, showCal && styles.dateChipSubActive]}>More</Text>
              </Pressable>
            </ScrollView>
            {showCal && (
              <MonthCalendar
                calMonth={calMonth}
                setCalMonth={setCalMonth}
                selectedDate={date}
                onSelect={(ds) => { setDate(ds); setShowCal(false); }}
              />
            )}

            {/* Pre-selected menu items */}
            {itemList.length > 0 && (
              <View>
                <Text style={styles.fieldLabel}>Pre-selected from menu</Text>
                <View style={styles.preItemsBox}>
                  {itemList.map((item, i) => (
                    <View key={i} style={styles.preItem}>
                      <MaterialCommunityIcons name="check-circle-outline" size={14} color={colors.blue300} />
                      <Text style={styles.preItemName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.preItemPrice}>{Number(item.price).toLocaleString()} RWF</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Time */}
            <Text style={styles.fieldLabel}>Time</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              {TIME_SLOTS.map((t) => (
                <Pressable key={t} onPress={() => setTime(t)} style={[styles.timeChip, time === t && styles.timeChipActive]}>
                  <Text style={[styles.timeChipLabel, time === t && styles.timeChipLabelActive]}>{t}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Party size */}
            <Text style={styles.fieldLabel}>Party size</Text>
            <View style={styles.chipsRow}>
              {PARTY_OPTIONS.map((n) => (
                <Pressable key={n} onPress={() => setPartySize(n)} style={[styles.partyChip, partySize === n && styles.partyChipActive]}>
                  <Text style={[styles.partyChipLabel, partySize === n && styles.partyChipLabelActive]}>{n}</Text>
                </Pressable>
              ))}
              <Pressable onPress={() => setPartySize(9)} style={[styles.partyChip, partySize >= 9 && styles.partyChipActive]}>
                <Text style={[styles.partyChipLabel, partySize >= 9 && styles.partyChipLabelActive]}>9+</Text>
              </Pressable>
            </View>

            {/* Name */}
            <Text style={styles.fieldLabel}>Your name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Full name"
              placeholderTextColor={colors.textOnNavyFaint}
            />

            {/* Phone */}
            <Text style={styles.fieldLabel}>Phone number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+250 7XX XXX XXX"
              placeholderTextColor={colors.textOnNavyFaint}
              keyboardType="phone-pad"
            />

            {/* Notes */}
            <Text style={styles.fieldLabel}>Special requests <Text style={styles.optional}>(optional)</Text></Text>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Allergies, special occasion, seating preference…"
              placeholderTextColor={colors.textOnNavyFaint}
              multiline
              numberOfLines={3}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Text style={styles.noshowWarning}>
              ⚠️ Please only book if you intend to show up. Repeated no-shows are recorded on your account.
            </Text>

            <Pressable onPress={submit} style={[styles.submitBtn, loading && { opacity: 0.7 }]} disabled={loading}>
              {loading
                ? <ActivityIndicator color={colors.white} />
                : <>
                    <MaterialCommunityIcons name="calendar-check-outline" size={18} color={colors.white} />
                    <Text style={styles.submitLabel}>Request Reservation</Text>
                  </>
              }
            </Pressable>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: '#06355F',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: gutter, paddingTop: spacing.sm,
    maxHeight: '90%',
  },
  handle: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: 'rgba(133,183,235,0.35)', marginBottom: spacing.md },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  sheetTitle: { flex: 1, ...typography.bodyStrong, fontSize: 18, color: colors.white },
  closeBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  placeName: { fontSize: 13.5, color: colors.blue300, marginBottom: spacing.lg },

  fieldLabel: { fontSize: 12, fontWeight: '700', color: colors.textOnNavyFaint, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm, marginTop: spacing.md },
  optional: { fontWeight: '400', textTransform: 'none', letterSpacing: 0 },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, paddingBottom: spacing.xs },
  dateChip: { alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(133,183,235,0.25)', minWidth: 70 },
  dateChipActive: { backgroundColor: colors.blue500, borderColor: colors.blue500 },
  dateChipLabel: { fontSize: 13, fontWeight: '700', color: colors.textOnNavy },
  dateChipLabelActive: { color: colors.white },
  dateChipSub: { fontSize: 11, color: colors.textOnNavyFaint, marginTop: 2 },
  dateChipSubActive: { color: 'rgba(255,255,255,0.75)' },

  timeChip: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.pill, borderWidth: 1, borderColor: 'rgba(133,183,235,0.25)', marginRight: spacing.xs },
  timeChipActive: { backgroundColor: colors.blue500, borderColor: colors.blue500 },
  timeChipLabel: { fontSize: 13, color: colors.textOnNavy, fontWeight: '600' },
  timeChipLabelActive: { color: colors.white },

  partyChip: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: 'rgba(133,183,235,0.25)', alignItems: 'center', justifyContent: 'center' },
  partyChipActive: { backgroundColor: colors.blue500, borderColor: colors.blue500 },
  partyChipLabel: { fontSize: 14, fontWeight: '700', color: colors.textOnNavy },
  partyChipLabelActive: { color: colors.white },

  input: { backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(133,183,235,0.2)', borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, color: colors.white, fontSize: 14 },
  inputMulti: { minHeight: 80, textAlignVertical: 'top' },

  errorText: { color: '#E07070', fontSize: 13, marginTop: spacing.sm },
  noshowWarning: { fontSize: 12, color: colors.textOnNavyFaint, lineHeight: 18, marginTop: spacing.md, marginBottom: spacing.sm },

  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blue500, borderRadius: radius.md, paddingVertical: spacing.md + 2, gap: spacing.sm, marginTop: spacing.sm, marginBottom: spacing.lg },
  submitLabel: { ...typography.bodyStrong, color: colors.white, fontSize: 15 },

  // ── Auth gate ──
  authGate: { paddingVertical: spacing.lg, alignItems: 'center' },
  authTitle: { fontSize: 20, fontWeight: '800', color: colors.white, marginBottom: spacing.sm },
  authDesc: { fontSize: 13.5, color: colors.textOnNavy, textAlign: 'center', lineHeight: 21, marginBottom: spacing.xl, paddingHorizontal: spacing.sm },

  googleBtn: { flexDirection: 'row', alignItems: 'center', width: '100%', backgroundColor: colors.white, borderRadius: radius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, gap: spacing.md, marginBottom: spacing.md },
  googleIcon: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#4285F4', alignItems: 'center', justifyContent: 'center' },
  googleG: { color: colors.white, fontWeight: '800', fontSize: 13 },
  googleLabel: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },

  authDivider: { flexDirection: 'row', alignItems: 'center', width: '100%', marginVertical: spacing.md, gap: spacing.sm },
  authDividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(133,183,235,0.25)' },
  authDividerText: { fontSize: 12, color: colors.textOnNavyFaint },

  authPrimaryBtn: { width: '100%', backgroundColor: colors.blue500, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', marginBottom: spacing.sm },
  authPrimaryLabel: { fontSize: 15, fontWeight: '700', color: colors.white },
  authSecondaryBtn: { width: '100%', borderWidth: 1, borderColor: 'rgba(133,183,235,0.35)', borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  authSecondaryLabel: { fontSize: 15, fontWeight: '600', color: colors.textOnNavy },

  backLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.xl },
  backLinkLabel: { fontSize: 13, color: colors.textOnNavyFaint },

  preItemsBox: { borderWidth: 1, borderColor: 'rgba(133,183,235,0.2)', borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, gap: spacing.xs },
  preItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 3 },
  preItemName: { flex: 1, fontSize: 13, color: colors.textOnNavy },
  preItemPrice: { fontSize: 12, fontWeight: '700', color: '#60C080' },

  successBox: { alignItems: 'center', paddingVertical: spacing.xl, paddingHorizontal: gutter },
  successTitle: { ...typography.bodyStrong, fontSize: 20, color: colors.white, marginBottom: spacing.sm },
  successDesc: { fontSize: 13.5, color: colors.textOnNavy, textAlign: 'center', lineHeight: 21, marginBottom: spacing.xl },
  doneBtn: { backgroundColor: colors.blue500, borderRadius: radius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
  doneBtnLabel: { ...typography.bodyStrong, color: colors.white },
});

const cal = StyleSheet.create({
  wrap: { borderWidth: 1, borderColor: 'rgba(133,183,235,0.2)', borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.sm },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  navBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  monthLabel: { fontSize: 14, fontWeight: '700', color: colors.white },
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  dayHdr: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', color: colors.textOnNavyFaint },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100/7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 4 },
  cellSel: { backgroundColor: colors.blue500 },
  cellPast: { opacity: 0.3 },
  cellTxt: { fontSize: 13, color: colors.textOnNavy },
  cellTxtSel: { color: colors.white, fontWeight: '700' },
  cellTxtPast: { color: colors.textOnNavyFaint },
});
