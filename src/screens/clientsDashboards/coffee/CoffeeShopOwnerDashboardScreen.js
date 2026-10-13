/**
 * CoffeeShopOwnerDashboardScreen.js
 * Owner dashboard for a coffee shop: inherits restaurant patterns + Intent tab differentiator.
 * Tabs: Overview · Bookings · Orders · Menu · Intents · Insights · Reviews · Finance · Reports · Settings
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput,
  ActivityIndicator, Alert, StyleSheet, Platform, Linking, useWindowDimensions,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../../../components/common/GradientBackground';
import { colors, spacing, radius, gutter } from '../../../theme';
import { apiFetch, getToken } from '../../../services/apiClient';
import { pickAndUpload } from '../../../utils/uploadPhoto';
import { useUser } from '../../../context/UserContext';

// ── Nav ───────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { key: 'overview', icon: 'view-dashboard-outline', label: 'Overview' },
  { key: 'bookings', icon: 'calendar-clock',         label: 'Bookings' },
  { key: 'orders',   icon: 'moped-outline',           label: 'Orders' },
  { key: 'menu',     icon: 'coffee-outline',          label: 'Menu' },
  { key: 'intents',  icon: 'lightning-bolt',          label: 'Intents' },
  { key: 'insights', icon: 'chart-line',              label: 'Insights' },
  { key: 'reviews',  icon: 'star-outline',            label: 'Reviews' },
  { key: 'finance',  icon: 'cash-multiple',           label: 'Finance' },
  { key: 'reports',  icon: 'file-chart-outline',      label: 'Reports' },
  { key: 'settings', icon: 'cog-outline',             label: 'Settings' },
];

// ── Intent definitions (same as admin screen) ─────────────────────────────────

const INTENTS = [
  { key: 'work',    emoji: '💻', label: 'Work remotely',   attrs: ['wifi','poweroutlets','laptopfriendly','workarea','longstay'],     description: 'People looking for a place to work with good WiFi and power.' },
  { key: 'study',   emoji: '📚', label: 'Study',           attrs: ['wifi','poweroutlets','studyarea','quiet'],                        description: 'Students who need a quiet spot with WiFi.' },
  { key: 'date',    emoji: '❤️', label: 'Date',            attrs: ['romantic','cozy','outdoor','scenicview'],                         description: 'Couples looking for a romantic or cozy atmosphere.' },
  { key: 'friends', emoji: '👥', label: 'Meet friends',    attrs: ['groupseating','spacious','lively','outdoor'],                     description: 'Groups wanting space to gather and chat.' },
  { key: 'quiet',   emoji: '🤫', label: 'Quiet place',     attrs: ['quiet','relaxed','studyfriendly'],                                description: 'People who want a calm, low-noise environment.' },
  { key: 'outdoor', emoji: '🌿', label: 'Outdoor seating', attrs: ['outdoor','terrace','garden','rooftop'],                          description: 'Customers who want to sit outside.' },
  { key: 'dog',     emoji: '🐕', label: 'Dog friendly',    attrs: ['petfriendly','outdoor'],                                          description: 'Pet owners bringing their dogs.' },
];

const ATTR_LABELS = {
  wifi: 'WiFi', poweroutlets: 'Power sockets', laptopfriendly: 'Laptop friendly',
  workarea: 'Work area', longstay: 'Long stay ok', studyarea: 'Study area',
  quiet: 'Quiet', romantic: 'Romantic', cozy: 'Cozy', outdoor: 'Outdoor seating',
  scenicview: 'Scenic view', groupseating: 'Group seating', spacious: 'Spacious',
  lively: 'Lively', relaxed: 'Relaxed', studyfriendly: 'Study friendly',
  terrace: 'Terrace', garden: 'Garden', rooftop: 'Rooftop', petfriendly: 'Pet friendly',
};

const ALL_ATTRS = Object.keys(ATTR_LABELS);

const STATUS_COLORS = {
  pending: '#F5C518', confirmed: '#60C080', rejected: '#E05050',
  cancelled: '#888', completed: '#60C080', noshow: '#E07030',
};

const MENU_CATEGORIES_CS = [
  'Espresso drinks','Filter & pour-over','Cold drinks','Tea & infusions',
  'Smoothies','Pastries','Cakes','Sandwiches','Light meals','Retail beans','Other',
];

const DECLINE_REASONS = ['Fully booked', 'Closed that day', 'Party too large', 'Private event', 'Other'];
const ORDER_STAGES = ['new','accepted','preparing','ready','delivered','cancelled'];
const ORDER_STAGE_LABELS = { new: 'New', accepted: 'Accepted', preparing: 'Preparing', ready: 'Ready', delivered: 'Delivered', cancelled: 'Cancelled' };
const PREP_TIMES = [5, 10, 15, 25];

// ── Helpers ───────────────────────────────────────────────────────────────────

function slaMinutes(createdAt) {
  return Math.max(0, 120 - (Date.now() - new Date(createdAt || 0).getTime()) / 60000);
}

function fmtRwf(n) { return Number(n || 0).toLocaleString() + ' RWF'; }
function todayStr() { return new Date().toISOString().slice(0, 10); }

// ── Shared primitives ─────────────────────────────────────────────────────────

function KpiTile({ label, value, sub, color, icon }) {
  return (
    <View style={[tile.card, { borderTopColor: color || colors.blue500 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        {icon && <MaterialCommunityIcons name={icon} size={15} color={color || colors.blue300} />}
        <Text style={tile.value}>{value}</Text>
      </View>
      <Text style={tile.label}>{label}</Text>
      {sub ? <Text style={tile.sub}>{sub}</Text> : null}
    </View>
  );
}
const tile = StyleSheet.create({
  card: { flex: 1, minWidth: 100, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: radius.md, padding: spacing.md, borderTopWidth: 3 },
  value: { fontSize: 20, fontWeight: '800', color: colors.white },
  label: { fontSize: 11, color: colors.textOnNavyFaint, marginTop: 2 },
  sub:   { fontSize: 10, color: colors.blue300, marginTop: 1 },
});

function AlertBand({ alerts }) {
  if (!alerts.length) return null;
  return (
    <View style={{ gap: 6, marginBottom: spacing.lg }}>
      {alerts.map((a, i) => (
        <View key={i} style={[ab.row, a.severity === 'high' ? ab.high : ab.medium]}>
          <MaterialCommunityIcons name={a.icon || 'alert-circle-outline'} size={15} color={a.severity === 'high' ? '#F87171' : '#FCD34D'} />
          <Text style={ab.text}>{a.text}</Text>
        </View>
      ))}
    </View>
  );
}
const ab = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 8, borderWidth: StyleSheet.hairlineWidth },
  high: { backgroundColor: 'rgba(248,113,113,0.1)', borderColor: 'rgba(248,113,113,0.3)' },
  medium: { backgroundColor: 'rgba(252,211,77,0.1)', borderColor: 'rgba(252,211,77,0.3)' },
  text: { flex: 1, fontSize: 12, color: colors.white },
});

function SectionTitle({ title, icon }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.md }}>
      {icon && <MaterialCommunityIcons name={icon} size={15} color={colors.blue300} />}
      <Text style={{ fontSize: 12, fontWeight: '800', color: colors.blue300, textTransform: 'uppercase', letterSpacing: 0.8 }}>{title}</Text>
    </View>
  );
}

function Card({ children, style }) {
  return <View style={[cd.card, style]}>{children}</View>;
}
const cd = StyleSheet.create({
  card: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(133,183,235,0.15)' },
});

function ComingSoon({ icon, title, sub }) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 40, gap: spacing.sm }}>
      <MaterialCommunityIcons name={icon} size={44} color={colors.blue300} />
      <Text style={{ fontSize: 15, fontWeight: '700', color: colors.white, textAlign: 'center' }}>{title}</Text>
      <Text style={{ fontSize: 13, color: colors.textOnNavyFaint, textAlign: 'center', paddingHorizontal: 32 }}>{sub}</Text>
    </View>
  );
}

// ── Overview tab ──────────────────────────────────────────────────────────────

function OverviewTab({ shop, bookings, menuItems, busyLevel, onBusy, onNav }) {
  const today = todayStr();
  const pending = bookings.filter(b => b.status === 'pending');
  const todayConfirmed = bookings.filter(b => b.date === today && b.status === 'confirmed');
  const attrs = shop.attributes || [];

  const alerts = [];
  if (pending.filter(b => slaMinutes(b.createdAt) <= 0).length > 0)
    alerts.push({ text: `${pending.filter(b => slaMinutes(b.createdAt) <= 0).length} request(s) past 2-hour SLA`, severity: 'high', icon: 'clock-alert-outline' });
  if ((shop.photos || []).length < 4)
    alerts.push({ text: 'Add more photos to attract customers (min. 4)', severity: 'medium', icon: 'image-plus-outline' });

  // WiFi / intent completeness signal
  const workAttrs = INTENTS.find(i => i.key === 'work')?.attrs || [];
  const workMissing = workAttrs.filter(a => !attrs.includes(a));
  if (workMissing.length > 0 && workMissing.length <= 2)
    alerts.push({ text: `You're ${workMissing.length} attribute(s) away from "Work remotely" — tap Intents to fix`, severity: 'medium', icon: 'lightning-bolt-outline' });

  // Today timeline
  const hours = Array.from({ length: 15 }, (_, i) => i + 7);
  const slotCounts = {};
  hours.forEach(h => { slotCounts[h] = 0; });
  bookings.forEach(b => {
    if (b.date !== today || !b.time) return;
    const h = parseInt(b.time.split(':')[0], 10);
    if (slotCounts[h] !== undefined) slotCounts[h] += b.partySize || 1;
  });
  const maxSlot = Math.max(...Object.values(slotCounts), 1);

  return (
    <View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg }}>
        <KpiTile label="Customers today" value={todayConfirmed.length} sub="confirmed bookings" color="#60C080" icon="account-group-outline" />
        <KpiTile label="Pending" value={pending.length} color="#F5C518" icon="clock-outline" />
        <KpiTile label="Menu items" value={menuItems.length} color={colors.blue300} icon="coffee-outline" />
        <KpiTile label="Rating" value={shop.rating ? `★ ${shop.rating}` : '—'} color="#F5C518" icon="star-outline" />
      </View>

      <AlertBand alerts={alerts} />

      {/* Busy-now toggle */}
      <Card>
        <SectionTitle title="Current busyness" icon="chart-bar" />
        <Text style={{ fontSize: 12, color: colors.textOnNavyFaint, marginBottom: spacing.sm }}>Let customers know if there's a seat. Resets automatically after 2 hours.</Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {[
            { key: 'quiet', label: 'Quiet', color: '#60C080' },
            { key: 'moderate', label: 'Moderate', color: '#F5C518' },
            { key: 'full', label: 'Full', color: '#E05050' },
          ].map(b => (
            <Pressable key={b.key} onPress={() => onBusy(b.key)} style={{ flex: 1, borderRadius: radius.md, borderWidth: 2, borderColor: busyLevel === b.key ? b.color : 'rgba(133,183,235,0.2)', backgroundColor: busyLevel === b.key ? `${b.color}22` : 'transparent', alignItems: 'center', paddingVertical: spacing.sm }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: busyLevel === b.key ? b.color : colors.textOnNavyFaint }}>{b.label}</Text>
            </Pressable>
          ))}
        </View>
        {busyLevel && <Text style={{ fontSize: 11, color: colors.textOnNavyFaint, marginTop: spacing.xs, textAlign: 'center' }}>Set to "{busyLevel}" — visible on your listing</Text>}
      </Card>

      {/* Quick actions */}
      <Card>
        <SectionTitle title="Quick actions" icon="lightning-bolt" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
          {[
            { icon: 'calendar-plus', label: 'Add booking', key: 'bookings', badge: pending.length },
            { icon: 'coffee-outline', label: 'Edit menu', key: 'menu' },
            { icon: 'lightning-bolt', label: 'Intents', key: 'intents' },
            { icon: 'cog-outline', label: 'Settings', key: 'settings' },
          ].map(a => (
            <Pressable key={a.key} onPress={() => onNav(a.key)} style={ov.qa}>
              <View style={ov.qaIcon}>
                <MaterialCommunityIcons name={a.icon} size={22} color={colors.blue300} />
                {a.badge > 0 && <View style={ov.qaBadge}><Text style={ov.qaBadgeLabel}>{a.badge}</Text></View>}
              </View>
              <Text style={ov.qaLabel}>{a.label}</Text>
            </Pressable>
          ))}
        </View>
      </Card>

      {/* Timeline */}
      <Card>
        <SectionTitle title="Today's bookings" icon="timeline-outline" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-end', height: 52 }}>
            {hours.map(h => {
              const cnt = slotCounts[h] || 0;
              const barH = cnt > 0 ? Math.max(8, (cnt / maxSlot) * 40) : 4;
              const isPending = bookings.some(b => b.date === today && b.time?.startsWith(String(h).padStart(2,'0')) && b.status === 'pending');
              return (
                <View key={h} style={{ alignItems: 'center', gap: 2 }}>
                  <View style={{ width: 18, height: barH, borderRadius: 3, backgroundColor: isPending ? '#F5C518' : cnt > 0 ? '#60C080' : 'rgba(255,255,255,0.1)' }} />
                  <Text style={{ fontSize: 9, color: colors.textOnNavyFaint }}>{h}h</Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </Card>
    </View>
  );
}
const ov = StyleSheet.create({
  qa: { alignItems: 'center', width: 72 },
  qaIcon: { width: 52, height: 52, borderRadius: radius.lg, backgroundColor: 'rgba(55,138,221,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  qaBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#F5C518', borderRadius: 8, paddingHorizontal: 4, paddingVertical: 1 },
  qaBadgeLabel: { fontSize: 10, fontWeight: '800', color: '#000' },
  qaLabel: { fontSize: 11, color: colors.textOnNavy, textAlign: 'center', fontWeight: '600' },
});

// ── Intents tab ───────────────────────────────────────────────────────────────

function IntentsTab({ shop, onUpdateAttrs }) {
  const attrs = shop.attributes || [];
  const [selected, setSelected] = useState([...attrs]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggle(attr) {
    setSelected(prev => prev.includes(attr) ? prev.filter(a => a !== attr) : [...prev, attr]);
  }

  async function save() {
    setSaving(true);
    await onUpdateAttrs(selected);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaving(false);
  }

  // Compute intent scores
  const intentRows = INTENTS.map(intent => {
    const required = intent.attrs;
    const have = required.filter(a => selected.includes(a));
    const missing = required.filter(a => !selected.includes(a));
    const pct = Math.round((have.length / required.length) * 100);
    const qualifies = missing.length === 0;
    return { ...intent, have, missing, pct, qualifies };
  });

  // Sort: not qualifying first (biggest opportunity), then qualifying
  const sorted = [...intentRows].sort((a, b) => a.qualifies === b.qualifies ? b.pct - a.pct : (a.qualifies ? 1 : -1));

  const ringColor = (pct) => pct >= 100 ? '#60C080' : pct >= 60 ? '#F5C518' : '#E05050';

  return (
    <View>
      {/* Scorecard */}
      <Card>
        <SectionTitle title="Intent scorecard" icon="lightning-bolt" />
        <Text style={{ fontSize: 12, color: colors.textOnNavyFaint, marginBottom: spacing.md }}>
          These are the 7 customer intents in the app. Qualify for more to appear in more searches.
        </Text>
        {sorted.map(intent => (
          <View key={intent.key} style={it.row}>
            <Text style={{ fontSize: 20, marginRight: spacing.sm }}>{intent.emoji}</Text>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: intent.qualifies ? '#60C080' : colors.white, flex: 1 }}>{intent.label}</Text>
                <View style={[it.badge, { backgroundColor: intent.qualifies ? 'rgba(96,192,128,0.15)' : 'rgba(224,80,80,0.1)', borderColor: intent.qualifies ? '#60C080' : '#E05050' }]}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: intent.qualifies ? '#60C080' : '#E05050' }}>{intent.qualifies ? '✓ Qualified' : `${intent.pct}%`}</Text>
                </View>
              </View>
              {/* Attribute bar */}
              <View style={{ height: 5, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, marginBottom: 6, overflow: 'hidden' }}>
                <View style={{ height: 5, borderRadius: 3, backgroundColor: ringColor(intent.pct), width: `${intent.pct}%` }} />
              </View>
              <Text style={{ fontSize: 11, color: colors.textOnNavyFaint }}>{intent.description}</Text>
              {intent.missing.length > 0 && (
                <View style={{ marginTop: spacing.xs }}>
                  <Text style={{ fontSize: 11, color: '#F5C518', marginBottom: 4 }}>
                    {intent.missing.length === 1 ? 'Missing 1 attribute:' : `Missing ${intent.missing.length} attributes:`}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                    {intent.missing.map(a => (
                      <Pressable key={a} onPress={() => toggle(a)} style={[it.missingChip, selected.includes(a) && it.missingChipDone]}>
                        <MaterialCommunityIcons name={selected.includes(a) ? 'check' : 'plus'} size={10} color={selected.includes(a) ? '#60C080' : '#F5C518'} />
                        <Text style={{ fontSize: 11, color: selected.includes(a) ? '#60C080' : '#F5C518' }}>{ATTR_LABELS[a] || a}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>
        ))}
      </Card>

      {/* Attribute editor */}
      <Card>
        <SectionTitle title="Your attributes" icon="tag-multiple-outline" />
        <Text style={{ fontSize: 12, color: colors.textOnNavyFaint, marginBottom: spacing.md }}>
          Tap to add or remove. These determine which intents you qualify for.
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.lg }}>
          {ALL_ATTRS.map(a => (
            <Pressable key={a} onPress={() => toggle(a)} style={[it.attrChip, selected.includes(a) && it.attrChipActive]}>
              <Text style={[it.attrChipLabel, selected.includes(a) && { color: colors.white }]}>{ATTR_LABELS[a] || a}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={save} disabled={saving} style={[it.saveBtn, saving && { opacity: 0.6 }]}>
          {saving ? <ActivityIndicator color={colors.white} /> : <Text style={{ fontSize: 14, fontWeight: '700', color: colors.white }}>{saved ? '✓ Saved!' : 'Save attributes'}</Text>}
        </Pressable>
      </Card>

      {/* WiFi & power structured fields */}
      <Card>
        <SectionTitle title="WiFi & workspace details" icon="wifi" />
        <Text style={{ fontSize: 12, color: colors.textOnNavyFaint, marginBottom: spacing.md }}>
          These appear on your customer listing and help remote workers decide to visit.
        </Text>
        <View style={{ gap: spacing.md }}>
          {[
            { label: 'WiFi speed (Mbps)', key: 'wifiSpeed', placeholder: 'e.g. 50' },
            { label: 'Power sockets per area', key: 'powerSockets', placeholder: 'e.g. 8' },
            { label: 'Noise level', key: 'noiseLevel', placeholder: 'Quiet / Moderate / Lively' },
            { label: 'Laptop-friendly hours', key: 'laptopHours', placeholder: 'e.g. 7am–5pm' },
          ].map(f => (
            <View key={f.key}>
              <Text style={{ fontSize: 11, color: colors.textOnNavyFaint, marginBottom: spacing.xs, textTransform: 'uppercase', letterSpacing: 0.4 }}>{f.label}</Text>
              <TextInput
                defaultValue={String(shop[f.key] || '')}
                placeholder={f.placeholder}
                placeholderTextColor={colors.textOnNavyFaint}
                keyboardType={f.key === 'wifiSpeed' || f.key === 'powerSockets' ? 'numeric' : 'default'}
                style={it.input}
              />
            </View>
          ))}
        </View>
        <Text style={{ fontSize: 11, color: colors.textOnNavyFaint, marginTop: spacing.sm, fontStyle: 'italic' }}>Changes save with your profile settings.</Text>
      </Card>
    </View>
  );
}
const it = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(133,183,235,0.12)' },
  badge: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  missingChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: 'rgba(245,197,24,0.4)', borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: 'rgba(245,197,24,0.08)' },
  missingChipDone: { borderColor: 'rgba(96,192,128,0.4)', backgroundColor: 'rgba(96,192,128,0.08)' },
  attrChip: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(133,183,235,0.3)', backgroundColor: 'rgba(255,255,255,0.04)' },
  attrChipActive: { backgroundColor: colors.blue500, borderColor: colors.blue500 },
  attrChipLabel: { fontSize: 12, color: colors.textOnNavy, fontWeight: '600' },
  saveBtn: { backgroundColor: colors.blue500, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  input: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: Platform.OS === 'web' ? spacing.sm : 12, color: colors.white, fontSize: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(133,183,235,0.25)' },
});

// ── Bookings tab (reused pattern from restaurant) ─────────────────────────────

function BookingsTab({ bookings, loading, onStatusChange }) {
  const [view, setView] = useState('list');
  const [expanded, setExpanded] = useState(null);
  const [showDeclineFor, setShowDeclineFor] = useState(null);

  const shown = view === 'pending'
    ? bookings.filter(b => b.status === 'pending')
    : [...bookings].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  function slaColor(createdAt) {
    const m = slaMinutes(createdAt);
    if (m <= 0) return '#E05050';
    if (m < 60) return '#F5C518';
    return '#60C080';
  }

  return (
    <View>
      <View style={{ flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.lg }}>
        {[{ key: 'list', label: 'All' }, { key: 'pending', label: `Pending (${bookings.filter(b => b.status === 'pending').length})` }].map(v => (
          <Pressable key={v.key} onPress={() => setView(v.key)} style={[bk.viewBtn, view === v.key && bk.viewBtnActive]}>
            <Text style={[bk.viewBtnLabel, view === v.key && bk.viewBtnLabelActive]}>{v.label}</Text>
          </Pressable>
        ))}
      </View>
      {loading
        ? <ActivityIndicator color={colors.blue300} style={{ marginTop: 40 }} />
        : shown.length === 0
        ? <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={48} color={colors.blue300} />
            <Text style={{ fontSize: 14, color: colors.textOnNavy, marginTop: spacing.md }}>No bookings</Text>
          </View>
        : shown.map(b => {
            const isExp = expanded === b.id;
            return (
              <Pressable key={b.id} onPress={() => setExpanded(isExp ? null : b.id)} style={bk.card}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: STATUS_COLORS[b.status] || '#888' }} />
                  <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: colors.white }}>{b.guestName || 'Customer'}</Text>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: STATUS_COLORS[b.status] || '#888' }}>{b.status}</Text>
                </View>
                <Text style={{ fontSize: 13, color: colors.textOnNavy }}>{b.partySize || 1} pax · {b.date} at {b.time}</Text>
                {b.status === 'pending' && (
                  <Text style={{ fontSize: 11, fontWeight: '700', marginTop: 2, color: slaColor(b.createdAt) }}>
                    {slaMinutes(b.createdAt) <= 0 ? 'Past SLA' : `${Math.floor(slaMinutes(b.createdAt))}m left`}
                  </Text>
                )}
                {isExp && (
                  <View style={{ marginTop: spacing.sm, gap: spacing.xs }}>
                    {b.guestPhone && (
                      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                        <Pressable onPress={() => Linking.openURL(`tel:${b.guestPhone}`)} style={bk.callBtn}>
                          <MaterialCommunityIcons name="phone" size={14} color="#60C080" />
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#60C080' }}>Call</Text>
                        </Pressable>
                        <Pressable onPress={() => Linking.openURL(`https://wa.me/${b.guestPhone?.replace(/\s/g,'')}?text=Hello`)} style={bk.callBtn}>
                          <MaterialCommunityIcons name="whatsapp" size={14} color="#25D366" />
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#25D366' }}>WhatsApp</Text>
                        </Pressable>
                      </View>
                    )}
                    {b.notes ? <Text style={{ fontSize: 12, color: colors.textOnNavyFaint, fontStyle: 'italic' }}>"{b.notes}"</Text> : null}
                    {b.noshowCount > 0 && <Text style={{ fontSize: 12, color: '#E07030' }}>⚠️ {b.noshowCount} prior no-show{b.noshowCount > 1 ? 's' : ''}</Text>}
                    {b.status === 'pending' && (
                      <View style={{ gap: spacing.xs }}>
                        <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                          <Pressable onPress={() => { onStatusChange(b.id, 'confirmed'); setExpanded(null); }} style={[bk.actionBtn, { flex: 1, borderColor: '#60C080', backgroundColor: 'rgba(60,160,80,0.15)' }]}>
                            <MaterialCommunityIcons name="check" size={14} color="#60C080" />
                            <Text style={{ fontSize: 12, fontWeight: '700', color: '#60C080' }}>Confirm</Text>
                          </Pressable>
                          <Pressable onPress={() => setShowDeclineFor(showDeclineFor === b.id ? null : b.id)} style={[bk.actionBtn, { flex: 1, borderColor: '#E05050', backgroundColor: 'rgba(224,80,80,0.15)' }]}>
                            <MaterialCommunityIcons name="close" size={14} color="#E05050" />
                            <Text style={{ fontSize: 12, fontWeight: '700', color: '#E05050' }}>Decline</Text>
                          </Pressable>
                        </View>
                        {showDeclineFor === b.id && (
                          <View style={{ gap: spacing.xs }}>
                            {DECLINE_REASONS.map(r => (
                              <Pressable key={r} onPress={() => { onStatusChange(b.id, 'rejected', r); setShowDeclineFor(null); setExpanded(null); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 5 }}>
                                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#E05050' }} />
                                <Text style={{ fontSize: 13, color: colors.white }}>{r}</Text>
                              </Pressable>
                            ))}
                          </View>
                        )}
                      </View>
                    )}
                    {b.status === 'confirmed' && (
                      <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                        <Pressable onPress={() => { onStatusChange(b.id, 'completed'); setExpanded(null); }} style={[bk.actionBtn, { flex: 1, borderColor: '#60C080', backgroundColor: 'rgba(60,160,80,0.1)' }]}>
                          <MaterialCommunityIcons name="check-all" size={14} color="#60C080" />
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#60C080' }}>Completed</Text>
                        </Pressable>
                        <Pressable onPress={() => { onStatusChange(b.id, 'noshow'); setExpanded(null); }} style={[bk.actionBtn, { flex: 1, borderColor: '#E07030', backgroundColor: 'rgba(224,112,48,0.1)' }]}>
                          <MaterialCommunityIcons name="account-off-outline" size={14} color="#E07030" />
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#E07030' }}>No-Show</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                )}
              </Pressable>
            );
          })}
    </View>
  );
}
const bk = StyleSheet.create({
  viewBtn: { borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(133,183,235,0.3)' },
  viewBtnActive: { backgroundColor: colors.blue500, borderColor: colors.blue500 },
  viewBtnLabel: { fontSize: 13, color: colors.textOnNavy, fontWeight: '600' },
  viewBtnLabelActive: { color: colors.white },
  card: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(133,183,235,0.15)' },
  callBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: 'rgba(133,183,235,0.2)', borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 6 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, borderRadius: radius.sm, borderWidth: 1 },
});

// ── Orders tab ────────────────────────────────────────────────────────────────

function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [prepFor, setPrepFor] = useState(null);

  useEffect(() => {
    apiFetch('/my-coffeeshop/orders').then(d => setOrders(Array.isArray(d) ? d : [])).catch(() => setOrders([])).finally(() => setLoading(false));
  }, []);

  function advance(id, toStage, prepMins) {
    apiFetch(`/my-coffeeshop/orders/${id}/status`, { method: 'PUT', body: { status: toStage, prepMinutes: prepMins } })
      .then(() => { setOrders(prev => prev.map(o => o.id === id ? { ...o, status: toStage } : o)); setPrepFor(null); })
      .catch(() => Alert.alert('Error', 'Could not update order'));
  }

  if (loading) return <ActivityIndicator color={colors.blue300} style={{ marginTop: 60 }} />;
  if (orders.length === 0) return <ComingSoon icon="moped-outline" title="No orders yet" sub="Takeaway and delivery orders will appear here in a live pipeline." />;

  const staged = {};
  ORDER_STAGES.forEach(s => { staged[s] = orders.filter(o => o.status === s); });

  return (
    <View>
      {ORDER_STAGES.filter(s => s !== 'cancelled' || staged[s].length > 0).map(stage => (
        staged[stage].length > 0 && (
          <View key={stage} style={{ marginBottom: spacing.lg }}>
            <SectionTitle title={ORDER_STAGE_LABELS[stage]} icon={stage === 'new' ? 'bell-ring-outline' : 'arrow-right-circle-outline'} />
            {staged[stage].map(o => (
              <View key={o.id} style={ord.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: colors.blue300 }}># {o.code || o.id?.slice(-5)}</Text>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#60C080' }}>{fmtRwf(o.total)}</Text>
                </View>
                {(o.items || []).map((it, i) => <Text key={i} style={{ fontSize: 12, color: colors.textOnNavy }}>· {it.name}{it.qty > 1 ? ` ×${it.qty}` : ''}</Text>)}
                {o.customerPhone && <Text style={{ fontSize: 12, color: colors.blue300, marginTop: spacing.xs }}>📞 {o.customerPhone}</Text>}
                {stage === 'new' && (
                  prepFor === o.id ? (
                    <View style={{ gap: 6, marginTop: spacing.sm }}>
                      <Text style={{ fontSize: 11, color: colors.textOnNavyFaint }}>Prep time:</Text>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        {PREP_TIMES.map(t => (
                          <Pressable key={t} onPress={() => advance(o.id, 'accepted', t)} style={[ord.btn, { borderColor: '#60C080', backgroundColor: 'rgba(96,192,128,0.15)' }]}>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: '#60C080' }}>{t}m</Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm }}>
                      <Pressable onPress={() => setPrepFor(o.id)} style={[ord.btn, { borderColor: '#60C080', backgroundColor: 'rgba(60,160,80,0.15)' }]}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#60C080' }}>Accept</Text>
                      </Pressable>
                      <Pressable onPress={() => advance(o.id, 'cancelled')} style={[ord.btn, { borderColor: '#E05050', backgroundColor: 'rgba(224,80,80,0.15)' }]}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#E05050' }}>Reject</Text>
                      </Pressable>
                    </View>
                  )
                )}
                {stage === 'accepted' && <Pressable onPress={() => advance(o.id, 'preparing')} style={[ord.btn, { borderColor: '#F5A623', backgroundColor: 'rgba(245,166,35,0.15)', marginTop: spacing.sm }]}><Text style={{ fontSize: 12, fontWeight: '700', color: '#F5A623' }}>Start preparing →</Text></Pressable>}
                {stage === 'preparing' && <Pressable onPress={() => advance(o.id, 'ready')} style={[ord.btn, { borderColor: '#25D366', backgroundColor: 'rgba(37,211,102,0.15)', marginTop: spacing.sm }]}><Text style={{ fontSize: 12, fontWeight: '700', color: '#25D366' }}>Mark ready →</Text></Pressable>}
                {stage === 'ready' && <Pressable onPress={() => advance(o.id, 'delivered')} style={[ord.btn, { borderColor: '#60C080', backgroundColor: 'rgba(60,160,80,0.15)', marginTop: spacing.sm }]}><Text style={{ fontSize: 12, fontWeight: '700', color: '#60C080' }}>Mark delivered →</Text></Pressable>}
              </View>
            ))}
          </View>
        )
      ))}
    </View>
  );
}
const ord = StyleSheet.create({
  card: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(133,183,235,0.15)' },
  btn: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.sm, borderWidth: 1 },
});

