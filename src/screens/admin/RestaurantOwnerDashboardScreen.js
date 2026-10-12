/**
 * RestaurantOwnerDashboardScreen.js
 * Full owner dashboard: Overview, Bookings, Orders, Menu, Insights, Reviews, Finance, Reports, Settings
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput, Image,
  ActivityIndicator, Alert, StyleSheet, Platform, Linking, useWindowDimensions,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../../components/common/GradientBackground';
import { colors, spacing, radius, gutter } from '../../theme';
import { apiFetch, getToken } from '../../services/apiClient';
import { pickAndUpload } from '../../utils/uploadPhoto';
import { useUser } from '../../context/UserContext';

// ── Constants ─────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { key: 'overview',  icon: 'view-dashboard-outline', label: 'Overview' },
  { key: 'bookings',  icon: 'calendar-clock',         label: 'Bookings' },
  { key: 'orders',    icon: 'moped-outline',           label: 'Orders' },
  { key: 'menu',      icon: 'food-outline',            label: 'Menu' },
  { key: 'insights',  icon: 'chart-line',              label: 'Insights' },
  { key: 'reviews',   icon: 'star-outline',            label: 'Reviews' },
  { key: 'finance',   icon: 'cash-multiple',           label: 'Finance' },
  { key: 'reports',   icon: 'file-chart-outline',      label: 'Reports' },
  { key: 'settings',  icon: 'cog-outline',             label: 'Settings' },
];

const STATUS_COLORS = {
  pending:    '#F5C518',
  confirmed:  '#60C080',
  rejected:   '#E05050',
  cancelled:  '#888',
  completed:  '#60C080',
  noshow:     '#E07030',
  new:        '#378ADD',
  accepted:   '#60C080',
  preparing:  '#F5A623',
  ready:      '#25D366',
  delivered:  '#60C080',
};

const MENU_CATEGORIES = [
  'Starters','Salads','Soups','Mains','Pasta','Pizza','Burgers',
  'Sandwiches','Sides','Desserts','Drinks','Breakfast','Brunch','Specials','Other',
];

const DECLINE_REASONS = [
  'Fully booked', 'Closed that day', 'Party too large', 'Private event', 'Other',
];

const ORDER_STAGES = ['new','accepted','preparing','ready','delivered','cancelled'];
const ORDER_STAGE_LABELS = {
  new: 'New', accepted: 'Accepted', preparing: 'Preparing',
  ready: 'Ready', delivered: 'Delivered', cancelled: 'Cancelled',
};
const PREP_TIMES = [15, 25, 40];

// ── Helpers ───────────────────────────────────────────────────────────────────

function slaMinutes(createdAt) {
  const age = (Date.now() - new Date(createdAt || 0).getTime()) / 60000;
  return Math.max(0, 120 - age);
}

function fmtRwf(n) {
  return Number(n || 0).toLocaleString() + ' RWF';
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// ── Shared mini-components ────────────────────────────────────────────────────

function KpiTile({ label, value, sub, color, icon }) {
  return (
    <View style={[tile.card, { borderTopColor: color || colors.blue500 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {icon && <MaterialCommunityIcons name={icon} size={16} color={color || colors.blue300} />}
        <Text style={tile.value}>{value}</Text>
      </View>
      <Text style={tile.label}>{label}</Text>
      {sub ? <Text style={tile.sub}>{sub}</Text> : null}
    </View>
  );
}
const tile = StyleSheet.create({
  card: { flex: 1, minWidth: 100, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: radius.md, padding: spacing.md, borderTopWidth: 3 },
  value: { fontSize: 22, fontWeight: '800', color: colors.white },
  label: { fontSize: 11, color: colors.textOnNavyFaint, marginTop: 2 },
  sub:   { fontSize: 10, color: colors.blue300, marginTop: 1 },
});

function AlertBand({ alerts }) {
  if (!alerts.length) return null;
  return (
    <View style={{ gap: 6, marginBottom: spacing.lg }}>
      {alerts.map((a, i) => (
        <View key={i} style={[ab.row, a.severity === 'high' ? ab.high : ab.medium]}>
          <MaterialCommunityIcons name={a.icon || 'alert-circle-outline'} size={16} color={a.severity === 'high' ? '#F87171' : '#FCD34D'} />
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

function Tag({ label, color }) {
  return (
    <View style={{ backgroundColor: color || 'rgba(55,138,221,0.15)', borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3, marginRight: 5, marginBottom: 4 }}>
      <Text style={{ fontSize: 11, color: colors.blue300 }}>{label}</Text>
    </View>
  );
}

function ComingSoon({ icon, title, sub }) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 60, gap: spacing.sm }}>
      <MaterialCommunityIcons name={icon} size={44} color={colors.blue300} />
      <Text style={{ fontSize: 15, fontWeight: '700', color: colors.white, textAlign: 'center' }}>{title}</Text>
      <Text style={{ fontSize: 13, color: colors.textOnNavyFaint, textAlign: 'center', paddingHorizontal: 32 }}>{sub}</Text>
    </View>
  );
}

// ── Overview tab ──────────────────────────────────────────────────────────────

function OverviewTab({ restaurant, bookings, menuItems, onNav }) {
  const today = todayStr();
  const pending = bookings.filter(b => b.status === 'pending');
  const todayConfirmed = bookings.filter(b => b.date === today && b.status === 'confirmed');
  const covers = todayConfirmed.reduce((s, b) => s + (b.partySize || 1), 0);

  const pastSla = pending.filter(b => slaMinutes(b.createdAt) <= 0);
  const unansweredOld = pending.filter(b => slaMinutes(b.createdAt) < 60);

  const alerts = [];
  if (pastSla.length > 0) alerts.push({ text: `${pastSla.length} request${pastSla.length > 1 ? 's' : ''} past the 2-hour SLA — respond now`, severity: 'high', icon: 'clock-alert-outline' });
  if (unansweredOld.length > 0 && !pastSla.length) alerts.push({ text: `${unansweredOld.length} request${unansweredOld.length > 1 ? 's' : ''} waiting over 60 minutes`, severity: 'high', icon: 'clock-outline' });
  if (!restaurant.openStatus || restaurant.openStatus === 'Closed') alerts.push({ text: 'Your listing is marked Closed — customers cannot book', severity: 'high', icon: 'store-off-outline' });
  if ((restaurant.photos || []).length < 4) alerts.push({ text: 'Add more photos to attract customers (min. 4 recommended)', severity: 'medium', icon: 'image-plus-outline' });
  if (!restaurant.description) alerts.push({ text: 'Your profile has no description — customers skip listings without one', severity: 'medium', icon: 'text-box-outline' });

  // Timeline: hours from 7am to 10pm
  const hours = Array.from({ length: 16 }, (_, i) => i + 7);
  const slotCounts = {};
  hours.forEach(h => { slotCounts[h] = 0; });
  bookings.forEach(b => {
    if (b.date !== today || !b.time) return;
    const h = parseInt(b.time.split(':')[0], 10);
    if (slotCounts[h] !== undefined) slotCounts[h] += b.partySize || 1;
  });
  const maxSlot = Math.max(...Object.values(slotCounts), 1);

  const recentActivity = [...bookings]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 8);

  return (
    <View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg }}>
        <KpiTile label="Covers today" value={covers} sub={`${todayConfirmed.length} bookings`} color="#60C080" icon="account-group-outline" />
        <KpiTile label="Pending" value={pending.length} sub={pending.length > 0 ? `oldest ${Math.floor((Date.now() - new Date(pending[pending.length-1]?.createdAt||0).getTime())/60000)}m ago` : 'none'} color="#F5C518" icon="clock-outline" />
        <KpiTile label="Menu items" value={menuItems.length} color={colors.blue300} icon="food-outline" />
        <KpiTile label="Rating" value={restaurant.rating ? `★ ${restaurant.rating}` : '—'} color="#F5C518" icon="star-outline" />
      </View>

      <AlertBand alerts={alerts} />

      {/* Quick actions */}
      <View style={ov.card}>
        <SectionTitle title="Quick actions" icon="lightning-bolt" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
          {[
            { icon: 'calendar-plus', label: 'Add booking', key: 'bookings', badge: pending.length },
            { icon: 'food-outline', label: 'Add dish', key: 'menu' },
            { icon: 'moped-outline', label: 'Orders', key: 'orders' },
            { icon: 'storefront-outline', label: 'Edit profile', key: 'settings' },
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
      </View>

      {/* Today timeline */}
      <View style={ov.card}>
        <SectionTitle title="Today's timeline" icon="timeline-outline" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-end', height: 60 }}>
            {hours.map(h => {
              const cnt = slotCounts[h] || 0;
              const barH = cnt > 0 ? Math.max(8, (cnt / maxSlot) * 48) : 4;
              const isPending = bookings.some(b => b.date === today && b.time?.startsWith(String(h).padStart(2,'0')) && b.status === 'pending');
              return (
                <View key={h} style={{ alignItems: 'center', gap: 2 }}>
                  <View style={[ov.timeBar, { height: barH, backgroundColor: isPending ? '#F5C518' : cnt > 0 ? '#60C080' : 'rgba(255,255,255,0.1)' }]} />
                  <Text style={{ fontSize: 9, color: colors.textOnNavyFaint }}>{h}h</Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: '#60C080' }} />
            <Text style={{ fontSize: 10, color: colors.textOnNavyFaint }}>Confirmed</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: '#F5C518' }} />
            <Text style={{ fontSize: 10, color: colors.textOnNavyFaint }}>Pending</Text>
          </View>
        </View>
      </View>

      {/* Recent activity */}
      <View style={ov.card}>
        <SectionTitle title="Recent activity" icon="history" />
        {recentActivity.length === 0
          ? <Text style={{ fontSize: 12, color: colors.textOnNavyFaint }}>No activity yet</Text>
          : recentActivity.map(b => (
            <View key={b.id} style={ov.actRow}>
              <View style={[ov.actDot, { backgroundColor: STATUS_COLORS[b.status] || '#888' }]} />
              <View style={{ flex: 1 }}>
                <Text style={ov.actName}>{b.guestName || 'Customer'}</Text>
                <Text style={ov.actMeta}>{b.status} · {b.partySize || 1} pax · {b.date}</Text>
              </View>
            </View>
          ))}
      </View>
    </View>
  );
}
const ov = StyleSheet.create({
  card: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(133,183,235,0.15)' },
  qa: { alignItems: 'center', width: 72 },
  qaIcon: { width: 52, height: 52, borderRadius: radius.lg, backgroundColor: 'rgba(55,138,221,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  qaBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#F5C518', borderRadius: 8, paddingHorizontal: 4, paddingVertical: 1 },
  qaBadgeLabel: { fontSize: 10, fontWeight: '800', color: '#000' },
  qaLabel: { fontSize: 11, color: colors.textOnNavy, textAlign: 'center', fontWeight: '600' },
  timeBar: { width: 20, borderRadius: 3 },
  actRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: spacing.xs, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(133,183,235,0.08)' },
  actDot: { width: 8, height: 8, borderRadius: 4 },
  actName: { fontSize: 13, fontWeight: '600', color: colors.white },
  actMeta: { fontSize: 11, color: colors.textOnNavyFaint },
});

