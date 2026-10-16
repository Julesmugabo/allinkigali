/**
 * WeddingDetailScreen.js — Full detail view for a wedding venue with appointment booking.
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, Image, Pressable, Linking, StyleSheet,
  Modal, FlatList, Dimensions, ActivityIndicator, TextInput,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../../../components/common/GradientBackground';
import { WEDDING_VENUES, FACILITY_LABELS, VIEW_LABELS, PRIVACY_LABELS, PHOTO_LABELS } from '../../../data/weddingVenueData';
import { apiFetch } from '../../../services/apiClient';
import { useUser } from '../../../context/UserContext';
import { colors, typography, spacing, radius, gutter } from '../../../theme';
import { weddingColors as wc } from '../../../theme/colors';
import AppTopBar from '../../../components/common/AppTopBar';
import usePageTitle from '../../../hooks/usePageTitle';

const { width: SW, height: SH } = Dimensions.get('window');
const PRICE_LABELS = { 1: 'Budget-friendly', 2: 'Mid-range', 3: 'Luxury' };
const TIME_SLOTS = ['09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00','15:30','16:00'];

function todayStr() { return new Date().toISOString().slice(0, 10); }
function dateChips() {
  const chips = [];
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  for (let i = 0; i < 7; i++) {
    const d = new Date(); d.setDate(d.getDate() + i);
    chips.push({ value: d.toISOString().slice(0, 10), label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : days[d.getDay()], sub: `${d.getDate()} ${months[d.getMonth()]}` });
  }
  return chips;
}

function PhotoLightbox({ photos, startIndex, onClose }) {
  const [index, setIndex] = useState(startIndex);
  const listRef = useRef(null);
  const insets = useSafeAreaInsets();
  const go = (next) => { const i = Math.max(0, Math.min(photos.length - 1, next)); setIndex(i); listRef.current?.scrollToIndex({ index: i, animated: true }); };
  return (
    <Modal visible animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={lb.container}>
        <FlatList ref={listRef} data={photos} horizontal pagingEnabled initialScrollIndex={startIndex}
          getItemLayout={(_, i) => ({ length: SW, offset: SW * i, index: i })}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / SW))}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => (
            <View style={lb.slide}><Image source={{ uri: item.url }} style={lb.image} resizeMode="contain" /></View>
          )}
        />
        <View style={[lb.counter, { top: insets.top + 60 }]}><Text style={lb.counterText}>{index + 1} / {photos.length}</Text></View>
        {index > 0 && <Pressable style={[lb.arrow, lb.arrowLeft]} onPress={() => go(index - 1)}><MaterialCommunityIcons name="chevron-left" size={32} color={colors.white} /></Pressable>}
        {index < photos.length - 1 && <Pressable style={[lb.arrow, lb.arrowRight]} onPress={() => go(index + 1)}><MaterialCommunityIcons name="chevron-right" size={32} color={colors.white} /></Pressable>}
        {photos.length > 1 && photos.length <= 12 && (
          <View style={[lb.dots, { bottom: insets.bottom + spacing.lg }]}>
            {photos.map((_, i) => <Pressable key={i} onPress={() => go(i)}><View style={[lb.dot, i === index && lb.dotActive]} /></Pressable>)}
          </View>
        )}
        <Pressable onPress={onClose} style={[lb.closeBtn, { top: insets.top + spacing.sm }]}><MaterialCommunityIcons name="close" size={22} color={colors.white} /></Pressable>
      </View>
    </Modal>
  );
}

function AppointmentModal({ visible, venue, onClose, navigation }) {
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const chips = dateChips();

  const [name, setName]   = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [date, setDate]   = useState(todayStr());
  const [time, setTime]   = useState('10:00');
  const [guests, setGuests] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone]   = useState(false);
  const [error, setError] = useState('');

  const reset = () => { setName(user?.name||''); setPhone(user?.phone||''); setDate(todayStr()); setTime('10:00'); setGuests(''); setNotes(''); setDone(false); setError(''); };
  const handleClose = () => { reset(); onClose(); };

  const submit = async () => {
    if (!user) { onClose(); navigation?.navigate('Login'); return; }
    if (!name.trim() || !phone.trim()) { setError('Please enter your name and phone.'); return; }
    setError(''); setLoading(true);
    try {
      await apiFetch('/resto-bookings', {
        method: 'POST',
        body: { type: 'wedding', placeId: venue.id, placeName: venue.name, guestName: name.trim(), guestPhone: phone.trim(), date, time, partySize: parseInt(guests) || 0, notes: notes.trim() },
      });
      setDone(true);
    } catch (e) { setError(e?.message || 'Booking failed.'); }
    finally { setLoading(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <Pressable style={apt.backdrop} onPress={handleClose} />
      <View style={[apt.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={apt.handle} />
        <View style={apt.sheetHeader}>
          <Text style={apt.sheetTitle}>Book a Visit</Text>
          <Pressable onPress={handleClose} style={apt.closeBtn}><MaterialCommunityIcons name="close" size={20} color={colors.white} /></Pressable>
        </View>
        <Text style={apt.placeName}>{venue?.name}</Text>
        {done ? (
          <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
            <MaterialCommunityIcons name="calendar-check" size={52} color="#60C080" style={{ marginBottom: spacing.md }} />
            <Text style={apt.successTitle}>Appointment requested!</Text>
            <Text style={apt.successDesc}>You'll hear back from {venue?.name} to confirm your visit on {date} at {time}.</Text>
            <Pressable onPress={handleClose} style={apt.submitBtn}><Text style={apt.submitLabel}>Done</Text></Pressable>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={apt.fieldLabel}>Date</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', gap: spacing.xs, paddingBottom: spacing.xs }}>
              {chips.map(c => (
                <Pressable key={c.value} onPress={() => setDate(c.value)} style={[apt.dateChip, date === c.value && apt.dateChipActive]}>
                  <Text style={[apt.dateChipLabel, date === c.value && { color: colors.white }]}>{c.label}</Text>
                  <Text style={[apt.dateChipSub, date === c.value && { color: 'rgba(255,255,255,0.75)' }]}>{c.sub}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Text style={apt.fieldLabel}>Time</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', gap: spacing.xs, paddingBottom: spacing.xs }}>
              {TIME_SLOTS.map(t => (
                <Pressable key={t} onPress={() => setTime(t)} style={[apt.timeChip, time === t && apt.timeChipActive]}>
                  <Text style={[apt.timeChipLabel, time === t && { color: colors.white }]}>{t}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Text style={apt.fieldLabel}>Your name</Text>
            <TextInput style={apt.input} value={name} onChangeText={setName} placeholder="Full name" placeholderTextColor={colors.textOnNavyFaint} />
            <Text style={apt.fieldLabel}>Phone number</Text>
            <TextInput style={apt.input} value={phone} onChangeText={setPhone} placeholder="+250 7XX XXX XXX" placeholderTextColor={colors.textOnNavyFaint} keyboardType="phone-pad" />
            <Text style={apt.fieldLabel}>Expected guest count <Text style={{ fontWeight: '400', textTransform: 'none' }}>(optional)</Text></Text>
            <TextInput style={apt.input} value={guests} onChangeText={setGuests} placeholder="e.g. 150" placeholderTextColor={colors.textOnNavyFaint} keyboardType="numeric" />
            <Text style={apt.fieldLabel}>Notes <Text style={{ fontWeight: '400', textTransform: 'none' }}>(optional)</Text></Text>
            <TextInput style={[apt.input, { minHeight: 70, textAlignVertical: 'top' }]} value={notes} onChangeText={setNotes} placeholder="Wedding date, preferred setup, questions..." placeholderTextColor={colors.textOnNavyFaint} multiline numberOfLines={3} />
            {error ? <Text style={{ color: '#E07070', fontSize: 13, marginTop: spacing.sm }}>{error}</Text> : null}
            <Pressable onPress={submit} style={[apt.submitBtn, loading && { opacity: 0.7 }]} disabled={loading}>
              {loading ? <ActivityIndicator color={colors.white} /> : <Text style={apt.submitLabel}>Request Appointment</Text>}
            </Pressable>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

export default function WeddingDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const [venue, setVenue] = useState(() => WEDDING_VENUES.find(v => v.id === route.params?.id) || null);
  usePageTitle(venue?.name); // the browser tab and Google show its name

  useEffect(() => {
    const id = route.params?.id;
    if (!id) return;
    apiFetch(`/wedding-venues/${id}`)
      .then(data => { if (data?.id) setVenue(data); })
      .catch(() => {});
  }, [route.params?.id]);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [apptOpen, setApptOpen] = useState(false);

  if (!venue) {
    return (
      <GradientBackground>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.blue300} />
        </View>
      </GradientBackground>
    );
  }

  const photos = venue.photos || [];

  return (
    <GradientBackground colorsOverride={wc.gradient}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + spacing.huge }}>
        {/* Hero */}
        <Pressable style={styles.photoWell} onPress={() => photos.length && setLightboxIndex(0)}>
          {photos[0]?.url
            ? <Image source={{ uri: photos[0].url }} style={styles.photo} resizeMode="cover" />
            : <MaterialCommunityIcons name="flower" size={80} color={wc.accent} />}
          <View style={styles.priceBadge}><Text style={styles.priceBadgeLabel}>{PRICE_LABELS[venue.price] || 'Mid-range'}</Text></View>
          {photos.length > 1 && (
            <View style={styles.photoCountBadge}>
              <MaterialCommunityIcons name="image-multiple-outline" size={13} color={colors.white} />
              <Text style={styles.photoCountLabel}>{photos.length} photos</Text>
            </View>
          )}
          <AppTopBar variant="overlay" style={{ top: insets.top + spacing.sm }} />
        </Pressable>

        {/* Main info */}
        <View style={styles.main}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{venue.name}</Text>
            <View style={styles.ratingPill}>
              <MaterialCommunityIcons name="star" size={13} color="#F5C518" />
              <Text style={styles.ratingLabel}>{venue.rating.toFixed(1)}</Text>
            </View>
          </View>
          <Text style={styles.location}>
            <MaterialCommunityIcons name="map-marker-outline" size={13} color={colors.blue300} />
            {' '}{venue.location}
          </Text>
          <View style={styles.capRow}>
            <MaterialCommunityIcons name="account-group-outline" size={14} color={colors.textOnNavyFaint} />
            <Text style={styles.capText}>Up to {venue.capacity} guests</Text>
          </View>

          <Pressable onPress={() => setApptOpen(true)} style={styles.bookBtn}>
            <MaterialCommunityIcons name="calendar-check-outline" size={18} color={colors.white} />
            <Text style={styles.bookBtnLabel}>Book a Visit / Appointment</Text>
          </Pressable>
          <Pressable onPress={() => Linking.openURL(`tel:${venue.phone}`)} style={styles.callBtn}>
            <MaterialCommunityIcons name="phone-outline" size={18} color={colors.white} />
            <Text style={styles.callBtnLabel}>Call {venue.phone}</Text>
          </Pressable>
          <Pressable onPress={() => Linking.openURL(`https://wa.me/${venue.phone?.replace(/\D/g,'')}`)} style={styles.waBtn}>
            <MaterialCommunityIcons name="whatsapp" size={18} color="#25D366" />
            <Text style={styles.waBtnLabel}>Contact on WhatsApp</Text>
          </Pressable>
        </View>

        <View style={styles.divider} />

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{venue.description}</Text>
        </View>

        <View style={styles.divider} />

        {/* Photos */}
        {photos.length > 0 && (
          <>
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Photos</Text>
                {photos.length > 1 && (
                  <Pressable onPress={() => setLightboxIndex(0)} style={styles.seeAllBtn}>
                    <Text style={styles.seeAllLabel}>See all {photos.length}</Text>
                    <MaterialCommunityIcons name="arrow-right" size={14} color={colors.blue300} />
                  </Pressable>
                )}
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gallery}>
              {photos.map((p, i) => (
                <Pressable key={i} onPress={() => setLightboxIndex(i)} style={styles.galleryItem}>
                  <Image source={{ uri: p.url }} style={styles.galleryImage} resizeMode="cover" />
                </Pressable>
              ))}
            </ScrollView>
            <View style={styles.divider} />
          </>
        )}

        {/* Facilities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Facilities</Text>
          <View style={styles.tagRow}>
            {(venue.facilities || []).map(f => (
              <View key={f} style={styles.tag}><Text style={styles.tagLabel}>{FACILITY_LABELS[f] || f}</Text></View>
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        {/* Views & more */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Views & Atmosphere</Text>
          <View style={styles.tagRow}>
            {(venue.views || []).map(v => <View key={v} style={styles.tag}><Text style={styles.tagLabel}>{VIEW_LABELS[v] || v}</Text></View>)}
          </View>
          {venue.privacy?.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: spacing.md }]}>Privacy</Text>
              <View style={styles.tagRow}>
                {venue.privacy.map(p => <View key={p} style={styles.tag}><Text style={styles.tagLabel}>{PRIVACY_LABELS[p] || p}</Text></View>)}
              </View>
            </>
          )}
          {venue.photography?.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: spacing.md }]}>Photography</Text>
              <View style={styles.tagRow}>
                {venue.photography.map(p => <View key={p} style={styles.tag}><Text style={styles.tagLabel}>{PHOTO_LABELS[p] || p}</Text></View>)}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {lightboxIndex !== null && (
        <PhotoLightbox photos={photos} startIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}
      <AppointmentModal visible={apptOpen} venue={venue} onClose={() => setApptOpen(false)} navigation={navigation} />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  photoWell: { width: '100%', aspectRatio: 16 / 9, backgroundColor: wc.accentSoft, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' },
  photo: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  priceBadge: { position: 'absolute', bottom: spacing.md, right: gutter, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  priceBadgeLabel: { fontSize: 12, fontWeight: '700', color: '#F5C518' },
  photoCountBadge: { position: 'absolute', top: spacing.md, right: gutter, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  photoCountLabel: { fontSize: 11, fontWeight: '600', color: colors.white },
  overlayBtn: { position: 'absolute', width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  main: { paddingHorizontal: gutter, paddingTop: spacing.xl, paddingBottom: spacing.lg },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  name: { flex: 1, fontSize: 24, fontWeight: '800', color: colors.white, letterSpacing: -0.5 },
  ratingPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245,197,24,0.15)', borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 4, gap: 4, marginLeft: spacing.sm },
  ratingLabel: { fontSize: 13, fontWeight: '700', color: '#F5C518' },
  location: { fontSize: 13, color: colors.textOnNavyFaint, marginBottom: 4 },
  capRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: spacing.lg },
  capText: { fontSize: 13, color: colors.textOnNavyFaint },
  bookBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#7C3AED', borderRadius: radius.md, paddingVertical: spacing.md, marginBottom: spacing.sm, gap: spacing.sm },
  bookBtnLabel: { ...typography.bodyStrong, color: colors.white },
  callBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blue500, borderRadius: radius.md, paddingVertical: spacing.md, marginBottom: spacing.sm, gap: spacing.sm },
  callBtnLabel: { ...typography.bodyStrong, color: colors.white },
  waBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#25D366', borderRadius: radius.md, paddingVertical: spacing.md, gap: spacing.sm },
  waBtnLabel: { ...typography.bodyStrong, fontSize: 14, color: colors.white },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(133,183,235,0.18)', marginVertical: spacing.xs },
  section: { paddingHorizontal: gutter, paddingVertical: spacing.lg },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { ...typography.bodyStrong, fontSize: 16, color: colors.white, marginBottom: spacing.md },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: spacing.md },
  seeAllLabel: { fontSize: 13, color: colors.blue300, fontWeight: '600' },
  description: { fontSize: 13.5, lineHeight: 21, color: colors.textOnNavy },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  tag: { backgroundColor: 'rgba(55,138,221,0.18)', borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 5 },
  tagLabel: { fontSize: 12, color: colors.blue300, fontWeight: '600' },
  gallery: { paddingHorizontal: gutter, paddingBottom: spacing.lg, gap: spacing.sm },
  galleryItem: { width: 160 },
  galleryImage: { width: 160, height: 120, borderRadius: radius.md },
});