// ── Menu tab ──────────────────────────────────────────────────────────────────

function MenuTab({ menuItems, loading, onSave, onDelete }) {
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ category: 'Espresso drinks', name: '', description: '', price: '', available: true, photoUrl: '', brewMethod: '', origin: '' });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    await onSave(editId, form);
    setEditId(null);
    setForm({ category: 'Espresso drinks', name: '', description: '', price: '', available: true, photoUrl: '', brewMethod: '', origin: '' });
    setSaving(false);
  }

  const grouped = {};
  menuItems.forEach(item => {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  });

  return (
    <View>
      {/* Form */}
      <Card>
        <SectionTitle title={editId ? 'Edit item' : 'Add a menu item'} icon="coffee-outline" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.sm }}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {MENU_CATEGORIES_CS.map(cat => (
              <Pressable key={cat} onPress={() => setForm(f => ({ ...f, category: cat }))} style={[it.attrChip, form.category === cat && it.attrChipActive]}>
                <Text style={[it.attrChipLabel, form.category === cat && { color: colors.white }]}>{cat}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
        <TextInput style={[it.input, { marginBottom: spacing.sm }]} value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))} placeholder="Item name *" placeholderTextColor={colors.textOnNavyFaint} />
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm }}>
          <TextInput style={[it.input, { flex: 1 }]} value={String(form.price)} onChangeText={v => setForm(f => ({ ...f, price: v }))} placeholder="Price (RWF)" placeholderTextColor={colors.textOnNavyFaint} keyboardType="numeric" />
          <TextInput style={[it.input, { flex: 1 }]} value={form.brewMethod} onChangeText={v => setForm(f => ({ ...f, brewMethod: v }))} placeholder="Brew method (optional)" placeholderTextColor={colors.textOnNavyFaint} />
        </View>
        <TextInput style={[it.input, { marginBottom: spacing.sm }]} value={form.origin} onChangeText={v => setForm(f => ({ ...f, origin: v }))} placeholder="Origin (e.g. Rwanda, Ethiopia)" placeholderTextColor={colors.textOnNavyFaint} />
        <TextInput style={[it.input, { minHeight: 60, textAlignVertical: 'top', marginBottom: spacing.sm }]} value={form.description} onChangeText={v => setForm(f => ({ ...f, description: v }))} placeholder="Description (optional)" placeholderTextColor={colors.textOnNavyFaint} multiline />
        <View style={{ flexDirection: 'row', gap: spacing.xs }}>
          <Pressable onPress={handleSave} disabled={saving || !form.name.trim()} style={[it.saveBtn, (saving || !form.name.trim()) && { opacity: 0.5 }]}>
            {saving ? <ActivityIndicator color={colors.white} /> : <Text style={{ fontSize: 14, fontWeight: '700', color: colors.white }}>{editId ? 'Save' : 'Add item'}</Text>}
          </Pressable>
          {editId && (
            <Pressable onPress={() => { setEditId(null); setForm({ category: 'Espresso drinks', name: '', description: '', price: '', available: true, photoUrl: '', brewMethod: '', origin: '' }); }} style={{ borderRadius: radius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(133,183,235,0.3)' }}>
              <Text style={{ fontSize: 14, color: colors.textOnNavy }}>Cancel</Text>
            </Pressable>
          )}
        </View>
      </Card>

      {/* List */}
      {loading
        ? <ActivityIndicator color={colors.blue300} style={{ marginTop: 20 }} />
        : Object.entries(grouped).map(([cat, items]) => (
          <View key={cat} style={{ marginBottom: spacing.lg }}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: colors.blue300, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.sm, paddingBottom: spacing.xs, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(133,183,235,0.2)' }}>{cat}</Text>
            {items.map(item => (
              <View key={item.id} style={[bk.card, { flexDirection: 'row', alignItems: 'center', gap: 4 }, !item.available && { opacity: 0.45 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.white }}>{item.name}</Text>
                  {item.brewMethod && <Text style={{ fontSize: 11, color: colors.blue300 }}>{item.brewMethod}{item.origin ? ` · ${item.origin}` : ''}</Text>}
                  {item.description ? <Text style={{ fontSize: 11, color: colors.textOnNavyFaint }}>{item.description}</Text> : null}
                </View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#60C080', marginRight: 4 }}>{Number(item.price).toLocaleString()} RWF</Text>
                <Pressable onPress={() => { setEditId(item.id); setForm({ category: item.category, name: item.name, description: item.description || '', price: String(item.price), available: item.available !== false, photoUrl: item.photo_url || '', brewMethod: item.brewMethod || '', origin: item.origin || '' }); }} style={{ padding: 8 }}>
                  <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.blue300} />
                </Pressable>
                <Pressable onPress={() => onDelete(item.id)} style={{ padding: 8 }}>
                  <MaterialCommunityIcons name="delete-outline" size={16} color="#e05c5c" />
                </Pressable>
              </View>
            ))}
          </View>
        ))}
    </View>
  );
}

