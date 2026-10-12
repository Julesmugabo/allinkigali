/**
 * RestaurantAdminDashboardScreen.js — Full restaurant admin dashboard.
 * Sidebar nav · Analytics · CRUD list · Add/Edit form · Photo management
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput, Image,
  ActivityIndicator, Alert, StyleSheet, FlatList, Platform,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../../components/common/GradientBackground';
import { colors, typography, spacing, radius, gutter } from '../../theme';
import { getToken, apiFetch } from '../../services/apiClient';
import { pickAndUpload } from '../../utils/uploadPhoto';

const API = process.env.EXPO_PUBLIC_API_URL || '';

const NAV_ITEMS = [
  { key: 'overview',    icon: 'view-dashboard-outline', label: 'Overview' },
  { key: 'bookings',    icon: 'calendar-clock',         label: 'Bookings' },
  { key: 'menu',        icon: 'food-outline',           label: 'Menu' },
  { key: 'list',        icon: 'silverware-fork-knife',  label: 'Restaurants' },
  { key: 'add',         icon: 'plus-circle-outline',    label: 'Add New' },
  { key: 'cuisines',    icon: 'food-variant',           label: 'Cuisines' },
];

const BOOKING_STATUS_COLORS = {
  pending:   '#F5C518',
  confirmed: '#60C080',
  rejected:  '#E05050',
  cancelled: '#888',
  completed: '#60C080',
  noshow:    '#E07030',
};

const CUISINE_OPTIONS = [
  'rwandan','ethiopian','italian','japanese','indian','chinese','mediterranean',
  'french','american','middle_eastern','lebanese','korean','thai','mexican',
  'fusion','seafood','vegetarian','vegan','steakhouse','bbq','pizza','burgers',
  'café',
];
const CUISINE_LABELS = {
  rwandan:'Rwandan', ethiopian:'Ethiopian', italian:'Italian', japanese:'Japanese',
  indian:'Indian', chinese:'Chinese', mediterranean:'Mediterranean', french:'French',
  american:'American', middle_eastern:'Middle Eastern', lebanese:'Lebanese',
  korean:'Korean', thai:'Thai', mexican:'Mexican', fusion:'Fusion',
  seafood:'Seafood', vegetarian:'Vegetarian', vegan:'Vegan',
  steakhouse:'Steakhouse', bbq:'BBQ', pizza:'Pizza', burgers:'Burgers', café:'Café',
};
const OCCASION_OPTIONS = ['business','romantic','family','friends','celebrations','casual','solo'];
const OCCASION_LABELS = { business:'Business',romantic:'Romantic',family:'Family',friends:'Friends',celebrations:'Celebrations',casual:'Casual',solo:'Solo' };
const ATMOSPHERE_OPTIONS = ['cozy','lively','quiet','elegant','rustic','modern','rooftop','outdoor'];
const DIETARY_OPTIONS = ['vegetarian','vegan','glutenfree','halal','dairyfree'];
const DIETARY_LABELS = { vegetarian:'Vegetarian',vegan:'Vegan',glutenfree:'Gluten-Free',halal:'Halal',dairyfree:'Dairy-Free' };
const SEATING_OPTIONS = ['indoor','outdoor','terrace','rooftop','private','bar'];
const FEATURE_OPTIONS = ['wifi','parking','reservation','livemusic','delivery','takeaway','bar','sundaybrunch'];
const FEATURE_LABELS = { wifi:'WiFi',parking:'Parking',reservation:'Reservation',livemusic:'Live Music',delivery:'Delivery',takeaway:'Takeaway',bar:'Bar',sundaybrunch:'Sunday Brunch' };

const EMPTY_FORM = {
  name:'', description:'', location:'', district:'', phone:'', website:'',
  cuisines:[], foods:[], occasion:[], price:2, atmosphere:[], dietary:[],
  seating:[], features:[], rating:'4.0', openStatus:'Open now', photos:[],
};

// ── Mini chart ────────────────────────────────────────────────────────────────
function MiniBar({ value, max, color }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <View style={mb.track}>
      <View style={[mb.fill, { width: `${pct}%`, backgroundColor: color || colors.blue500 }]} />
    </View>
  );
}
const mb = StyleSheet.create({
  track: { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
});

// ── Tag chip ──────────────────────────────────────────────────────────────────
function TagChip({ label, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={[tc.chip, active && tc.active]}>
      <Text style={[tc.label, active && tc.activeLabel]}>{label}</Text>
    </Pressable>
  );
}
const tc = StyleSheet.create({
  chip: { borderWidth: 1, borderColor: 'rgba(133,183,235,0.3)', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5, marginRight: 6, marginBottom: 6 },
  active: { backgroundColor: colors.blue500, borderColor: colors.blue500 },
  label: { fontSize: 11.5, color: colors.textOnNavy },
  activeLabel: { color: colors.white, fontWeight: '600' },
});

function toggle(arr, val) {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function RestaurantAdminDashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [section, setSection]         = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [editId, setEditId]           = useState(null);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [uploadingIdx, setUploadingIdx] = useState(null);
  const [foodsInput, setFoodsInput]   = useState('');
  const [bookings, setBookings]       = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [menuItems, setMenuItems]     = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuRestaurantId, setMenuRestaurantId] = useState('');
  const [menuForm, setMenuForm]       = useState({ category: 'Main', name: '', description: '', price: '', available: true });
  const [menuEditId, setMenuEditId]   = useState(null);
  const [menuSaving, setMenuSaving]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API}/restaurants`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setRestaurants(Array.isArray(data) ? data : []);
    } catch (e) {
      Alert.alert('Load failed', 'Could not load restaurants. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadBookings = useCallback(async () => {
    setBookingsLoading(true);
    try {
      const data = await apiFetch('/resto-bookings/admin?type=restaurant');
      setBookings(Array.isArray(data) ? data : []);
    } catch (e) {
      Alert.alert('Load failed', 'Could not load bookings. Check your connection.');
    } finally {
      setBookingsLoading(false);
    }
  }, []);

  const updateBookingStatus = useCallback(async (id, status) => {
    try {
      await apiFetch(`/resto-bookings/${id}/status`, { method: 'PUT', body: { status } });
      setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status } : b));
    } catch (e) {
      Alert.alert('Error', 'Could not update booking.');
    }
  }, []);

  const loadMenu = useCallback(async (restaurantId) => {
    if (!restaurantId) return;
    setMenuLoading(true);
    try {
      const data = await apiFetch(`/restaurant-menu/${restaurantId}`);
      setMenuItems(Array.isArray(data) ? data : []);
    } catch (e) {
      Alert.alert('Load failed', 'Could not load menu.');
    } finally {
      setMenuLoading(false);
    }
  }, []);

  const saveMenuItem = useCallback(async () => {
    if (!menuForm.name.trim() || !menuRestaurantId) return;
    setMenuSaving(true);
    try {
      const body = {
        restaurantId: menuRestaurantId,
        category: menuForm.category || 'Main',
        name: menuForm.name.trim(),
        description: menuForm.description || '',
        price: parseInt(menuForm.price, 10) || 0,
        available: menuForm.available !== false,
      };
      if (menuEditId) {
        await apiFetch(`/restaurant-menu/${menuEditId}`, { method: 'PUT', body });
      } else {
        await apiFetch('/restaurant-menu', { method: 'POST', body });
      }
      setMenuForm({ category: 'Main', name: '', description: '', price: '', available: true });
      setMenuEditId(null);
      await loadMenu(menuRestaurantId);
    } catch (e) {
      Alert.alert('Error', 'Could not save menu item.');
    } finally {
      setMenuSaving(false);
    }
  }, [menuForm, menuRestaurantId, menuEditId, loadMenu]);

  const deleteMenuItem = useCallback(async (id) => {
    try {
      await apiFetch(`/restaurant-menu/${id}`, { method: 'DELETE' });
      setMenuItems((prev) => prev.filter((m) => m.id !== id));
    } catch (e) {
      Alert.alert('Error', 'Could not delete item.');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => { if (section === 'bookings') loadBookings(); }, [section, loadBookings]);

  useEffect(() => {
    if (section === 'menu' && restaurants.length > 0) {
      const id = menuRestaurantId || restaurants[0].id;
      if (!menuRestaurantId) setMenuRestaurantId(restaurants[0].id);
      loadMenu(id);
    }
  }, [section, restaurants]); // eslint-disable-line

  function startEdit(r) {
    setEditId(r.id);
    setForm({
      name: r.name || '', description: r.description || '',
      location: r.location || '', district: r.district || '',
      phone: r.phone || '', website: r.website || '',
      cuisines: r.cuisines || [], foods: r.foods || [],
      occasion: r.occasion || [], price: r.price || 2,
      atmosphere: r.atmosphere || [], dietary: r.dietary || [],
      seating: r.seating || [], features: r.features || [],
      rating: String(r.rating || 4.0), openStatus: r.openStatus || 'Open now',
      photos: r.photos || [],
    });
    setFoodsInput((r.foods || []).join(', '));
    setSection('add');
    setSidebarOpen(false);
  }

  function startAdd() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setFoodsInput('');
    setSection('add');
    setSidebarOpen(false);
  }

  async function handleSave() {
    if (!form.name.trim()) return Alert.alert('Name required');
    setSaving(true);
    try {
      const token = await getToken();
      const foods = foodsInput.split(',').map((f) => f.trim()).filter(Boolean);
      const body = { ...form, foods, rating: parseFloat(form.rating) || 4.0 };
      const url = editId ? `${API}/restaurants/${editId}` : `${API}/restaurants`;
      const method = editId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Save failed');
      await load();
      setSection('list');
      Alert.alert('Saved', editId ? 'Restaurant updated.' : 'Restaurant added.');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id, name) {
    const confirmed = await new Promise((resolve) => {
      Alert.alert('Delete', `Delete "${name}"?`, [
        { text: 'Cancel', onPress: () => resolve(false) },
        { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
      ]);
    });
    if (!confirmed) return;
    try {
      const token = await getToken();
      await fetch(`${API}/restaurants/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      await load();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  }

  async function handlePickPhoto(idx) {
    try {
      setUploadingIdx(idx);
      const token = await getToken();
      const url = await pickAndUpload(token);
      const photos = [...form.photos];
      if (idx === photos.length) photos.push({ url, label: '' });
      else photos[idx] = { ...photos[idx], url };
      setForm((f) => ({ ...f, photos }));
    } catch (e) {
      Alert.alert('Upload failed', e.message);
    } finally {
      setUploadingIdx(null);
    }
  }

  // Analytics
  const avgRating = restaurants.length
    ? (restaurants.reduce((s, r) => s + r.rating, 0) / restaurants.length).toFixed(1)
    : '—';
  const cuisineCount = new Set(restaurants.flatMap((r) => r.cuisines)).size;
  const districtMap = {};
  restaurants.forEach((r) => { if (r.district) districtMap[r.district] = (districtMap[r.district] || 0) + 1; });
  const topDistricts = Object.entries(districtMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxDistrict = topDistricts[0]?.[1] || 1;

  // ── Sidebar ──────────────────────────────────────────────────────────────
  const sidebar = (
    <View style={s.sidebar}>
      <View style={s.sidebarBrand}>
        <MaterialCommunityIcons name="silverware-fork-knife" size={22} color={colors.blue300} />
        <Text style={s.sidebarTitle}>Resto Admin</Text>
        <Pressable onPress={() => setSidebarOpen(false)} style={s.sidebarClose}>
          <MaterialCommunityIcons name="close" size={18} color={colors.textOnNavyFaint} />
        </Pressable>
      </View>
      {NAV_ITEMS.map((item) => (
        <Pressable
          key={item.key}
          onPress={() => { setSection(item.key); setSidebarOpen(false); if (item.key === 'add') startAdd(); }}
          style={[s.navItem, section === item.key && item.key !== 'add' && s.navItemActive]}
        >
          <MaterialCommunityIcons name={item.icon} size={18} color={section === item.key ? colors.white : colors.blue300} />
          <Text style={[s.navLabel, section === item.key && s.navLabelActive]}>{item.label}</Text>
        </Pressable>
      ))}
      <View style={s.sidebarDivider} />
      <Pressable onPress={() => navigation.goBack()} style={s.navItem}>
        <MaterialCommunityIcons name="arrow-left" size={18} color={colors.textOnNavyFaint} />
        <Text style={[s.navLabel, { color: colors.textOnNavyFaint }]}>Back</Text>
      </Pressable>
    </View>
  );

  return (
    <GradientBackground>
      <View style={[s.root, { paddingTop: insets.top }]}>
        {/* Top bar */}
        <View style={s.topbar}>
          <Pressable onPress={() => setSidebarOpen((o) => !o)} style={s.menuBtn}>
            <MaterialCommunityIcons name="menu" size={22} color={colors.white} />
          </Pressable>
          <Text style={s.topbarTitle}>
            {section === 'overview' ? 'Overview' : section === 'bookings' ? 'Bookings' : section === 'menu' ? 'Menu Management' : section === 'list' ? 'All Restaurants' : section === 'add' ? (editId ? 'Edit Restaurant' : 'Add Restaurant') : 'Cuisines'}
          </Text>
          {section === 'list' && (
            <Pressable onPress={startAdd} style={s.addBtn}>
              <MaterialCommunityIcons name="plus" size={18} color={colors.white} />
            </Pressable>
          )}
        </View>

        {/* Sidebar overlay */}
        {sidebarOpen && <Pressable style={s.backdrop} onPress={() => setSidebarOpen(false)} />}
        {sidebarOpen && sidebar}

        {/* Main content */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.main, { paddingBottom: insets.bottom + 80 }]}>

          {/* ── BOOKINGS ── */}
          {section === 'bookings' && (
            <View>
              {bookingsLoading
                ? <ActivityIndicator color={colors.blue300} style={{ marginTop: 40 }} />
                : bookings.length === 0
                ? <View style={s.emptyState}>
                    <MaterialCommunityIcons name="calendar-blank-outline" size={48} color={colors.blue300} />
                    <Text style={s.emptyTitle}>No bookings yet</Text>
                  </View>
                : bookings.map((b) => (
                  <View key={b.id} style={s.bookingCard}>
                    <View style={s.bookingHeader}>
                      <View style={[s.statusDot, { backgroundColor: BOOKING_STATUS_COLORS[b.status] || '#888' }]} />
                      <Text style={s.bookingName}>{b.guestName}</Text>
                      <Text style={[s.bookingStatusLabel, { color: BOOKING_STATUS_COLORS[b.status] || '#888' }]}>
                        {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                      </Text>
                    </View>
                    <Text style={s.bookingMeta}>
                      {b.placeName} · {b.partySize} {b.partySize === 1 ? 'person' : 'people'}
                    </Text>
                    <Text style={s.bookingMeta}>{b.date} at {b.time}</Text>
                    {b.guestPhone ? <Text style={s.bookingPhone}>📞 {b.guestPhone}</Text> : null}
                    {b.notes ? <Text style={s.bookingNotes}>"{b.notes}"</Text> : null}
                    {b.noshowCount > 0 && (
                      <Text style={s.noshowWarning}>⚠️ {b.noshowCount} previous no-show{b.noshowCount > 1 ? 's' : ''}</Text>
                    )}
                    {b.status === 'pending' && (
                      <View style={s.bookingActions}>
                        <Pressable onPress={() => updateBookingStatus(b.id, 'confirmed')} style={[s.actionBtn, { backgroundColor: 'rgba(60,160,80,0.2)', borderColor: '#60C080' }]}>
                          <MaterialCommunityIcons name="check" size={14} color="#60C080" />
                          <Text style={[s.actionBtnLabel, { color: '#60C080' }]}>Confirm</Text>
                        </Pressable>
                        <Pressable onPress={() => updateBookingStatus(b.id, 'rejected')} style={[s.actionBtn, { backgroundColor: 'rgba(224,80,80,0.2)', borderColor: '#E05050' }]}>
                          <MaterialCommunityIcons name="close" size={14} color="#E05050" />
                          <Text style={[s.actionBtnLabel, { color: '#E05050' }]}>Reject</Text>
                        </Pressable>
                      </View>
                    )}
                    {b.status === 'confirmed' && (
                      <View style={s.bookingActions}>
                        <Pressable onPress={() => updateBookingStatus(b.id, 'completed')} style={[s.actionBtn, { backgroundColor: 'rgba(60,160,80,0.15)', borderColor: '#60C080' }]}>
                          <MaterialCommunityIcons name="check-all" size={14} color="#60C080" />
                          <Text style={[s.actionBtnLabel, { color: '#60C080' }]}>Mark Completed</Text>
                        </Pressable>
                        <Pressable onPress={() => updateBookingStatus(b.id, 'noshow')} style={[s.actionBtn, { backgroundColor: 'rgba(224,112,48,0.15)', borderColor: '#E07030' }]}>
                          <MaterialCommunityIcons name="account-off-outline" size={14} color="#E07030" />
                          <Text style={[s.actionBtnLabel, { color: '#E07030' }]}>No-Show</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                ))
              }
            </View>
          )}

          {/* ── MENU ── */}
          {section === 'menu' && (
            <View>
              {/* Restaurant picker */}
              <View style={s.menuPickerRow}>
                <MaterialCommunityIcons name="silverware-fork-knife" size={16} color={colors.blue300} />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 6 }}>
                    {restaurants.map((r) => (
                      <Pressable
                        key={r.id}
                        onPress={() => { setMenuRestaurantId(r.id); loadMenu(r.id); setMenuEditId(null); setMenuForm({ category: 'Main', name: '', description: '', price: '', available: true }); }}
                        style={[s.menuPickerChip, menuRestaurantId === r.id && s.menuPickerChipActive]}
                      >
                        <Text style={[s.menuPickerLabel, menuRestaurantId === r.id && s.menuPickerLabelActive]} numberOfLines={1}>{r.name}</Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Add / Edit form */}
              <View style={s.menuFormCard}>
                <Text style={s.cardTitle}>{menuEditId ? 'Edit Item' : 'Add Menu Item'}</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.fieldLabel}>Category</Text>
                    <TextInput
                      style={s.input}
                      value={menuForm.category}
                      onChangeText={(v) => setMenuForm((f) => ({ ...f, category: v }))}
                      placeholder="e.g. Starters, Mains"
                      placeholderTextColor={colors.textOnNavyFaint}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.fieldLabel}>Price (RWF)</Text>
                    <TextInput
                      style={s.input}
                      value={String(menuForm.price)}
                      onChangeText={(v) => setMenuForm((f) => ({ ...f, price: v }))}
                      placeholder="e.g. 12000"
                      placeholderTextColor={colors.textOnNavyFaint}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                <Text style={s.fieldLabel}>Dish Name *</Text>
                <TextInput
                  style={[s.input, { marginBottom: 8 }]}
                  value={menuForm.name}
                  onChangeText={(v) => setMenuForm((f) => ({ ...f, name: v }))}
                  placeholder="e.g. Beef Fillet"
                  placeholderTextColor={colors.textOnNavyFaint}
                />
                <Text style={s.fieldLabel}>Description (optional)</Text>
                <TextInput
                  style={[s.input, s.inputMulti, { marginBottom: 10 }]}
                  value={menuForm.description}
                  onChangeText={(v) => setMenuForm((f) => ({ ...f, description: v }))}
                  placeholder="Short description..."
                  placeholderTextColor={colors.textOnNavyFaint}
                  multiline
                />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable onPress={saveMenuItem} disabled={menuSaving || !menuForm.name.trim()} style={[s.saveBtn, { flex: 1 }, (menuSaving || !menuForm.name.trim()) && s.saveBtnDisabled]}>
                    {menuSaving
                      ? <ActivityIndicator color={colors.white} />
                      : <Text style={s.saveBtnLabel}>{menuEditId ? 'Save Changes' : 'Add Item'}</Text>}
                  </Pressable>
                  {menuEditId && (
                    <Pressable onPress={() => { setMenuEditId(null); setMenuForm({ category: 'Main', name: '', description: '', price: '', available: true }); }} style={[s.cancelBtn, { flex: 0.5 }]}>
                      <Text style={s.cancelBtnLabel}>Cancel</Text>
                    </Pressable>
                  )}
                </View>
              </View>

              {/* Menu items list grouped by category */}
              {menuLoading
                ? <ActivityIndicator color={colors.blue300} style={{ marginTop: 20 }} />
                : menuItems.length === 0
                ? <View style={s.emptyState}>
                    <MaterialCommunityIcons name="food-outline" size={40} color={colors.blue300} />
                    <Text style={s.emptyTitle}>No menu items yet</Text>
                  </View>
                : (() => {
                    const grouped = {};
                    menuItems.forEach((item) => {
                      if (!grouped[item.category]) grouped[item.category] = [];
                      grouped[item.category].push(item);
                    });
                    return Object.entries(grouped).map(([cat, items]) => (
                      <View key={cat} style={s.menuCategoryBlock}>
                        <Text style={s.menuCategoryTitle}>{cat}</Text>
                        {items.map((item) => (
                          <View key={item.id} style={s.menuItemRow}>
                            <View style={{ flex: 1 }}>
                              <Text style={s.menuItemName}>{item.name}</Text>
                              {item.description ? <Text style={s.menuItemDesc}>{item.description}</Text> : null}
                            </View>
                            <Text style={s.menuItemPrice}>{Number(item.price).toLocaleString()} RWF</Text>
                            <Pressable onPress={() => { setMenuEditId(item.id); setMenuForm({ category: item.category, name: item.name, description: item.description || '', price: String(item.price), available: item.available !== false }); }} style={s.iconBtn}>
                              <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.blue300} />
                            </Pressable>
                            <Pressable onPress={() => deleteMenuItem(item.id)} style={[s.iconBtn, { marginLeft: 2 }]}>
                              <MaterialCommunityIcons name="delete-outline" size={16} color="#e05c5c" />
                            </Pressable>
                          </View>
                        ))}
                      </View>
                    ));
                  })()
              }
            </View>
          )}

          {/* ── OVERVIEW ── */}
          {section === 'overview' && (
            <View>
              {/* Stat cards */}
              <View style={s.statRow}>
                <View style={s.statCard}>
                  <Text style={s.statNum}>{restaurants.length}</Text>
                  <Text style={s.statLabel}>Restaurants</Text>
                </View>
                <View style={s.statCard}>
                  <Text style={s.statNum}>{avgRating}</Text>
                  <Text style={s.statLabel}>Avg Rating</Text>
                </View>
                <View style={s.statCard}>
                  <Text style={s.statNum}>{cuisineCount}</Text>
                  <Text style={s.statLabel}>Cuisines</Text>
                </View>
              </View>

              {/* By district chart */}
              <View style={s.card}>
                <Text style={s.cardTitle}>Restaurants by District</Text>
                {topDistricts.length === 0 && <Text style={s.emptyNote}>No data yet</Text>}
                {topDistricts.map(([district, count]) => (
                  <View key={district} style={s.barRow}>
                    <Text style={s.barLabel} numberOfLines={1}>{district}</Text>
                    <View style={s.barTrack}>
                      <MiniBar value={count} max={maxDistrict} color={colors.blue500} />
                    </View>
                    <Text style={s.barCount}>{count}</Text>
                  </View>
                ))}
              </View>

              {/* Rating distribution */}
              <View style={s.card}>
                <Text style={s.cardTitle}>Rating Distribution</Text>
                {[5,4,3,2,1].map((star) => {
                  const cnt = restaurants.filter((r) => Math.floor(r.rating) === star).length;
                  return (
                    <View key={star} style={s.barRow}>
                      <Text style={s.barLabel}>{star} ★</Text>
                      <View style={s.barTrack}><MiniBar value={cnt} max={restaurants.length || 1} color="#F5C518" /></View>
                      <Text style={s.barCount}>{cnt}</Text>
                    </View>
                  );
                })}
              </View>

              {/* Recent restaurants */}
              <View style={s.card}>
                <Text style={s.cardTitle}>Recent Restaurants</Text>
                {restaurants.slice(0, 5).map((r) => (
                  <View key={r.id} style={s.recentRow}>
                    <MaterialCommunityIcons name="silverware-fork-knife" size={16} color={colors.blue300} />
                    <View style={{ flex: 1, marginLeft: spacing.sm }}>
                      <Text style={s.recentName}>{r.name}</Text>
                      <Text style={s.recentSub}>{r.location} · ★ {r.rating}</Text>
                    </View>
                    <Pressable onPress={() => startEdit(r)} style={s.editBtn}>
                      <MaterialCommunityIcons name="pencil-outline" size={15} color={colors.blue300} />
                    </Pressable>
                  </View>
                ))}
                {restaurants.length > 5 && (
                  <Pressable onPress={() => setSection('list')} style={s.viewAllBtn}>
                    <Text style={s.viewAllLabel}>View all {restaurants.length} restaurants →</Text>
                  </Pressable>
                )}
              </View>
            </View>
          )}

          {/* ── LIST ── */}
          {section === 'list' && (
            <View>
              {loading ? (
                <ActivityIndicator color={colors.blue300} style={{ marginTop: 40 }} />
              ) : restaurants.length === 0 ? (
                <View style={s.emptyState}>
                  <MaterialCommunityIcons name="silverware-fork-knife" size={48} color={colors.blue300} />
                  <Text style={s.emptyTitle}>No restaurants yet</Text>
                  <Pressable onPress={startAdd} style={s.emptyBtn}>
                    <Text style={s.emptyBtnLabel}>Add first restaurant</Text>
                  </Pressable>
                </View>
              ) : (
                restaurants.map((r) => (
                  <View key={r.id} style={s.listRow}>
                    {r.photos?.[0]?.url
                      ? <Image source={{ uri: r.photos[0].url }} style={s.listThumb} resizeMode="cover" />
                      : <View style={[s.listThumb, s.listThumbPlaceholder]}><MaterialCommunityIcons name="silverware-fork-knife" size={20} color={colors.blue300} /></View>}
                    <View style={{ flex: 1, marginLeft: spacing.md }}>
                      <Text style={s.listName}>{r.name}</Text>
                      <Text style={s.listSub}>{r.location} · ★ {r.rating} · {r.cuisines.slice(0,2).join(', ')}</Text>
                    </View>
                    <Pressable onPress={() => startEdit(r)} style={s.iconBtn}>
                      <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.blue300} />
                    </Pressable>
                    <Pressable onPress={() => handleDelete(r.id, r.name)} style={[s.iconBtn, { marginLeft: 4 }]}>
                      <MaterialCommunityIcons name="delete-outline" size={18} color="#e05c5c" />
                    </Pressable>
                  </View>
                ))
              )}
            </View>
          )}

          {/* ── ADD / EDIT FORM ── */}
          {section === 'add' && (
            <View>
              <FormField label="Restaurant Name *" value={form.name} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="e.g. Poivre Noir" />
              <FormField label="Description" value={form.description} onChangeText={(v) => setForm((f) => ({ ...f, description: v }))} multiline placeholder="Short description..." />
              <FormField label="Location" value={form.location} onChangeText={(v) => setForm((f) => ({ ...f, location: v }))} placeholder="e.g. Kiyovu, Kigali" />
              <FormField label="District" value={form.district} onChangeText={(v) => setForm((f) => ({ ...f, district: v }))} placeholder="e.g. Nyarugenge" />
              <FormField label="Phone" value={form.phone} onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))} placeholder="+250..." keyboardType="phone-pad" />
              <FormField label="Website" value={form.website} onChangeText={(v) => setForm((f) => ({ ...f, website: v }))} placeholder="https://..." keyboardType="url" />
              <FormField label="Open Status" value={form.openStatus} onChangeText={(v) => setForm((f) => ({ ...f, openStatus: v }))} placeholder="Open now / Closed" />
              <FormField label="Rating (1-5)" value={String(form.rating)} onChangeText={(v) => setForm((f) => ({ ...f, rating: v }))} keyboardType="decimal-pad" />

              <View style={s.priceRow}>
                <Text style={s.fieldLabel}>Price range</Text>
                <View style={s.chipRow}>
                  {[{v:1,l:'$'},{v:2,l:'$$'},{v:3,l:'$$$'},{v:4,l:'$$$$'}].map(({v,l}) => (
                    <TagChip key={v} label={l} active={form.price === v} onPress={() => setForm((f) => ({ ...f, price: v }))} />
                  ))}
                </View>
              </View>

              <ChipGroup label="Cuisines" options={CUISINE_OPTIONS} labels={CUISINE_LABELS} value={form.cuisines} onChange={(v) => setForm((f) => ({ ...f, cuisines: v }))} />

              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>Foods (comma-separated)</Text>
                <TextInput
                  style={s.input}
                  value={foodsInput}
                  onChangeText={setFoodsInput}
                  placeholder="Sushi, Ramen, Tempura..."
                  placeholderTextColor={colors.textOnNavyFaint}
                  multiline
                />
              </View>

              <ChipGroup label="Occasion" options={OCCASION_OPTIONS} labels={OCCASION_LABELS} value={form.occasion} onChange={(v) => setForm((f) => ({ ...f, occasion: v }))} />
              <ChipGroup label="Atmosphere" options={ATMOSPHERE_OPTIONS} labels={{}} value={form.atmosphere} onChange={(v) => setForm((f) => ({ ...f, atmosphere: v }))} />
              <ChipGroup label="Dietary" options={DIETARY_OPTIONS} labels={DIETARY_LABELS} value={form.dietary} onChange={(v) => setForm((f) => ({ ...f, dietary: v }))} />
              <ChipGroup label="Seating" options={SEATING_OPTIONS} labels={{}} value={form.seating} onChange={(v) => setForm((f) => ({ ...f, seating: v }))} />
              <ChipGroup label="Features" options={FEATURE_OPTIONS} labels={FEATURE_LABELS} value={form.features} onChange={(v) => setForm((f) => ({ ...f, features: v }))} />

              {/* Photos */}
              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>Photos (up to 8)</Text>
                {form.photos.map((photo, idx) => (
                  <View key={idx} style={s.photoRow}>
                    {photo.url
                      ? <Image source={{ uri: photo.url }} style={s.photoThumb} resizeMode="cover" />
                      : <View style={[s.photoThumb, s.photoThumbEmpty]}><MaterialCommunityIcons name="image-outline" size={22} color={colors.blue300} /></View>}
                    <View style={{ flex: 1, marginHorizontal: spacing.sm }}>
                      <TextInput
                        style={s.photoLabelInput}
                        value={photo.label}
                        onChangeText={(v) => {
                          const photos = [...form.photos];
                          photos[idx] = { ...photos[idx], label: v };
                          setForm((f) => ({ ...f, photos }));
                        }}
                        placeholder="Label (e.g. Interior, Terrace)"
                        placeholderTextColor={colors.textOnNavyFaint}
                      />
                    </View>
                    <Pressable onPress={() => handlePickPhoto(idx)} style={s.photoPickBtn}>
                      {uploadingIdx === idx
                        ? <ActivityIndicator size="small" color={colors.white} />
                        : <MaterialCommunityIcons name="camera-outline" size={18} color={colors.white} />}
                    </Pressable>
                    <Pressable onPress={() => setForm((f) => ({ ...f, photos: f.photos.filter((_, i) => i !== idx) }))} style={s.photoRemoveBtn}>
                      <MaterialCommunityIcons name="close" size={16} color="#e05c5c" />
                    </Pressable>
                  </View>
                ))}
                {form.photos.length < 8 && (
                  <Pressable onPress={() => handlePickPhoto(form.photos.length)} style={s.addPhotoBtn}>
                    {uploadingIdx === form.photos.length
                      ? <ActivityIndicator size="small" color={colors.blue300} />
                      : <MaterialCommunityIcons name="plus" size={16} color={colors.blue300} />}
                    <Text style={s.addPhotoBtnLabel}>{form.photos.length === 0 ? 'Add photo' : 'Add another photo'}</Text>
                  </Pressable>
                )}
              </View>

              <Pressable onPress={handleSave} style={[s.saveBtn, saving && s.saveBtnDisabled]} disabled={saving}>
                {saving
                  ? <ActivityIndicator color={colors.white} />
                  : <Text style={s.saveBtnLabel}>{editId ? 'Save Changes' : 'Add Restaurant'}</Text>}
              </Pressable>
              {editId && (
                <Pressable onPress={() => { setSection('list'); setEditId(null); }} style={s.cancelBtn}>
                  <Text style={s.cancelBtnLabel}>Cancel</Text>
                </Pressable>
              )}
            </View>
          )}

          {/* ── CUISINES ── */}
          {section === 'cuisines' && (
            <View style={s.card}>
              <Text style={s.cardTitle}>All Cuisine Types</Text>
              <View style={s.chipRow}>
                {CUISINE_OPTIONS.map((c) => {
                  const count = restaurants.filter((r) => r.cuisines.includes(c)).length;
                  return (
                    <View key={c} style={s.cuisineChip}>
                      <Text style={s.cuisineChipLabel}>{CUISINE_LABELS[c] || c}</Text>
                      {count > 0 && <View style={s.cuisineCount}><Text style={s.cuisineCountLabel}>{count}</Text></View>}
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </GradientBackground>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function FormField({ label, value, onChangeText, placeholder, multiline, keyboardType }) {
  return (
    <View style={s.fieldGroup}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        style={[s.input, multiline && s.inputMulti]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textOnNavyFaint}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize="none"
      />
    </View>
  );
}

function ChipGroup({ label, options, labels, value, onChange }) {
  return (
    <View style={s.fieldGroup}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={s.chipRow}>
        {options.map((o) => (
          <TagChip key={o} label={labels[o] || o} active={value.includes(o)} onPress={() => onChange(toggle(value, o))} />
        ))}
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1 },
  topbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: gutter, paddingBottom: spacing.sm, gap: spacing.sm },
  menuBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  topbarTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: colors.white },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.blue500, alignItems: 'center', justifyContent: 'center' },

  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9, backgroundColor: 'rgba(0,0,0,0.5)' },
  sidebar: {
    position: 'absolute', top: 0, left: 0, bottom: 0, zIndex: 10,
    width: 220, backgroundColor: '#021e3a',
    borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: 'rgba(133,183,235,0.2)',
    paddingTop: spacing.lg, paddingBottom: spacing.huge,
  },
  sidebarBrand: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, marginBottom: spacing.lg, gap: spacing.sm },
  sidebarTitle: { flex: 1, fontSize: 15, fontWeight: '800', color: colors.white },
  sidebarClose: { padding: 4 },
  sidebarDivider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(133,183,235,0.15)', marginVertical: spacing.sm, marginHorizontal: spacing.md },
  navItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2, gap: spacing.sm, borderRadius: radius.md, marginHorizontal: spacing.xs, marginBottom: 2 },
  navItemActive: { backgroundColor: 'rgba(55,138,221,0.25)' },
  navLabel: { fontSize: 13.5, color: colors.blue300, fontWeight: '600' },
  navLabelActive: { color: colors.white },

  main: { paddingHorizontal: gutter, paddingTop: spacing.md },

  statRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  statNum: { fontSize: 26, fontWeight: '800', color: colors.white },
  statLabel: { fontSize: 11, color: colors.textOnNavyFaint, marginTop: 2 },

  card: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(133,183,235,0.15)' },
  cardTitle: { fontSize: 13, fontWeight: '700', color: colors.white, marginBottom: spacing.md },

  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: spacing.sm },
  barLabel: { width: 80, fontSize: 12, color: colors.textOnNavy },
  barTrack: { flex: 1 },
  barCount: { width: 24, fontSize: 12, color: colors.textOnNavyFaint, textAlign: 'right' },

  recentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(133,183,235,0.1)' },
  recentName: { fontSize: 13, fontWeight: '600', color: colors.white },
  recentSub: { fontSize: 11, color: colors.textOnNavyFaint, marginTop: 1 },
  editBtn: { padding: 6 },
  emptyNote: { fontSize: 12, color: colors.textOnNavyFaint },
  viewAllBtn: { marginTop: spacing.sm },
  viewAllLabel: { fontSize: 12, color: colors.blue300 },

  listRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.sm },
  listThumb: { width: 52, height: 52, borderRadius: radius.sm },
  listThumbPlaceholder: { backgroundColor: 'rgba(55,138,221,0.15)', alignItems: 'center', justifyContent: 'center' },
  listName: { fontSize: 13, fontWeight: '700', color: colors.white },
  listSub: { fontSize: 11, color: colors.textOnNavyFaint, marginTop: 2 },
  iconBtn: { padding: 8 },

  emptyState: { alignItems: 'center', paddingTop: 60, gap: spacing.md },
  emptyTitle: { fontSize: 15, color: colors.textOnNavy },
  emptyBtn: { backgroundColor: colors.blue500, borderRadius: radius.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  emptyBtnLabel: { fontSize: 13, fontWeight: '700', color: colors.white },

  bookingCard: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(133,183,235,0.15)' },
  bookingHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs, gap: spacing.xs },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  bookingName: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.white },
  bookingStatusLabel: { fontSize: 12, fontWeight: '600' },
  bookingMeta: { fontSize: 13, color: colors.textOnNavy, marginBottom: 2 },
  bookingPhone: { fontSize: 13, color: colors.blue300, marginTop: 2 },
  bookingNotes: { fontSize: 12, color: colors.textOnNavyFaint, fontStyle: 'italic', marginTop: spacing.xs },
  noshowWarning: { fontSize: 12, color: '#E07030', marginTop: spacing.xs },
  bookingActions: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: spacing.xs + 2, borderRadius: radius.sm, borderWidth: 1 },
  actionBtnLabel: { fontSize: 12, fontWeight: '700' },

  fieldGroup: { marginBottom: spacing.lg },
  fieldLabel: { fontSize: 11.5, fontWeight: '700', color: colors.textOnNavyFaint, marginBottom: spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: Platform.OS === 'web' ? spacing.sm : 12, color: colors.white, fontSize: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(133,183,235,0.25)' },
  inputMulti: { minHeight: 80, textAlignVertical: 'top', paddingTop: spacing.sm },

  priceRow: { marginBottom: spacing.lg },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },

  photoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  photoThumb: { width: 56, height: 56, borderRadius: radius.sm },
  photoThumbEmpty: { backgroundColor: 'rgba(55,138,221,0.12)', alignItems: 'center', justifyContent: 'center' },
  photoLabelInput: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 8, color: colors.white, fontSize: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(133,183,235,0.2)' },
  photoPickBtn: { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.blue500, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  photoRemoveBtn: { width: 32, height: 32, borderRadius: radius.sm, backgroundColor: 'rgba(224,92,92,0.15)', alignItems: 'center', justifyContent: 'center' },
  addPhotoBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.sm },
  addPhotoBtnLabel: { fontSize: 13, color: colors.blue300, fontWeight: '600' },

  saveBtn: { backgroundColor: colors.blue500, borderRadius: radius.md, paddingVertical: spacing.md + 2, alignItems: 'center', marginBottom: spacing.sm },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnLabel: { fontSize: 15, fontWeight: '700', color: colors.white },
  cancelBtn: { borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(133,183,235,0.3)' },
  cancelBtnLabel: { fontSize: 14, color: colors.textOnNavy },

  menuPickerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, gap: 4 },
  menuPickerChip: { borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(133,183,235,0.3)', backgroundColor: 'rgba(255,255,255,0.05)' },
  menuPickerChipActive: { backgroundColor: colors.blue500, borderColor: colors.blue500 },
  menuPickerLabel: { fontSize: 12, color: colors.textOnNavy, fontWeight: '600' },
  menuPickerLabelActive: { color: colors.white },
  menuFormCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(133,183,235,0.15)' },
  menuCategoryBlock: { marginBottom: spacing.lg },
  menuCategoryTitle: { fontSize: 13, fontWeight: '800', color: colors.blue300, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.sm, paddingBottom: spacing.xs, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(133,183,235,0.2)' },
  menuItemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(133,183,235,0.08)', gap: 4 },
  menuItemName: { fontSize: 13, fontWeight: '600', color: colors.white },
  menuItemDesc: { fontSize: 11, color: colors.textOnNavyFaint, marginTop: 1 },
  menuItemPrice: { fontSize: 13, fontWeight: '700', color: '#60C080', marginRight: 4 },

  cuisineChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(55,138,221,0.12)', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5, marginRight: 6, marginBottom: 6, gap: 4 },
  cuisineChipLabel: { fontSize: 12, color: colors.blue300 },
  cuisineCount: { backgroundColor: colors.blue500, borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1 },
  cuisineCountLabel: { fontSize: 10, color: colors.white, fontWeight: '700' },
});
