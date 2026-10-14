/**
 * ReviewsSection.js — average rating with a bar per star count, the latest
 * reviews with the place's replies under them, and a form to write one.
 * Writing needs an account; the form says so instead of failing.
 */
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { apiFetch } from '../../../services/apiClient';
import { colors, radius, spacing } from '../../../theme';
import Section from './Section';

const SHORT = 3;
const Stars = ({ value, size = 14 }) => (
  <Text style={{ color: '#F5C518', fontSize: size }}>{'★'.repeat(Math.round(value))}<Text style={{ color: 'rgba(255,255,255,0.2)' }}>{'★'.repeat(5 - Math.round(value))}</Text></Text>
);

function WriteReview({ kind, placeId, user, onLogin, onPosted }) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [state, setState] = useState({ busy: false, error: '', done: false });
  if (!user) {
    return <Pressable onPress={onLogin} style={styles.ghost}><Text style={styles.ghostLabel}>Log in to write a review</Text></Pressable>;
  }
  if (state.done) return <Text style={styles.thanks}>Thank you — your review is posted.</Text>;
  const submit = async () => {
    if (!rating) { setState({ busy: false, error: 'Choose how many stars.' }); return; }
    setState({ busy: true, error: '' });
    try {
      await apiFetch('/reviews', { method: 'POST', body: { placeType: kind.reviewType, placeId, rating, text } });
      setState({ busy: false, error: '', done: true });
      onPosted();
    } catch (e) { setState({ busy: false, error: e.message || 'Could not post your review.' }); }
  };
  return (
    <View style={styles.form}>
      <Text style={styles.formTitle}>Write a review</Text>
      <View style={styles.pickStars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => setRating(n)} accessibilityLabel={`${n} stars`}>
            <MaterialCommunityIcons name={n <= rating ? 'star' : 'star-outline'} size={28} color="#F5C518" />
          </Pressable>
        ))}
      </View>
      <TextInput value={text} onChangeText={setText} multiline placeholder="What did you like? Anything to improve?"
        placeholderTextColor={colors.textOnNavyFaint} style={styles.input} />
      {state.error ? <Text style={styles.error}>{state.error}</Text> : null}
      <Pressable onPress={submit} disabled={state.busy} style={[styles.primary, state.busy && { opacity: 0.6 }]}>
        <Text style={styles.primaryLabel}>{state.busy ? 'Posting…' : 'Post review'}</Text>
      </Pressable>
    </View>
  );
}

export default function ReviewsSection({ kind, place, reviews, user, onLogin, onPosted }) {
  const [all, setAll] = useState(false);
  const average = reviews.average ?? Number(place.rating || 0);
  const max = Math.max(1, ...Object.values(reviews.counts || {}));
  const shown = all ? reviews.reviews : reviews.reviews.slice(0, SHORT);

  return (
    <Section id="reviews" title="Reviews">
      <View style={styles.summary}>
        <View style={styles.big}>
          <Text style={styles.avg}>{average ? average.toFixed(1) : '–'}</Text>
          <Stars value={average || 0} size={16} />
          <Text style={styles.muted}>{reviews.count ? `${reviews.count} review${reviews.count > 1 ? 's' : ''}` : 'No reviews yet'}</Text>
        </View>
        <View style={styles.bars}>
          {[5, 4, 3, 2, 1].map((n) => (
            <View key={n} style={styles.barRow}>
              <Text style={styles.muted}>{n}★</Text>
              <View style={styles.track}><View style={[styles.fill, { width: `${((reviews.counts?.[n] || 0) / max) * 100}%` }]} /></View>
              <Text style={[styles.muted, { width: 24 }]}>{reviews.counts?.[n] || 0}</Text>
            </View>
          ))}
        </View>
      </View>

      {shown.map((r) => (
        <View key={r.id} style={styles.review}>
          <View style={styles.reviewHead}>
            <Text style={styles.guest}>{r.guestName}</Text>
            <Stars value={r.rating} />
            <Text style={styles.muted}>{new Date(r.date).toLocaleDateString()}</Text>
          </View>
          {r.text ? <Text style={styles.reviewText}>{r.text}</Text> : null}
          {r.ownerReply ? (
            <View style={styles.reply}>
              <Text style={styles.replyFrom}>Reply from {place.name}</Text>
              <Text style={styles.reviewText}>{r.ownerReply}</Text>
            </View>
          ) : null}
        </View>
      ))}
      {reviews.reviews.length > SHORT && (
        <Pressable onPress={() => setAll((a) => !a)}><Text style={styles.link}>{all ? 'Show fewer' : `See all ${reviews.reviews.length} reviews`}</Text></Pressable>
      )}
      <WriteReview kind={kind} placeId={place.id} user={user} onLogin={onLogin} onPosted={onPosted} />
    </Section>
  );
}

const styles = StyleSheet.create({
  summary: { flexDirection: 'row', gap: spacing.xxl, alignItems: 'center', marginBottom: spacing.lg },
  big: { alignItems: 'center', gap: 4, width: 130 },
  avg: { color: colors.white, fontSize: 44, fontWeight: '800' },
  bars: { flex: 1, gap: 6 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  track: { flex: 1, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#F5C518', borderRadius: 4 },
  muted: { color: colors.textOnNavyFaint, fontSize: 12.5 },
  review: { paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: 'rgba(133,183,235,0.1)' },
  reviewHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  guest: { color: colors.white, fontWeight: '700' },
  reviewText: { color: colors.textOnNavy, fontSize: 14.5, lineHeight: 22 },
  reply: { marginTop: 8, marginLeft: 16, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: colors.blue500 },
  replyFrom: { color: colors.blue300, fontSize: 12.5, fontWeight: '700', marginBottom: 2 },
  link: { color: colors.blue300, fontWeight: '600', marginTop: spacing.sm },
  form: { marginTop: spacing.lg, padding: spacing.lg, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.05)', gap: 10 },
  formTitle: { color: colors.white, fontWeight: '700', fontSize: 15 },
  pickStars: { flexDirection: 'row', gap: 4 },
  input: { minHeight: 80, color: colors.white, borderRadius: radius.sm, borderWidth: 1, borderColor: 'rgba(133,183,235,0.25)', padding: 10, fontSize: 14, outlineStyle: 'none', textAlignVertical: 'top' },
  error: { color: '#F87171' },
  primary: { alignSelf: 'flex-start', backgroundColor: colors.blue500, borderRadius: radius.md, paddingHorizontal: 18, paddingVertical: 10 },
  primaryLabel: { color: colors.white, fontWeight: '700' },
  ghost: { alignSelf: 'flex-start', marginTop: spacing.lg, borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(133,183,235,0.35)', paddingHorizontal: 16, paddingVertical: 10 },
  ghostLabel: { color: colors.blue300, fontWeight: '600' },
  thanks: { color: '#60C080', fontWeight: '600', marginTop: spacing.lg },
});