// ── Bookings tab ──────────────────────────────────────────────────────────────

function BookingsTab({ bookings, loading, onStatusChange }) {
  const [view, setView] = useState('list'); // list | pending
  const [expanded, setExpanded] = useState(null);
  const [declineReason, setDeclineReason] = useState('');
  const [showDeclineFor, setShowDeclineFor] = useState(null);

  const today = todayStr();
  const shown = view === 'pending'
    ? bookings.filter(b => b.status === 'pending')
    : [...bookings].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  function slaColor(createdAt) {
    const mins = slaMinutes(createdAt);
    if (mins <= 0) return '#E05050';
    if (mins < 60) return '#F5C518';
    return '#60C080';
  }

  function callWhatsApp(phone, name) {
    const num = phone?.replace(/\s/g, '');
    Linking.openURL(`https://wa.me/${num}?text=Hello%20${encodeURIComponent(name || '')}`).catch(() => {});
  }

  return (
    <View>
      {/* View switcher */}
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
            const isExpanded = expanded === b.id;
            const remainMins = slaMinutes(b.createdAt);
            return (
              <Pressable key={b.id} onPress={() => setExpanded(isExpanded ? null : b.id)} style={bk.card}>
                <View style={bk.header}>
                  <View style={[bk.dot, { backgroundColor: STATUS_COLORS[b.status] || '#888' }]} />
                  <Text style={bk.name}>{b.guestName || 'Customer'}</Text>
                  <Text style={[bk.status, { color: STATUS_COLORS[b.status] || '#888' }]}>
                    {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                  </Text>
                </View>
                <Text style={bk.meta}>{b.partySize || 1} pax · {b.date} at {b.time}</Text>
                {b.status === 'pending' && (
                  <Text style={[bk.sla, { color: slaColor(b.createdAt) }]}>
                    {remainMins <= 0 ? 'Past SLA' : `${Math.floor(remainMins)}m left to respond`}
                  </Text>
                )}

                {isExpanded && (
                  <View style={{ marginTop: spacing.sm, gap: spacing.xs }}>
                    {b.guestPhone && (
                      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                        <Pressable onPress={() => Linking.openURL(`tel:${b.guestPhone}`)} style={bk.callBtn}>
                          <MaterialCommunityIcons name="phone" size={14} color="#60C080" />
                          <Text style={[bk.callBtnLabel, { color: '#60C080' }]}>Call</Text>
                        </Pressable>
                        <Pressable onPress={() => callWhatsApp(b.guestPhone, b.guestName)} style={bk.callBtn}>
                          <MaterialCommunityIcons name="whatsapp" size={14} color="#25D366" />
                          <Text style={[bk.callBtnLabel, { color: '#25D366' }]}>WhatsApp</Text>
                        </Pressable>
                      </View>
                    )}
                    {b.notes ? <Text style={{ fontSize: 12, color: colors.textOnNavyFaint, fontStyle: 'italic' }}>"{b.notes}"</Text> : null}
                    {b.occasion ? <Text style={{ fontSize: 12, color: colors.textOnNavyFaint }}>Occasion: {b.occasion}</Text> : null}
                    {b.noshowCount > 0 && <Text style={{ fontSize: 12, color: '#E07030' }}>⚠️ {b.noshowCount} prior no-show{b.noshowCount > 1 ? 's' : ''}</Text>}

                    {b.status === 'pending' && (
                      <View style={{ gap: spacing.xs, marginTop: spacing.xs }}>
                        <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                          <Pressable onPress={() => { onStatusChange(b.id, 'confirmed'); setExpanded(null); }} style={[bk.actionBtn, { flex: 1, borderColor: '#60C080', backgroundColor: 'rgba(60,160,80,0.15)' }]}>
                            <MaterialCommunityIcons name="check" size={14} color="#60C080" />
                            <Text style={[bk.actionBtnLabel, { color: '#60C080' }]}>Confirm</Text>
                          </Pressable>
                          <Pressable onPress={() => setShowDeclineFor(showDeclineFor === b.id ? null : b.id)} style={[bk.actionBtn, { flex: 1, borderColor: '#E05050', backgroundColor: 'rgba(224,80,80,0.15)' }]}>
                            <MaterialCommunityIcons name="close" size={14} color="#E05050" />
                            <Text style={[bk.actionBtnLabel, { color: '#E05050' }]}>Decline</Text>
                          </Pressable>
                        </View>
                        {showDeclineFor === b.id && (
                          <View style={{ gap: spacing.xs }}>
                            <Text style={{ fontSize: 11, color: colors.textOnNavyFaint }}>Reason for declining:</Text>
                            {DECLINE_REASONS.map(r => (
                              <Pressable key={r} onPress={() => { onStatusChange(b.id, 'rejected', r); setShowDeclineFor(null); setExpanded(null); }}
                                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 }}>
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
                          <Text style={[bk.actionBtnLabel, { color: '#60C080' }]}>Completed</Text>
                        </Pressable>
                        <Pressable onPress={() => { onStatusChange(b.id, 'noshow'); setExpanded(null); }} style={[bk.actionBtn, { flex: 1, borderColor: '#E07030', backgroundColor: 'rgba(224,112,48,0.1)' }]}>
                          <MaterialCommunityIcons name="account-off-outline" size={14} color="#E07030" />
                          <Text style={[bk.actionBtnLabel, { color: '#E07030' }]}>No-Show</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs },
  dot: { width: 8, height: 8, borderRadius: 4 },
  name: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.white },
  status: { fontSize: 12, fontWeight: '600' },
  meta: { fontSize: 13, color: colors.textOnNavy },
  sla: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  callBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: 'rgba(133,183,235,0.2)', borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 6 },
  callBtnLabel: { fontSize: 12, fontWeight: '700' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, borderRadius: radius.sm, borderWidth: 1 },
  actionBtnLabel: { fontSize: 12, fontWeight: '700' },
});

// ── Orders tab ────────────────────────────────────────────────────────────────

function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [prepTime, setPrepTime] = useState(null);
  const [prepFor, setPrepFor] = useState(null);

  useEffect(() => {
    apiFetch('/my-restaurant/orders').then(d => setOrders(Array.isArray(d) ? d : [])).catch(() => setOrders([])).finally(() => setLoading(false));
  }, []);

  function advance(id, toStage) {
    apiFetch(`/my-restaurant/orders/${id}/status`, { method: 'PUT', body: { status: toStage } })
      .then(() => setOrders(prev => prev.map(o => o.id === id ? { ...o, status: toStage } : o)))
      .catch(() => Alert.alert('Error', 'Could not update order'));
  }

  function acceptWithPrep(id, mins) {
    apiFetch(`/my-restaurant/orders/${id}/status`, { method: 'PUT', body: { status: 'accepted', prepMinutes: mins } })
      .then(() => { setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'accepted', prepMinutes: mins } : o)); setPrepFor(null); })
      .catch(() => Alert.alert('Error', 'Could not accept order'));
  }

  const staged = {};
  ORDER_STAGES.forEach(s => { staged[s] = orders.filter(o => o.status === s); });

  if (loading) return <ActivityIndicator color={colors.blue300} style={{ marginTop: 60 }} />;

  if (orders.length === 0) {
    return <ComingSoon icon="moped-outline" title="No orders yet" sub="When customers place delivery or takeaway orders, they appear here in a live pipeline." />;
  }

  return (
    <View>
      {ORDER_STAGES.filter(s => staged[s].length > 0 || s === 'new').map(stage => (
        <View key={stage} style={{ marginBottom: spacing.lg }}>
          <SectionTitle title={ORDER_STAGE_LABELS[stage]} icon={stage === 'new' ? 'bell-ring-outline' : stage === 'preparing' ? 'chef-hat' : stage === 'delivered' ? 'check-circle-outline' : 'arrow-right-circle-outline'} />
          {staged[stage].length === 0
            ? <Text style={{ fontSize: 12, color: colors.textOnNavyFaint, marginBottom: spacing.sm }}>None</Text>
            : staged[stage].map(o => (
              <View key={o.id} style={ord.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs }}>
                  <Text style={ord.code}># {o.code || o.id?.slice(-5)}</Text>
                  <Text style={ord.total}>{fmtRwf(o.total)}</Text>
                </View>
                {(o.items || []).map((it, i) => (
                  <Text key={i} style={ord.item}>· {it.name}{it.qty > 1 ? ` ×${it.qty}` : ''}</Text>
                ))}
                {o.customerPhone && <Text style={{ fontSize: 12, color: colors.blue300, marginTop: spacing.xs }}>📞 {o.customerPhone}</Text>}
                {o.address && <Text style={{ fontSize: 12, color: colors.textOnNavyFaint, marginTop: 2 }}>📍 {o.address}</Text>}

                {stage === 'new' && (
                  prepFor === o.id ? (
                    <View style={{ gap: spacing.xs, marginTop: spacing.sm }}>
                      <Text style={{ fontSize: 11, color: colors.textOnNavyFaint }}>Prep time:</Text>
                      <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                        {PREP_TIMES.map(t => (
                          <Pressable key={t} onPress={() => acceptWithPrep(o.id, t)} style={[ord.prepBtn, { backgroundColor: 'rgba(96,192,128,0.15)', borderColor: '#60C080' }]}>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: '#60C080' }}>{t}m</Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm }}>
                      <Pressable onPress={() => setPrepFor(o.id)} style={[ord.stageBtn, { borderColor: '#60C080', backgroundColor: 'rgba(60,160,80,0.15)' }]}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#60C080' }}>Accept</Text>
                      </Pressable>
                      <Pressable onPress={() => advance(o.id, 'cancelled')} style={[ord.stageBtn, { borderColor: '#E05050', backgroundColor: 'rgba(224,80,80,0.15)' }]}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#E05050' }}>Reject</Text>
                      </Pressable>
                    </View>
                  )
                )}
                {stage === 'accepted' && (
                  <Pressable onPress={() => advance(o.id, 'preparing')} style={[ord.stageBtn, { borderColor: '#F5A623', backgroundColor: 'rgba(245,166,35,0.15)', marginTop: spacing.sm }]}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#F5A623' }}>Start preparing →</Text>
                  </Pressable>
                )}
                {stage === 'preparing' && (
                  <Pressable onPress={() => advance(o.id, 'ready')} style={[ord.stageBtn, { borderColor: '#25D366', backgroundColor: 'rgba(37,211,102,0.15)', marginTop: spacing.sm }]}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#25D366' }}>Mark ready →</Text>
                  </Pressable>
                )}
                {stage === 'ready' && (
                  <Pressable onPress={() => advance(o.id, 'delivered')} style={[ord.stageBtn, { borderColor: '#60C080', backgroundColor: 'rgba(60,160,80,0.15)', marginTop: spacing.sm }]}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#60C080' }}>Mark delivered →</Text>
                  </Pressable>
                )}
              </View>
            ))}
        </View>
      ))}
    </View>
  );
}
const ord = StyleSheet.create({
  card: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(133,183,235,0.15)' },
  code: { fontSize: 12, fontWeight: '700', color: colors.blue300 },
  total: { fontSize: 14, fontWeight: '800', color: '#60C080' },
  item: { fontSize: 12, color: colors.textOnNavy },
  stageBtn: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.sm, borderWidth: 1 },
  prepBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.sm, borderWidth: 1 },
});