const lb = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  slide: { width: SW, height: SH, alignItems: 'center', justifyContent: 'center' },
  image: { width: SW, height: SH },
  counter: { position: 'absolute', alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 5 },
  counterText: { fontSize: 13, color: colors.white, fontWeight: '600' },
  arrow: { position: 'absolute', top: '50%', marginTop: -24, width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  arrowLeft: { left: spacing.md },
  arrowRight: { right: spacing.md },
  dots: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.35)' },
  dotActive: { backgroundColor: colors.white, width: 18 },
  closeBtn: { position: 'absolute', right: spacing.md, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
});

const apt = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { backgroundColor: '#06355F', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: gutter, paddingTop: spacing.sm, maxHeight: '90%' },
  handle: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: 'rgba(133,183,235,0.35)', marginBottom: spacing.md },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  sheetTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.white },
  closeBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  placeName: { fontSize: 13.5, color: colors.blue300, marginBottom: spacing.lg },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: colors.textOnNavyFaint, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm, marginTop: spacing.md },
  dateChip: { alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(133,183,235,0.25)', minWidth: 70 },
  dateChipActive: { backgroundColor: colors.blue500, borderColor: colors.blue500 },
  dateChipLabel: { fontSize: 13, fontWeight: '700', color: colors.textOnNavy },
  dateChipSub: { fontSize: 11, color: colors.textOnNavyFaint, marginTop: 2 },
  timeChip: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.pill, borderWidth: 1, borderColor: 'rgba(133,183,235,0.25)', marginRight: spacing.xs },
  timeChipActive: { backgroundColor: colors.blue500, borderColor: colors.blue500 },
  timeChipLabel: { fontSize: 13, color: colors.textOnNavy, fontWeight: '600' },
  input: { backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(133,183,235,0.2)', borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, color: colors.white, fontSize: 14 },
  successTitle: { fontSize: 20, fontWeight: '800', color: colors.white, marginBottom: spacing.sm, textAlign: 'center' },
  successDesc: { fontSize: 13.5, color: colors.textOnNavy, textAlign: 'center', lineHeight: 21, marginBottom: spacing.xl, paddingHorizontal: spacing.sm },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#7C3AED', borderRadius: radius.md, paddingVertical: spacing.md + 2, marginTop: spacing.sm, marginBottom: spacing.lg },
  submitLabel: { fontSize: 15, fontWeight: '700', color: colors.white },
});