// ── Insights tab ──────────────────────────────────────────────────────────────

function InsightsTab({ bookings, shop }) {
  const total = bookings.length;
  const confirmed = bookings.filter(b => ['confirmed','completed'].includes(b.status)).length;
  const noshow = bookings.filter(b => b.status === 'noshow').length;
  const responseRate = total > 0 ? Math.round(bookings.filter(b => b.respondedAt && b.createdAt && (new Date(b.respondedAt) - new Date(b.createdAt)) < 7200000).length / total * 100) : 0;

  const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const HOURS = [7,8,9,10,11,12,13,14,15,16,17,18,19,20];
  const heat = {};
  DOW.forEach(d => { heat[d] = {}; HOURS.forEach(h => { heat[d][h] = 0; }); });
  bookings.forEach(b => {
    if (!b.date || !b.time) return;
    const dow = DOW[new Date(b.date).getDay()];
    const h = parseInt(b.time.split(':')[0], 10);
    if (heat[dow] && heat[dow][h] !== undefined) heat[dow][h]++;
  });
  const byDow = DOW.map(d => ({ day: d, total: HOURS.reduce((s, h) => s + heat[d][h], 0) })).sort((a, b) => b.total - a.total);
  const maxDow = byDow[0]?.total || 1;

  // Intent coverage for this shop
  const attrs = shop?.attributes || [];
  const intentCoverage = INTENTS.map(intent => {
    const pct = Math.round(intent.attrs.filter(a => attrs.includes(a)).length / intent.attrs.length * 100);
    return { ...intent, pct, qualifies: pct === 100 };
  });

  return (
    <View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg }}>
        <KpiTile label="Total requests" value={total} color={colors.blue300} icon="calendar-multiple" />
        <KpiTile label="Confirmed" value={confirmed} color="#60C080" icon="check-circle-outline" />
        <KpiTile label="Intents qualified" value={intentCoverage.filter(i => i.qualifies).length} sub={`of ${INTENTS.length}`} color="#25D366" icon="lightning-bolt" />
        <KpiTile label="Response rate" value={`${responseRate}%`} color={responseRate >= 80 ? '#60C080' : '#F5C518'} icon="clock-check-outline" />
      </View>

      <Card>
        <SectionTitle title="Busiest days" icon="calendar-week" />
        {byDow.map(({ day, total: t }) => (
          <View key={day} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs, gap: spacing.sm }}>
            <Text style={{ width: 36, fontSize: 12, color: colors.textOnNavy }}>{day}</Text>
            <View style={{ flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
              <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.blue500, width: `${maxDow > 0 ? (t / maxDow) * 100 : 0}%` }} />
            </View>
            <Text style={{ width: 20, fontSize: 11, color: colors.textOnNavyFaint, textAlign: 'right' }}>{t}</Text>
          </View>
        ))}
      </Card>

      <Card>
        <SectionTitle title="Intent coverage" icon="lightning-bolt-outline" />
        {intentCoverage.map(i => (
          <View key={i.key} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: spacing.sm }}>
            <Text style={{ fontSize: 16 }}>{i.emoji}</Text>
            <Text style={{ flex: 1, fontSize: 12, color: colors.textOnNavy }}>{i.label}</Text>
            <View style={{ width: 60, height: 5, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
              <View style={{ height: 5, borderRadius: 3, backgroundColor: i.qualifies ? '#60C080' : '#F5C518', width: `${i.pct}%` }} />
            </View>
            <Text style={{ fontSize: 11, fontWeight: '700', color: i.qualifies ? '#60C080' : '#F5C518', width: 30, textAlign: 'right' }}>{i.pct}%</Text>
          </View>
        ))}
      </Card>
    </View>
  );
}