// ── Menu tab ──────────────────────────────────────────────────────────────────

function MenuTab({ menuItems, loading, onSave, onDelete, isCafe }) {
  const defaultCat = isCafe ? 'Drinks' : 'Mains';
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ category: defaultCat, name: '', description: '', price: '', available: true, photoUrl: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    await onSave(editId, form);
    setEditId(null);
    setForm({ category: defaultCat, name: '', description: '', price: '', available: true, photoUrl: '' });
    setSaving(false);
  }

  async function handlePhoto() {
    try {
      setUploading(true);
      const token = await getToken();
      const url = await pickAndUpload(token);
      setForm(f => ({ ...f, photoUrl: url }));
    } catch (e) { Alert.alert('Upload failed', e.message); }
    finally { setUploading(false); }
  }

  const grouped = {};
  menuItems.forEach(item => {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  });

  return (
    <View>
      {/* Form */}
      <View style={mn.formCard}>
        <SectionTitle title={editId ? 'Edit dish' : 'Add a dish'} icon="food-outline" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.sm }}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {MENU_CATEGORIES.map(cat => (
              <Pressable key={cat} onPress={() => setForm(f => ({ ...f, category: cat }))} style={[mn.catChip, form.category === cat && mn.catChipActive]}>
                <Text style={[mn.catChipLabel, form.category === cat && { color: colors.white }]}>{cat}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
        <TextInput style={[mn.input, { marginBottom: spacing.sm }]} value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))} placeholder="Dish name *" placeholderTextColor={colors.textOnNavyFaint} />
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm }}>
          <TextInput style={[mn.input, { flex: 1 }]} value={String(form.price)} onChangeText={v => setForm(f => ({ ...f, price: v }))} placeholder="Price (RWF)" placeholderTextColor={colors.textOnNavyFaint} keyboardType="numeric" />
          <Pressable onPress={() => setForm(f => ({ ...f, available: !f.available }))} style={[mn.availBtn, form.available && mn.availBtnOn]}>
            <MaterialCommunityIcons name={form.available ? 'check-circle' : 'close-circle-outline'} size={16} color={form.available ? '#60C080' : colors.textOnNavyFaint} />
            <Text style={{ fontSize: 12, fontWeight: '600', color: form.available ? '#60C080' : colors.textOnNavyFaint }}>{form.available ? 'Available' : 'Unavailable'}</Text>
          </Pressable>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
          {form.photoUrl ? <Image source={{ uri: form.photoUrl }} style={{ width: 60, height: 60, borderRadius: radius.sm }} /> : null}
          <Pressable onPress={handlePhoto} disabled={uploading} style={mn.photoBtn}>
            {uploading ? <ActivityIndicator size="small" color={colors.blue300} /> : <MaterialCommunityIcons name="camera-plus-outline" size={18} color={colors.blue300} />}
            <Text style={{ fontSize: 12, color: colors.blue300 }}>{form.photoUrl ? 'Change photo' : 'Add photo'}</Text>
          </Pressable>
        </View>
        <TextInput style={[mn.input, { minHeight: 60, textAlignVertical: 'top', marginBottom: spacing.sm }]} value={form.description} onChangeText={v => setForm(f => ({ ...f, description: v }))} placeholder="Description (optional)" placeholderTextColor={colors.textOnNavyFaint} multiline />
        <View style={{ flexDirection: 'row', gap: spacing.xs }}>
          <Pressable onPress={handleSave} disabled={saving || !form.name.trim()} style={[mn.saveBtn, (saving || !form.name.trim()) && { opacity: 0.5 }]}>
            {saving ? <ActivityIndicator color={colors.white} /> : <Text style={{ fontSize: 14, fontWeight: '700', color: colors.white }}>{editId ? 'Save' : 'Add Dish'}</Text>}
          </Pressable>
          {editId && (
            <Pressable onPress={() => { setEditId(null); setForm({ category: defaultCat, name: '', description: '', price: '', available: true, photoUrl: '' }); }} style={mn.cancelBtn}>
              <Text style={{ fontSize: 14, color: colors.textOnNavy }}>Cancel</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* List */}
      {loading
        ? <ActivityIndicator color={colors.blue300} style={{ marginTop: 20 }} />
        : Object.entries(grouped).map(([cat, items]) => (
          <View key={cat} style={{ marginBottom: spacing.lg }}>
            <Text style={mn.catHeader}>{cat}</Text>
            {items.map(item => (
              <View key={item.id} style={[mn.itemRow, !item.available && { opacity: 0.45 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={mn.itemName}>{item.name}</Text>
                  {item.description ? <Text style={mn.itemDesc}>{item.description}</Text> : null}
                  {!item.available && <Text style={{ fontSize: 11, color: '#E07030', marginTop: 2 }}>Unavailable</Text>}
                </View>
                <Text style={mn.itemPrice}>{Number(item.price).toLocaleString()} RWF</Text>
                <Pressable onPress={() => { setEditId(item.id); setForm({ category: item.category, name: item.name, description: item.description || '', price: String(item.price), available: item.available !== false, photoUrl: item.photo_url || '' }); }} style={{ padding: 8 }}>
                  <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.blue300} />
                </Pressable>
                <Pressable onPress={() => onDelete(item.id)} style={{ padding: 8 }}>
                  <MaterialCommunityIcons name="delete-outline" size={16} color="#e05c5c" />
                </Pressable>
                <Pressable onPress={() => apiFetch(`/my-restaurant/menu/${item.id}`, { method: 'PUT', body: { available: !item.available } }).catch(() => {})} style={{ padding: 8 }}>
                  <MaterialCommunityIcons name={item.available ? 'eye-off-outline' : 'eye-outline'} size={16} color={colors.textOnNavyFaint} />
                </Pressable>
              </View>
            ))}
          </View>
        ))}
    </View>
  );
}
const mn = StyleSheet.create({
  formCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(133,183,235,0.15)' },
  catChip: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(133,183,235,0.25)', backgroundColor: 'rgba(255,255,255,0.04)' },
  catChipActive: { backgroundColor: colors.blue500, borderColor: colors.blue500 },
  catChipLabel: { fontSize: 12, color: colors.textOnNavy, fontWeight: '600' },
  input: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: Platform.OS === 'web' ? spacing.sm : 12, color: colors.white, fontSize: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(133,183,235,0.25)' },
  availBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(133,183,235,0.2)', paddingHorizontal: spacing.sm, paddingVertical: spacing.sm },
  availBtnOn: { borderColor: 'rgba(96,192,128,0.4)' },
  photoBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: 'rgba(133,183,235,0.3)', borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  saveBtn: { flex: 1, backgroundColor: colors.blue500, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  cancelBtn: { borderRadius: radius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(133,183,235,0.3)' },
  catHeader: { fontSize: 12, fontWeight: '800', color: colors.blue300, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.sm, paddingBottom: spacing.xs, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(133,183,235,0.2)' },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(133,183,235,0.08)', gap: 2 },
  itemName: { fontSize: 13, fontWeight: '600', color: colors.white },
  itemDesc: { fontSize: 11, color: colors.textOnNavyFaint, marginTop: 1 },
  itemPrice: { fontSize: 13, fontWeight: '700', color: '#60C080', marginRight: 4 },
});

// ── Insights tab ──────────────────────────────────────────────────────────────

function InsightsTab({ bookings }) {
  const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const HOURS = [7,8,9,10,11,12,13,14,15,16,17,18,19,20,21];

  // Demand heat map: count bookings by DOW × hour
  const heat = {};
  DOW.forEach(d => { heat[d] = {}; HOURS.forEach(h => { heat[d][h] = 0; }); });
  bookings.forEach(b => {
    if (!b.date || !b.time) return;
    const dow = DOW[new Date(b.date).getDay()];
    const h = parseInt(b.time.split(':')[0], 10);
    if (heat[dow] && heat[dow][h] !== undefined) heat[dow][h]++;
  });
  const maxHeat = Math.max(...DOW.flatMap(d => HOURS.map(h => heat[d][h])), 1);

  // Top periods
  const byDow = DOW.map(d => ({ day: d, total: HOURS.reduce((s, h) => s + heat[d][h], 0) })).sort((a, b) => b.total - a.total);
  const maxDow = byDow[0]?.total || 1;

  // Funnel (using booking statuses as proxy)
  const total = bookings.length;
  const confirmed = bookings.filter(b => ['confirmed','completed'].includes(b.status)).length;
  const completed = bookings.filter(b => b.status === 'completed').length;
  const noshow = bookings.filter(b => b.status === 'noshow').length;

  // Response rate (answered within 2h)
  const answeredIn2h = bookings.filter(b => b.respondedAt && b.createdAt && (new Date(b.respondedAt) - new Date(b.createdAt)) < 7200000).length;
  const responseRate = total > 0 ? Math.round(answeredIn2h / total * 100) : 0;

  return (
    <View>
      {/* KPI row */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg }}>
        <KpiTile label="Total requests" value={total} color={colors.blue300} icon="calendar-multiple" />
        <KpiTile label="Confirmed" value={confirmed} color="#60C080" icon="check-circle-outline" />
        <KpiTile label="Completed" value={completed} color="#25D366" icon="check-all" />
        <KpiTile label="Response rate" value={`${responseRate}%`} color={responseRate >= 80 ? '#60C080' : responseRate >= 50 ? '#F5C518' : '#E05050'} icon="clock-check-outline" />
      </View>

      {/* Demand by day */}
      <View style={ins.card}>
        <SectionTitle title="Busiest days" icon="calendar-week" />
        {byDow.map(({ day, total }) => (
          <View key={day} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs, gap: spacing.sm }}>
            <Text style={{ width: 36, fontSize: 12, color: colors.textOnNavy }}>{day}</Text>
            <View style={{ flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
              <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.blue500, width: `${(total / maxDow) * 100}%` }} />
            </View>
            <Text style={{ width: 20, fontSize: 11, color: colors.textOnNavyFaint, textAlign: 'right' }}>{total}</Text>
          </View>
        ))}
      </View>

      {/* Conversion funnel */}
      <View style={ins.card}>
        <SectionTitle title="Booking funnel" icon="filter-outline" />
        {[
          { label: 'Total requests', val: total, color: colors.blue500 },
          { label: 'Confirmed', val: confirmed, color: '#60C080' },
          { label: 'Completed', val: completed, color: '#25D366' },
          { label: 'No-shows', val: noshow, color: '#E07030' },
        ].map(f => (
          <View key={f.label} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: spacing.sm }}>
            <View style={{ width: Math.max(8, (f.val / (total || 1)) * 120), height: 28, borderRadius: 4, backgroundColor: f.color, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.white }}>{f.val}</Text>
            </View>
            <Text style={{ fontSize: 12, color: colors.textOnNavy }}>{f.label}</Text>
          </View>
        ))}
      </View>

      {/* Response time note */}
      <View style={[ins.card, { backgroundColor: responseRate < 50 ? 'rgba(224,80,80,0.08)' : 'rgba(255,255,255,0.05)' }]}>
        <SectionTitle title="Responsiveness" icon="clock-fast" />
        <Text style={{ fontSize: 24, fontWeight: '800', color: responseRate >= 80 ? '#60C080' : responseRate >= 50 ? '#F5C518' : '#E05050' }}>{responseRate}%</Text>
        <Text style={{ fontSize: 12, color: colors.textOnNavyFaint, marginTop: spacing.xs }}>requests answered within 2 hours (last 30d)</Text>
        {responseRate < 80 && <Text style={{ fontSize: 12, color: '#F5C518', marginTop: spacing.sm }}>⚠️ Response rate affects your ranking in search results.</Text>}
      </View>

      <View style={ins.card}>
        <SectionTitle title="More insights" icon="chart-areaspline" />
        <ComingSoon icon="chart-timeline-variant" title="Detailed analytics coming soon" sub="Dish performance, discovery funnel, and district benchmarks require additional data collection." />
      </View>
    </View>
  );
}
const ins = StyleSheet.create({
  card: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(133,183,235,0.15)' },
});