// ── Reviews tab ───────────────────────────────────────────────────────────────

function ReviewsTab() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState({});
  const [replying, setReplying] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch('/my-coffeeshop/reviews').then(d => setReviews(Array.isArray(d) ? d : [])).catch(() => setReviews([])).finally(() => setLoading(false));
  }, []);

  async function submitReply(id) {
    const text = replyText[id]?.trim();
    if (!text) return;
    setSaving(true);
    try {
      await apiFetch(`/my-coffeeshop/reviews/${id}/reply`, { method: 'POST', body: { reply: text } });
      setReviews(prev => prev.map(r => r.id === id ? { ...r, ownerReply: text } : r));
      setReplyText(p => ({ ...p, [id]: '' }));
      setReplying(null);
    } catch { Alert.alert('Error', 'Could not save reply'); }
    setSaving(false);
  }

  if (loading) return <ActivityIndicator color={colors.blue300} style={{ marginTop: 60 }} />;
  if (reviews.length === 0) return <ComingSoon icon="star-outline" title="No reviews yet" sub="Customer reviews from verified visits appear here." />;

  const avg = (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1);

  return (
    <View>
      <Card>
        <Text style={{ fontSize: 36, fontWeight: '800', color: colors.white }}>{avg}</Text>
        <Text style={{ fontSize: 12, color: colors.textOnNavyFaint, marginTop: 2 }}>{reviews.length} verified reviews</Text>
      </Card>
      {reviews.map(r => (
        <View key={r.id} style={bk.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.white }}>{r.guestName || 'Guest'}</Text>
            <Text style={{ fontSize: 14, color: '#F5C518' }}>{'★'.repeat(Math.round(r.rating || 0))}</Text>
          </View>
          <Text style={{ fontSize: 12, color: colors.textOnNavy, marginBottom: spacing.sm }}>{r.text || 'No comment'}</Text>
          {r.ownerReply ? (
            <View style={{ backgroundColor: 'rgba(55,138,221,0.1)', borderRadius: radius.sm, padding: spacing.sm, borderLeftWidth: 3, borderLeftColor: colors.blue300 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.blue300, marginBottom: 2 }}>Your reply</Text>
              <Text style={{ fontSize: 12, color: colors.textOnNavy }}>{r.ownerReply}</Text>
            </View>
          ) : replying === r.id ? (
            <View style={{ gap: spacing.xs }}>
              <TextInput value={replyText[r.id] || ''} onChangeText={v => setReplyText(p => ({ ...p, [r.id]: v }))} multiline placeholder="Write your reply…" placeholderTextColor={colors.textOnNavyFaint} style={[it.input, { minHeight: 60, textAlignVertical: 'top' }]} />
              <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                <Pressable onPress={() => submitReply(r.id)} disabled={saving} style={[it.saveBtn, { flex: 1, paddingVertical: spacing.sm }]}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: colors.white }}>Post reply</Text>
                </Pressable>
                <Pressable onPress={() => setReplying(null)} style={{ borderRadius: radius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderWidth: 1, borderColor: 'rgba(133,183,235,0.3)', alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, color: colors.textOnNavy }}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable onPress={() => setReplying(r.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <MaterialCommunityIcons name="reply-outline" size={14} color={colors.blue300} />
              <Text style={{ fontSize: 12, color: colors.blue300 }}>Reply publicly</Text>
            </Pressable>
          )}
        </View>
      ))}
    </View>
  );
}

// ── Finance tab ───────────────────────────────────────────────────────────────

function FinanceTab({ bookings }) {
  const MONTHS = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    const val = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    return { val, label: d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) };
  });
  const [period, setPeriod] = useState(MONTHS[0].val);
  const [y, m] = period.split('-').map(Number);
  const start = new Date(y, m-1, 1).getTime();
  const end = new Date(y, m, 0, 23, 59, 59).getTime();
  const periodBks = bookings.filter(b => {
    const t = new Date(b.createdAt || 0).getTime();
    return t >= start && t <= end && ['confirmed','completed'].includes(b.status);
  });
  const gross = periodBks.reduce((s, b) => s + (b.amount || 0), 0);
  const commission = Math.round(gross * 0.10);
  const net = gross - commission;
  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.lg }}>
        <View style={{ flexDirection: 'row', gap: spacing.xs }}>
          {MONTHS.map(mo => (
            <Pressable key={mo.val} onPress={() => setPeriod(mo.val)} style={[bk.viewBtn, period === mo.val && bk.viewBtnActive]}>
              <Text style={[bk.viewBtnLabel, period === mo.val && bk.viewBtnLabelActive]}>{mo.label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg }}>
        <KpiTile label="Gross revenue" value={fmtRwf(gross)} color="#60C080" icon="cash-plus" />
        <KpiTile label="Platform fee" value={fmtRwf(commission)} color="#E05050" icon="percent" />
        <KpiTile label="Net payout" value={fmtRwf(net)} color={colors.blue300} icon="bank-outline" />
      </View>
      <Card>
        <SectionTitle title="Confirmed orders" icon="receipt" />
        {periodBks.length === 0
          ? <Text style={{ fontSize: 12, color: colors.textOnNavyFaint }}>No confirmed bookings this period</Text>
          : periodBks.slice(0, 10).map(b => (
            <View key={b.id} style={{ flexDirection: 'row', paddingVertical: spacing.xs, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(133,183,235,0.08)' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, color: colors.white }}>{b.guestName || 'Customer'}</Text>
                <Text style={{ fontSize: 11, color: colors.textOnNavyFaint }}>{b.date}</Text>
              </View>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#60C080' }}>{fmtRwf(b.amount || 0)}</Text>
            </View>
          ))}
      </Card>
    </View>
  );
}

// ── Reports tab ───────────────────────────────────────────────────────────────

function ReportsTab({ bookings, menuItems }) {
  function exportCsv(rows, cols, filename) {
    if (Platform.OS !== 'web') { Alert.alert('Export', 'CSV export is available on the web app.'); return; }
    const header = cols.map(c => c.label).join(',');
    const body = rows.map(r => cols.map(c => JSON.stringify(r[c.key] ?? '')).join(',')).join('\n');
    const blob = new Blob([header + '\n' + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${filename}.csv`; a.click();
    URL.revokeObjectURL(url);
  }
  const bookingCols = [{ key: 'guestName', label: 'Guest' },{ key: 'date', label: 'Date' },{ key: 'time', label: 'Time' },{ key: 'partySize', label: 'Party Size' },{ key: 'status', label: 'Status' },{ key: 'amount', label: 'Amount (RWF)' }];
  const menuCols = [{ key: 'category', label: 'Category' },{ key: 'name', label: 'Item' },{ key: 'price', label: 'Price (RWF)' },{ key: 'brewMethod', label: 'Brew Method' },{ key: 'origin', label: 'Origin' },{ key: 'available', label: 'Available' }];
  return (
    <View>
      {[
        { title: 'Bookings Register', desc: `${bookings.length} bookings`, rows: bookings, cols: bookingCols, filename: 'bookings' },
        { title: 'Pending Bookings', desc: `${bookings.filter(b => b.status === 'pending').length} pending`, rows: bookings.filter(b => b.status === 'pending'), cols: bookingCols, filename: 'pending-bookings' },
        { title: 'Confirmed Bookings', desc: `${bookings.filter(b => ['confirmed','completed'].includes(b.status)).length} confirmed`, rows: bookings.filter(b => ['confirmed','completed'].includes(b.status)), cols: bookingCols, filename: 'confirmed-bookings' },
        { title: 'Menu / Catalogue', desc: `${menuItems.length} items`, rows: menuItems, cols: menuCols, filename: 'menu' },
      ].map(r => (
        <Card key={r.title} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.white }}>{r.title}</Text>
            <Text style={{ fontSize: 12, color: colors.textOnNavyFaint, marginTop: 2 }}>{r.desc}</Text>
          </View>
          <Pressable onPress={() => exportCsv(r.rows, r.cols, r.filename)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: 'rgba(133,183,235,0.3)', borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 7 }}>
            <MaterialCommunityIcons name="download-outline" size={14} color={colors.blue300} />
            <Text style={{ fontSize: 12, color: colors.blue300, fontWeight: '600' }}>CSV</Text>
          </Pressable>
        </Card>
      ))}
    </View>
  );
}

// ── Settings tab ──────────────────────────────────────────────────────────────

function SettingsTab({ shop, onSave }) {
  const [form, setForm] = useState({
    name: shop?.name || '', description: shop?.description || '',
    location: shop?.location || '', district: shop?.district || '',
    phone: shop?.phone || '', website: shop?.website || '',
    openStatus: shop?.openStatus || 'Open now', openHours: shop?.openHours || '',
    wifiSpeed: String(shop?.wifiSpeed || ''), powerSockets: String(shop?.powerSockets || ''),
    noiseLevel: shop?.noiseLevel || '', laptopHours: shop?.laptopHours || '',
    deliveryZones: shop?.deliveryZones || '', minOrder: String(shop?.minOrder || ''),
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    await onSave(form);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
    setSaving(false);
  }

  return (
    <View>
      {[
        { key: 'name', label: 'Coffee Shop Name *' },
        { key: 'description', label: 'Description', multi: true },
        { key: 'location', label: 'Location' },
        { key: 'district', label: 'District' },
        { key: 'phone', label: 'Phone' },
        { key: 'website', label: 'Website' },
        { key: 'openStatus', label: 'Open Status' },
        { key: 'openHours', label: 'Opening Hours', multi: true },
        { key: 'wifiSpeed', label: 'WiFi Speed (Mbps)' },
        { key: 'powerSockets', label: 'Power sockets per area' },
        { key: 'noiseLevel', label: 'Noise level (Quiet / Moderate / Lively)' },
        { key: 'laptopHours', label: 'Laptop-friendly hours' },
        { key: 'deliveryZones', label: 'Delivery zones' },
        { key: 'minOrder', label: 'Min. order (RWF)' },
      ].map(f => (
        <View key={f.key} style={{ marginBottom: spacing.lg }}>
          <Text style={{ fontSize: 11.5, fontWeight: '700', color: colors.textOnNavyFaint, marginBottom: spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 }}>{f.label}</Text>
          <TextInput style={[it.input, f.multi && { minHeight: 70, textAlignVertical: 'top' }]} value={form[f.key]} onChangeText={v => setForm(p => ({ ...p, [f.key]: v }))} placeholderTextColor={colors.textOnNavyFaint} multiline={!!f.multi} />
        </View>
      ))}
      <Pressable onPress={save} disabled={saving} style={[it.saveBtn, saving && { opacity: 0.6 }]}>
        {saving ? <ActivityIndicator color={colors.white} /> : <Text style={{ fontSize: 15, fontWeight: '700', color: colors.white }}>{saved ? 'Saved!' : 'Save Settings'}</Text>}
      </Pressable>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function CoffeeShopOwnerDashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const { width: screenWidth } = useWindowDimensions();
  const isWide = screenWidth >= 768;

  const [section, setSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [shop, setShop] = useState(null);
  const [shopLoading, setShopLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [busyLevel, setBusyLevel] = useState(null);
  const busyTimer = React.useRef(null);

  const pendingCount = bookings.filter(b => b.status === 'pending').length;

  const loadShop = useCallback(async () => {
    setShopLoading(true);
    try { const d = await apiFetch('/my-coffeeshop'); setShop(d); } catch {}
    setShopLoading(false);
  }, []);

  const loadBookings = useCallback(async () => {
    setBookingsLoading(true);
    try { const d = await apiFetch('/my-coffeeshop/bookings'); setBookings(Array.isArray(d) ? d : []); } catch {}
    setBookingsLoading(false);
  }, []);

  const loadMenu = useCallback(async () => {
    setMenuLoading(true);
    try { const d = await apiFetch('/my-coffeeshop/menu'); setMenuItems(Array.isArray(d) ? d : []); } catch {}
    setMenuLoading(false);
  }, []);

  useEffect(() => { loadShop(); loadBookings(); loadMenu(); }, [loadShop, loadBookings, loadMenu]);

  function handleBusy(level) {
    setBusyLevel(level);
    if (busyTimer.current) clearTimeout(busyTimer.current);
    busyTimer.current = setTimeout(() => setBusyLevel(null), 2 * 60 * 60 * 1000); // 2h auto-expire
    apiFetch('/my-coffeeshop/busy', { method: 'PUT', body: { busy: level } }).catch(() => {});
  }

  async function handleBookingStatus(id, status, reason) {
    try {
      await apiFetch(`/my-coffeeshop/bookings/${id}/status`, { method: 'PUT', body: { status, reason } });
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    } catch { Alert.alert('Error', 'Could not update booking.'); }
  }

  async function handleMenuSave(editId, form) {
    const body = { category: form.category, name: form.name.trim(), description: form.description || '', price: parseInt(form.price, 10) || 0, available: form.available !== false, brewMethod: form.brewMethod || '', origin: form.origin || '' };
    if (editId) { await apiFetch(`/my-coffeeshop/menu/${editId}`, { method: 'PUT', body }); }
    else { await apiFetch('/my-coffeeshop/menu', { method: 'POST', body }); }
    await loadMenu();
  }

  async function handleMenuDelete(id) {
    try { await apiFetch(`/my-coffeeshop/menu/${id}`, { method: 'DELETE' }); setMenuItems(prev => prev.filter(m => m.id !== id)); } catch { Alert.alert('Error', 'Could not delete item.'); }
  }

  async function handleProfileSave(form) {
    try { const d = await apiFetch('/my-coffeeshop', { method: 'PUT', body: form }); setShop(d); } catch { Alert.alert('Error', 'Could not save profile.'); }
  }

  async function handleUpdateAttrs(attrs) {
    try {
      const d = await apiFetch('/my-coffeeshop', { method: 'PUT', body: { attributes: attrs } });
      setShop(d);
    } catch { Alert.alert('Error', 'Could not save attributes.'); }
  }

  const topbarTitles = { overview: 'Overview', bookings: 'Bookings', orders: 'Orders', menu: 'Menu', intents: 'Intents', insights: 'Insights', reviews: 'Reviews', finance: 'Finance', reports: 'Reports', settings: 'Settings' };

  if (shopLoading) return <GradientBackground><View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.blue300} size="large" /></View></GradientBackground>;

  if (!shop) {
    return (
      <GradientBackground>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: gutter }}>
          <MaterialCommunityIcons name="coffee-outline" size={52} color={colors.blue300} />
          <Text style={{ color: colors.white, fontSize: 18, fontWeight: '700', marginTop: spacing.lg, textAlign: 'center' }}>No coffee shop linked</Text>
          <Text style={{ color: colors.textOnNavy, fontSize: 13.5, marginTop: spacing.sm, textAlign: 'center' }}>Contact the director to link your account.</Text>
          <Pressable onPress={() => navigation.goBack()} style={{ marginTop: spacing.xl }}><Text style={{ color: colors.blue300, fontWeight: '600' }}>← Go back</Text></Pressable>
        </View>
      </GradientBackground>
    );
  }

  const sidebar = (
    <View style={s.sidebar}>
      <View style={s.sidebarBrand}>
        <MaterialCommunityIcons name="coffee-outline" size={18} color={colors.blue300} />
        <Text style={s.sidebarTitle} numberOfLines={1}>{shop.name}</Text>
        <Pressable onPress={() => setSidebarOpen(false)} style={{ padding: 4 }}>
          <MaterialCommunityIcons name="close" size={16} color={colors.textOnNavyFaint} />
        </Pressable>
      </View>
      {NAV_ITEMS.map(item => (
        <Pressable key={item.key} onPress={() => { setSection(item.key); setSidebarOpen(false); }} style={[s.navItem, section === item.key && s.navItemActive]}>
          <MaterialCommunityIcons name={item.icon} size={18} color={section === item.key ? colors.white : colors.blue300} />
          <Text style={[s.navLabel, section === item.key && s.navLabelActive]}>{item.label}</Text>
          {item.key === 'bookings' && pendingCount > 0 && (
            <View style={s.navBadge}><Text style={s.navBadgeLabel}>{pendingCount}</Text></View>
          )}
          {item.key === 'intents' && (
            <View style={[s.navBadge, { backgroundColor: '#25D366' }]}>
              <Text style={s.navBadgeLabel}>★</Text>
            </View>
          )}
        </Pressable>
      ))}
      <View style={s.sidebarDivider} />
      <Pressable onPress={() => navigation.goBack()} style={s.navItem}>
        <MaterialCommunityIcons name="arrow-left" size={18} color={colors.textOnNavyFaint} />
        <Text style={[s.navLabel, { color: colors.textOnNavyFaint }]}>Back</Text>
      </Pressable>
    </View>
  );

  const content = (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.main, { paddingBottom: insets.bottom + 80 }]}>
      {section === 'overview' && <OverviewTab shop={shop} bookings={bookings} menuItems={menuItems} busyLevel={busyLevel} onBusy={handleBusy} onNav={key => { setSection(key); setSidebarOpen(false); }} />}
      {section === 'bookings' && <BookingsTab bookings={bookings} loading={bookingsLoading} onStatusChange={handleBookingStatus} />}
      {section === 'orders' && <OrdersTab />}
      {section === 'menu' && <MenuTab menuItems={menuItems} loading={menuLoading} onSave={handleMenuSave} onDelete={handleMenuDelete} />}
      {section === 'intents' && <IntentsTab shop={shop} onUpdateAttrs={handleUpdateAttrs} />}
      {section === 'insights' && <InsightsTab bookings={bookings} shop={shop} />}
      {section === 'reviews' && <ReviewsTab />}
      {section === 'finance' && <FinanceTab bookings={bookings} />}
      {section === 'reports' && <ReportsTab bookings={bookings} menuItems={menuItems} />}
      {section === 'settings' && <SettingsTab shop={shop} onSave={handleProfileSave} />}
    </ScrollView>
  );

  return (
    <GradientBackground>
      <View style={[s.root, { paddingTop: insets.top }]}>
        <View style={s.topbar}>
          {!isWide && (
            <Pressable onPress={() => setSidebarOpen(o => !o)} style={s.menuBtn}>
              <MaterialCommunityIcons name="menu" size={22} color={colors.white} />
              {pendingCount > 0 && <View style={s.menuBtnBadge} />}
            </Pressable>
          )}
          <Text style={s.topbarTitle}>{topbarTitles[section] || ''}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <MaterialCommunityIcons name="coffee-outline" size={14} color={colors.blue300} />
            <Text style={{ fontSize: 12, color: colors.blue300, fontWeight: '600', maxWidth: 120 }} numberOfLines={1}>{shop.name}</Text>
          </View>
        </View>

        {isWide ? (
          <View style={{ flex: 1, flexDirection: 'row' }}>
            <ScrollView style={{ width: 230, borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: 'rgba(133,183,235,0.2)' }} contentContainerStyle={{ paddingTop: spacing.sm, paddingBottom: 80 }}>
              {NAV_ITEMS.map(item => (
                <Pressable key={item.key} onPress={() => setSection(item.key)} style={[s.navItem, section === item.key && s.navItemActive]}>
                  <MaterialCommunityIcons name={item.icon} size={18} color={section === item.key ? colors.white : colors.blue300} />
                  <Text style={[s.navLabel, section === item.key && s.navLabelActive]}>{item.label}</Text>
                  {item.key === 'bookings' && pendingCount > 0 && (
                    <View style={s.navBadge}><Text style={s.navBadgeLabel}>{pendingCount}</Text></View>
                  )}
                  {item.key === 'intents' && (
                    <View style={[s.navBadge, { backgroundColor: '#25D366' }]}>
                      <Text style={s.navBadgeLabel}>★</Text>
                    </View>
                  )}
                </Pressable>
              ))}
              <View style={s.sidebarDivider} />
              <Pressable onPress={() => navigation.goBack()} style={s.navItem}>
                <MaterialCommunityIcons name="arrow-left" size={18} color={colors.textOnNavyFaint} />
                <Text style={[s.navLabel, { color: colors.textOnNavyFaint }]}>Back</Text>
              </Pressable>
            </ScrollView>
            <View style={{ flex: 1 }}>{content}</View>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            {sidebarOpen && <Pressable style={s.backdrop} onPress={() => setSidebarOpen(false)} />}
            {sidebarOpen && sidebar}
            {content}
          </View>
        )}
      </View>
    </GradientBackground>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  topbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: gutter, paddingBottom: spacing.sm, gap: spacing.sm },
  menuBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  menuBtnBadge: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: '#F5C518' },
  topbarTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: colors.white },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9, backgroundColor: 'rgba(0,0,0,0.5)' },
  sidebar: { position: 'absolute', top: 0, left: 0, bottom: 0, zIndex: 10, width: 230, backgroundColor: '#021e3a', borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: 'rgba(133,183,235,0.2)', paddingTop: spacing.lg, paddingBottom: 80 },
  sidebarBrand: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, marginBottom: spacing.lg, gap: spacing.sm },
  sidebarTitle: { flex: 1, fontSize: 14, fontWeight: '800', color: colors.white },
  sidebarDivider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(133,183,235,0.15)', marginVertical: spacing.sm, marginHorizontal: spacing.md },
  navItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2, gap: spacing.sm, borderRadius: radius.md, marginHorizontal: spacing.xs, marginBottom: 2 },
  navItemActive: { backgroundColor: 'rgba(55,138,221,0.25)' },
  navLabel: { flex: 1, fontSize: 13.5, color: colors.blue300, fontWeight: '600' },
  navLabelActive: { color: colors.white },
  navBadge: { backgroundColor: '#F5C518', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  navBadgeLabel: { fontSize: 10, fontWeight: '800', color: '#000' },
  main: { paddingHorizontal: gutter, paddingTop: spacing.md },
});