// ── Reviews tab ───────────────────────────────────────────────────────────────

function ReviewsTab() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState({});
  const [replying, setReplying] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch('/my-restaurant/reviews').then(d => setReviews(Array.isArray(d) ? d : [])).catch(() => setReviews([])).finally(() => setLoading(false));
  }, []);

  async function submitReply(id) {
    const text = replyText[id]?.trim();
    if (!text) return;
    setSaving(true);
    try {
      await apiFetch(`/my-restaurant/reviews/${id}/reply`, { method: 'POST', body: { reply: text } });
      setReviews(prev => prev.map(r => r.id === id ? { ...r, ownerReply: text } : r));
      setReplyText(prev => ({ ...prev, [id]: '' }));
      setReplying(null);
    } catch { Alert.alert('Error', 'Could not save reply'); }
    setSaving(false);
  }

  if (loading) return <ActivityIndicator color={colors.blue300} style={{ marginTop: 60 }} />;
  if (reviews.length === 0) return <ComingSoon icon="star-outline" title="No reviews yet" sub="Customer reviews from verified visits will appear here. Reply publicly to build your reputation." />;

  const avg = reviews.length ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) : '—';
  const dist = [5,4,3,2,1].map(n => ({ stars: n, count: reviews.filter(r => Math.round(r.rating) === n).length }));

  return (
    <View>
      {/* Summary */}
      <View style={rv.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 40, fontWeight: '800', color: colors.white }}>{avg}</Text>
            <Text style={{ fontSize: 11, color: colors.textOnNavyFaint }}>{reviews.length} reviews</Text>
          </View>
          <View style={{ flex: 1 }}>
            {dist.map(d => (
              <View key={d.stars} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: 3 }}>
                <Text style={{ fontSize: 11, color: colors.textOnNavyFaint, width: 16, textAlign: 'right' }}>{d.stars}★</Text>
                <View style={{ flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                  <View style={{ height: 6, backgroundColor: '#F5C518', borderRadius: 3, width: `${reviews.length ? (d.count / reviews.length) * 100 : 0}%` }} />
                </View>
                <Text style={{ fontSize: 11, color: colors.textOnNavyFaint, width: 16 }}>{d.count}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Review list */}
      {reviews.map(r => (
        <View key={r.id} style={rv.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.white }}>{r.guestName || 'Guest'}</Text>
            <Text style={{ fontSize: 14, color: '#F5C518' }}>{'★'.repeat(Math.round(r.rating || 0))}</Text>
          </View>
          <Text style={{ fontSize: 12, color: colors.textOnNavy, marginBottom: spacing.sm }}>{r.text || 'No comment'}</Text>
          <Text style={{ fontSize: 11, color: colors.textOnNavyFaint, marginBottom: spacing.sm }}>{r.date || ''}</Text>

          {r.ownerReply ? (
            <View style={{ backgroundColor: 'rgba(55,138,221,0.1)', borderRadius: radius.sm, padding: spacing.sm, borderLeftWidth: 3, borderLeftColor: colors.blue300 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.blue300, marginBottom: 2 }}>Your reply</Text>
              <Text style={{ fontSize: 12, color: colors.textOnNavy }}>{r.ownerReply}</Text>
            </View>
          ) : replying === r.id ? (
            <View style={{ gap: spacing.xs }}>
              <TextInput value={replyText[r.id] || ''} onChangeText={v => setReplyText(p => ({ ...p, [r.id]: v }))} multiline placeholder="Write your reply…" placeholderTextColor={colors.textOnNavyFaint}
                style={[mn.input, { minHeight: 60, textAlignVertical: 'top' }]} />
              <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                <Pressable onPress={() => submitReply(r.id)} disabled={saving} style={[mn.saveBtn, { flex: 1, paddingVertical: spacing.sm }]}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: colors.white }}>Post reply</Text>
                </Pressable>
                <Pressable onPress={() => setReplying(null)} style={mn.cancelBtn}>
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
const rv = StyleSheet.create({
  card: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(133,183,235,0.15)' },
});

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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg }}>
        <Text style={{ fontSize: 13, color: colors.textOnNavyFaint }}>Period:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: spacing.xs }}>
            {MONTHS.map(mo => (
              <Pressable key={mo.val} onPress={() => setPeriod(mo.val)} style={[bk.viewBtn, period === mo.val && bk.viewBtnActive]}>
                <Text style={[bk.viewBtnLabel, period === mo.val && bk.viewBtnLabelActive]}>{mo.label}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg }}>
        <KpiTile label="Gross revenue" value={fmtRwf(gross)} color="#60C080" icon="cash-plus" />
        <KpiTile label="Platform fee (10%)" value={fmtRwf(commission)} color="#E05050" icon="percent" />
        <KpiTile label="Net payout" value={fmtRwf(net)} color={colors.blue300} icon="bank-outline" />
        <KpiTile label="Orders" value={periodBks.length} color={colors.blue300} icon="receipt" />
      </View>

      <View style={ins.card}>
        <SectionTitle title="Payout history" icon="history" />
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
      </View>

      <View style={[ins.card, { backgroundColor: 'rgba(245,166,35,0.08)' }]}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: '#F5A623' }}>Finance read-only view</Text>
        <Text style={{ fontSize: 12, color: colors.textOnNavy, marginTop: spacing.xs }}>This shows your figures from the platform ledger. Contact the platform team for payout disputes or invoice requests.</Text>
      </View>
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

  const bookingCols = [
    { key: 'guestName', label: 'Guest' },
    { key: 'date', label: 'Date' },
    { key: 'time', label: 'Time' },
    { key: 'partySize', label: 'Party Size' },
    { key: 'status', label: 'Status' },
    { key: 'amount', label: 'Amount (RWF)' },
  ];
  const menuCols = [
    { key: 'category', label: 'Category' },
    { key: 'name', label: 'Dish' },
    { key: 'price', label: 'Price (RWF)' },
    { key: 'available', label: 'Available' },
  ];

  return (
    <View>
      {[
        { title: 'Bookings Register', desc: `All ${bookings.length} bookings`, rows: bookings, cols: bookingCols, filename: 'bookings' },
        { title: 'Pending Bookings', desc: `${bookings.filter(b => b.status === 'pending').length} pending`, rows: bookings.filter(b => b.status === 'pending'), cols: bookingCols, filename: 'pending-bookings' },
        { title: 'Confirmed Bookings', desc: `${bookings.filter(b => ['confirmed','completed'].includes(b.status)).length} confirmed`, rows: bookings.filter(b => ['confirmed','completed'].includes(b.status)), cols: bookingCols, filename: 'confirmed-bookings' },
        { title: 'Menu', desc: `${menuItems.length} dishes`, rows: menuItems, cols: menuCols, filename: 'menu' },
      ].map(r => (
        <View key={r.title} style={[ins.card, { flexDirection: 'row', alignItems: 'center' }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.white }}>{r.title}</Text>
            <Text style={{ fontSize: 12, color: colors.textOnNavyFaint, marginTop: 2 }}>{r.desc}</Text>
          </View>
          <Pressable onPress={() => exportCsv(r.rows, r.cols, r.filename)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: 'rgba(133,183,235,0.3)', borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 7 }}>
            <MaterialCommunityIcons name="download-outline" size={14} color={colors.blue300} />
            <Text style={{ fontSize: 12, color: colors.blue300, fontWeight: '600' }}>Export CSV</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

// ── Settings tab ──────────────────────────────────────────────────────────────

function SettingsTab({ restaurant, onSave, isCafe }) {
  const [form, setForm] = useState({
    name: restaurant?.name || '',
    description: restaurant?.description || '',
    location: restaurant?.location || '',
    district: restaurant?.district || '',
    phone: restaurant?.phone || '',
    website: restaurant?.website || '',
    openStatus: restaurant?.openStatus || restaurant?.open_status || 'Open now',
    openHours: restaurant?.openHours || restaurant?.open_hours || '',
    deliveryZones: restaurant?.deliveryZones || '',
    minOrder: restaurant?.minOrder || '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    await onSave(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaving(false);
  }

  const fields = [
    { key: 'name', label: `${isCafe ? 'Coffee Shop' : 'Restaurant'} Name *`, placeholder: 'Name' },
    { key: 'description', label: 'Description', placeholder: 'What makes you special…', multi: true },
    { key: 'location', label: 'Location', placeholder: 'e.g. Kiyovu, Kigali' },
    { key: 'district', label: 'District', placeholder: 'e.g. Nyarugenge' },
    { key: 'phone', label: 'Phone', placeholder: '+250 7XX XXX XXX' },
    { key: 'website', label: 'Website', placeholder: 'https://…' },
    { key: 'openStatus', label: 'Open Status', placeholder: 'Open now / Closed' },
    { key: 'openHours', label: 'Opening Hours', placeholder: 'Mon–Sat: 11am–10pm, Sun: Closed', multi: true },
    { key: 'deliveryZones', label: 'Delivery Zones', placeholder: 'Kiyovu, Gisozi, Kimironko…' },
    { key: 'minOrder', label: 'Min. Order (RWF)', placeholder: '5000' },
  ];

  return (
    <View>
      {fields.map(f => (
        <View key={f.key} style={{ marginBottom: spacing.lg }}>
          <Text style={{ fontSize: 11.5, fontWeight: '700', color: colors.textOnNavyFaint, marginBottom: spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 }}>{f.label}</Text>
          <TextInput style={[mn.input, f.multi && { minHeight: 70, textAlignVertical: 'top' }]} value={form[f.key]} onChangeText={v => setForm(p => ({ ...p, [f.key]: v }))} placeholder={f.placeholder} placeholderTextColor={colors.textOnNavyFaint} multiline={!!f.multi} />
        </View>
      ))}
      <Pressable onPress={save} disabled={saving} style={[mn.saveBtn, saving && { opacity: 0.6 }]}>
        {saving ? <ActivityIndicator color={colors.white} /> : <Text style={{ fontSize: 15, fontWeight: '700', color: colors.white }}>{saved ? 'Saved!' : 'Save Profile'}</Text>}
      </Pressable>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function RestaurantOwnerDashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const { width: screenWidth } = useWindowDimensions();
  const isCafe = user?.role === 'coffeeshop';
  const isWide = screenWidth >= 768;

  const [section, setSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [restaurant, setRestaurant] = useState(null);
  const [restoLoading, setRestoLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);

  const pendingCount = bookings.filter(b => b.status === 'pending').length;

  const loadRestaurant = useCallback(async () => {
    setRestoLoading(true);
    try { const d = await apiFetch('/my-restaurant'); setRestaurant(d); } catch {}
    setRestoLoading(false);
  }, []);

  const loadBookings = useCallback(async () => {
    setBookingsLoading(true);
    try { const d = await apiFetch('/my-restaurant/bookings'); setBookings(Array.isArray(d) ? d : []); } catch {}
    setBookingsLoading(false);
  }, []);

  const loadMenu = useCallback(async () => {
    setMenuLoading(true);
    try {
      const ep = isCafe ? '/my-restaurant/cs-menu' : '/my-restaurant/menu';
      const d = await apiFetch(ep);
      setMenuItems(Array.isArray(d) ? d : []);
    } catch {}
    setMenuLoading(false);
  }, [isCafe]);

  useEffect(() => { loadRestaurant(); }, [loadRestaurant]);
  useEffect(() => { loadBookings(); }, [loadBookings]);
  useEffect(() => { loadMenu(); }, [loadMenu]);

  async function handleBookingStatus(id, status, reason) {
    try {
      await apiFetch(`/my-restaurant/bookings/${id}/status`, { method: 'PUT', body: { status, reason } });
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    } catch { Alert.alert('Error', 'Could not update booking.'); }
  }

  async function handleMenuSave(editId, form) {
    const defaultCat = isCafe ? 'Drinks' : 'Mains';
    const body = { category: form.category || defaultCat, name: form.name.trim(), description: form.description || '', price: parseInt(form.price, 10) || 0, available: form.available !== false, photoUrl: form.photoUrl?.trim() || null };
    const base = isCafe ? '/my-restaurant/cs-menu' : '/my-restaurant/menu';
    if (editId) { await apiFetch(`${base}/${editId}`, { method: 'PUT', body }); }
    else { await apiFetch(base, { method: 'POST', body }); }
    await loadMenu();
  }

  async function handleMenuDelete(id) {
    try {
      const base = isCafe ? '/my-restaurant/cs-menu' : '/my-restaurant/menu';
      await apiFetch(`${base}/${id}`, { method: 'DELETE' });
      setMenuItems(prev => prev.filter(m => m.id !== id));
    } catch { Alert.alert('Error', 'Could not delete item.'); }
  }

  async function handleProfileSave(form) {
    try { const d = await apiFetch('/my-restaurant', { method: 'PUT', body: form }); setRestaurant(d); } catch { Alert.alert('Error', 'Could not save profile.'); }
  }

  const topbarTitles = { overview: 'Overview', bookings: 'Bookings', orders: 'Orders', menu: 'Menu', insights: 'Insights', reviews: 'Reviews', finance: 'Finance', reports: 'Reports', settings: 'Settings' };

  if (restoLoading) {
    return <GradientBackground><View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.blue300} size="large" /></View></GradientBackground>;
  }

  if (!restaurant) {
    return (
      <GradientBackground>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: gutter }}>
          <MaterialCommunityIcons name={isCafe ? 'coffee-outline' : 'silverware-fork-knife'} size={52} color={colors.blue300} />
          <Text style={{ color: colors.white, fontSize: 18, fontWeight: '700', marginTop: spacing.lg, textAlign: 'center' }}>No {isCafe ? 'coffee shop' : 'restaurant'} linked</Text>
          <Text style={{ color: colors.textOnNavy, fontSize: 13.5, marginTop: spacing.sm, textAlign: 'center' }}>Contact the director to link your account.</Text>
          <Pressable onPress={() => navigation.goBack()} style={{ marginTop: spacing.xl }}><Text style={{ color: colors.blue300, fontWeight: '600' }}>← Go back</Text></Pressable>
        </View>
      </GradientBackground>
    );
  }

  const sidebar = (
    <View style={s.sidebar}>
      <View style={s.sidebarBrand}>
        <MaterialCommunityIcons name={isCafe ? 'coffee-outline' : 'silverware-fork-knife'} size={18} color={colors.blue300} />
        <Text style={s.sidebarTitle} numberOfLines={1}>{restaurant.name}</Text>
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
      {section === 'overview' && <OverviewTab restaurant={restaurant} bookings={bookings} menuItems={menuItems} onNav={key => { setSection(key); setSidebarOpen(false); }} />}
      {section === 'bookings' && <BookingsTab bookings={bookings} loading={bookingsLoading} onStatusChange={handleBookingStatus} />}
      {section === 'orders' && <OrdersTab />}
      {section === 'menu' && <MenuTab menuItems={menuItems} loading={menuLoading} onSave={handleMenuSave} onDelete={handleMenuDelete} isCafe={isCafe} />}
      {section === 'insights' && <InsightsTab bookings={bookings} />}
      {section === 'reviews' && <ReviewsTab />}
      {section === 'finance' && <FinanceTab bookings={bookings} />}
      {section === 'reports' && <ReportsTab bookings={bookings} menuItems={menuItems} />}
      {section === 'settings' && <SettingsTab restaurant={restaurant} onSave={handleProfileSave} isCafe={isCafe} />}
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
            <MaterialCommunityIcons name={isCafe ? 'coffee-outline' : 'silverware-fork-knife'} size={14} color={colors.blue300} />
            <Text style={{ fontSize: 12, color: colors.blue300, fontWeight: '600', maxWidth: 120 }} numberOfLines={1}>{restaurant.name}</Text>
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
  sidebar: { position: 'absolute', top: 0, left: 0, bottom: 0, zIndex: 10, width: 230, backgroundColor: '#021e3a', borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: 'rgba(133,183,235,0.2)', paddingTop: spacing.lg, paddingBottom: spacing.huge },
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
