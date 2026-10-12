/**
 * RestaurantOwnerDashboardScreen.js — Dashboard for a restaurant owner.
 * Manages only their own listing: profile, photos, menu, bookings.
 * Sidebar navigation, designed to stay open on a laptop/desktop.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput, Image,
  ActivityIndicator, Alert, StyleSheet, Platform,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientBackground from '../../components/common/GradientBackground';
import { colors, typography, spacing, radius, gutter } from '../../theme';
import { apiFetch, getToken } from '../../services/apiClient';
import { pickAndUpload } from '../../utils/uploadPhoto';
import { useUser } from '../../context/UserContext';

const NAV_ITEMS = [
  { key: 'overview',  icon: 'view-dashboard-outline', label: 'Overview' },
  { key: 'bookings',  icon: 'calendar-clock',         label: 'Bookings' },
  { key: 'menu',      icon: 'food-outline',            label: 'Menu' },
  { key: 'photos',    icon: 'image-multiple-outline',  label: 'Photos' },
  { key: 'profile',   icon: 'storefront-outline',      label: 'My Profile' },
];

const BOOKING_STATUS_COLORS = {
  pending:   '#F5C518',
  confirmed: '#60C080',
  rejected:  '#E05050',
  cancelled: '#888',
  completed: '#60C080',
  noshow:    '#E07030',
};

const MENU_CATEGORIES = ['Starters','Salads','Soups','Mains','Pasta','Pizza','Burgers','Sandwiches','Sides','Desserts','Drinks','Breakfast','Brunch','Specials','Other'];

export default function RestaurantOwnerDashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const isCafe = user?.role === 'coffeeshop';

  const [section, setSection]         = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Restaurant data
  const [restaurant, setRestaurant]   = useState(null);
  const [restoLoading, setRestoLoading] = useState(true);

  // Bookings
  const [bookings, setBookings]         = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  // Menu
  const [menuItems, setMenuItems]     = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuForm, setMenuForm]       = useState({ category: 'Mains', name: '', description: '', price: '', available: true, photoUrl: '' });
  const [menuPhotoUploading, setMenuPhotoUploading] = useState(false);
  const [menuEditId, setMenuEditId]   = useState(null);
  const [menuSaving, setMenuSaving]   = useState(false);

  // Profile edit
  const [profileForm, setProfileForm] = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);

  // Photos
  const [uploadingIdx, setUploadingIdx] = useState(null);

  // ── Load restaurant ──────────────────────────────────────────────────────
  const loadRestaurant = useCallback(async () => {
    setRestoLoading(true);
    try {
      const data = await apiFetch('/my-restaurant');
      setRestaurant(data);
      setProfileForm({
        name: data.name || '',
        description: data.description || '',
        location: data.location || '',
        district: data.district || '',
        phone: data.phone || '',
        website: data.website || '',
        openStatus: data.openStatus || data.open_status || 'Open now',
        openHours: data.openHours || data.open_hours || '',
        photos: data.photos || [],
      });
    } catch (e) {
      console.error('load restaurant', e);
    } finally {
      setRestoLoading(false);
    }
  }, []);

  // ── Load bookings ────────────────────────────────────────────────────────
  const loadBookings = useCallback(async () => {
    setBookingsLoading(true);
    try {
      const data = await apiFetch('/my-restaurant/bookings');
      setBookings(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('load bookings', e);
    } finally {
      setBookingsLoading(false);
    }
  }, []);

  const updateBookingStatus = useCallback(async (id, status) => {
    try {
      await apiFetch(`/my-restaurant/bookings/${id}/status`, { method: 'PUT', body: { status } });
      setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status } : b));
    } catch {
      Alert.alert('Error', 'Could not update booking.');
    }
  }, []);

  // ── Load menu ────────────────────────────────────────────────────────────
  const loadMenu = useCallback(async () => {
    setMenuLoading(true);
    try {
      const endpoint = isCafe ? '/my-restaurant/cs-menu' : '/my-restaurant/menu';
      const data = await apiFetch(endpoint);
      setMenuItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('load menu', e);
    } finally {
      setMenuLoading(false);
    }
  }, [isCafe]);

  const saveMenuItem = useCallback(async () => {
    if (!menuForm.name.trim()) return;
    setMenuSaving(true);
    try {
      const defaultCat = isCafe ? 'Drinks' : 'Mains';
      const body = JSON.stringify({
        category: menuForm.category || defaultCat,
        name: menuForm.name.trim(),
        description: menuForm.description || '',
        price: parseInt(menuForm.price, 10) || 0,
        available: menuForm.available !== false,
        photoUrl: menuForm.photoUrl?.trim() || null,
      });
      const base = isCafe ? '/my-restaurant/cs-menu' : '/my-restaurant/menu';
      if (menuEditId) {
        await apiFetch(`${base}/${menuEditId}`, { method: 'PUT', body });
      } else {
        await apiFetch(base, { method: 'POST', body });
      }
      setMenuForm({ category: defaultCat, name: '', description: '', price: '', available: true, photoUrl: '' });
      setMenuEditId(null);
      await loadMenu();
    } catch {
      Alert.alert('Error', 'Could not save menu item.');
    } finally {
      setMenuSaving(false);
    }
  }, [menuForm, menuEditId, loadMenu, isCafe]);

  const deleteMenuItem = useCallback(async (id) => {
    try {
      const base = isCafe ? '/my-restaurant/cs-menu' : '/my-restaurant/menu';
      await apiFetch(`${base}/${id}`, { method: 'DELETE' });
      setMenuItems((prev) => prev.filter((m) => m.id !== id));
    } catch {
      Alert.alert('Error', 'Could not delete item.');
    }
  }, [isCafe]);

  // ── Save profile ─────────────────────────────────────────────────────────
  const saveProfile = useCallback(async () => {
    if (!profileForm?.name?.trim()) return Alert.alert('Name required');
    setProfileSaving(true);
    try {
      const data = await apiFetch('/my-restaurant', { method: 'PUT', body: profileForm });
      setRestaurant(data);
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch {
      Alert.alert('Error', 'Could not save profile.');
    } finally {
      setProfileSaving(false);
    }
  }, [profileForm]);

  // ── Photo upload ─────────────────────────────────────────────────────────
  const handlePickPhoto = useCallback(async (idx) => {
    try {
      setUploadingIdx(idx);
      const token = await getToken();
      const url = await pickAndUpload(token);
      const photos = [...(profileForm?.photos || [])];
      if (idx === photos.length) photos.push({ url, label: '' });
      else photos[idx] = { ...photos[idx], url };
      setProfileForm((f) => ({ ...f, photos }));
    } catch (e) {
      Alert.alert('Upload failed', e.message);
    } finally {
      setUploadingIdx(null);
    }
  }, [profileForm]);

  const handleMenuPhotoUpload = useCallback(async () => {
    try {
      setMenuPhotoUploading(true);
      const token = await getToken();
      const url = await pickAndUpload(token);
      setMenuForm((f) => ({ ...f, photoUrl: url }));
    } catch (e) {
      Alert.alert('Upload failed', e.message);
    } finally {
      setMenuPhotoUploading(false);
    }
  }, []);

  // ── Effects ──────────────────────────────────────────────────────────────
  useEffect(() => { loadRestaurant(); }, [loadRestaurant]);
  useEffect(() => { if (section === 'bookings') loadBookings(); }, [section, loadBookings]);
  useEffect(() => { if (section === 'menu') loadMenu(); }, [section, loadMenu]);

  // ── Stats ────────────────────────────────────────────────────────────────
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayBookings = bookings.filter((b) => b.date === todayStr && b.status !== 'rejected' && b.status !== 'cancelled').length;
  const pendingCount = bookings.filter((b) => b.status === 'pending').length;

  // ── Sidebar ──────────────────────────────────────────────────────────────
  const sidebar = (
    <View style={s.sidebar}>
      <View style={s.sidebarBrand}>
        <MaterialCommunityIcons name={isCafe ? 'coffee-outline' : 'silverware-fork-knife'} size={20} color={colors.blue300} />
        <Text style={s.sidebarTitle} numberOfLines={1}>{restaurant?.name || (isCafe ? 'My Coffee Shop' : 'My Restaurant')}</Text>
        <Pressable onPress={() => setSidebarOpen(false)} style={s.sidebarClose}>
          <MaterialCommunityIcons name="close" size={16} color={colors.textOnNavyFaint} />
        </Pressable>
      </View>

      {NAV_ITEMS.map((item) => (
        <Pressable
          key={item.key}
          onPress={() => { setSection(item.key); setSidebarOpen(false); }}
          style={[s.navItem, section === item.key && s.navItemActive]}
        >
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

  if (restoLoading) {
    return (
      <GradientBackground>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.blue300} size="large" />
          <Text style={{ color: colors.textOnNavy, marginTop: spacing.md }}>Loading your {isCafe ? 'coffee shop' : 'restaurant'}…</Text>
        </View>
      </GradientBackground>
    );
  }

  if (!restaurant) {
    return (
      <GradientBackground>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: gutter }}>
          <MaterialCommunityIcons name={isCafe ? 'coffee-outline' : 'silverware-fork-knife'} size={52} color={colors.blue300} />
          <Text style={{ color: colors.white, fontSize: 18, fontWeight: '700', marginTop: spacing.lg, textAlign: 'center' }}>No {isCafe ? 'coffee shop' : 'restaurant'} linked</Text>
          <Text style={{ color: colors.textOnNavy, fontSize: 13.5, marginTop: spacing.sm, textAlign: 'center' }}>Contact the director to link your account to your {isCafe ? 'coffee shop' : 'restaurant'}.</Text>
          <Pressable onPress={() => navigation.goBack()} style={{ marginTop: spacing.xl }}>
            <Text style={{ color: colors.blue300, fontWeight: '600' }}>← Go back</Text>
          </Pressable>
        </View>
      </GradientBackground>
    );
  }

  const topbarTitles = { overview: 'Overview', bookings: 'Bookings', menu: 'My Menu', photos: 'Photos', profile: 'My Profile' };

  return (
    <GradientBackground>
      <View style={[s.root, { paddingTop: insets.top }]}>
        {/* Top bar */}
        <View style={s.topbar}>
          <Pressable onPress={() => setSidebarOpen((o) => !o)} style={s.menuBtn}>
            <MaterialCommunityIcons name="menu" size={22} color={colors.white} />
            {pendingCount > 0 && <View style={s.menuBtnBadge} />}
          </Pressable>
          <Text style={s.topbarTitle}>{topbarTitles[section] || ''}</Text>
          <View style={s.topbarRestaurant}>
            <MaterialCommunityIcons name={isCafe ? 'coffee-outline' : 'silverware-fork-knife'} size={14} color={colors.blue300} />
            <Text style={s.topbarRestaurantName} numberOfLines={1}>{restaurant.name}</Text>
          </View>
        </View>

        {sidebarOpen && <Pressable style={s.backdrop} onPress={() => setSidebarOpen(false)} />}
        {sidebarOpen && sidebar}

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.main, { paddingBottom: insets.bottom + 80 }]}>

          {/* ── OVERVIEW ── */}
          {section === 'overview' && (
            <View>
              <View style={s.statRow}>
                <View style={s.statCard}>
                  <Text style={s.statNum}>{todayBookings}</Text>
                  <Text style={s.statLabel}>Today's bookings</Text>
                </View>
                <View style={s.statCard}>
                  <Text style={[s.statNum, pendingCount > 0 && { color: '#F5C518' }]}>{pendingCount}</Text>
                  <Text style={s.statLabel}>Pending</Text>
                </View>
                <View style={s.statCard}>
                  <Text style={s.statNum}>{menuItems.length || '—'}</Text>
                  <Text style={s.statLabel}>Menu items</Text>
                </View>
              </View>

              {/* Quick actions */}
              <View style={s.card}>
                <Text style={s.cardTitle}>Quick actions</Text>
                <View style={s.quickActions}>
                  {[
                    { icon: 'calendar-clock', label: 'View bookings', key: 'bookings', badge: pendingCount },
                    { icon: 'food-outline', label: 'Edit menu', key: 'menu' },
                    { icon: 'image-multiple-outline', label: 'Manage photos', key: 'photos' },
                    { icon: 'storefront-outline', label: 'Edit profile', key: 'profile' },
                  ].map((a) => (
                    <Pressable key={a.key} onPress={() => setSection(a.key)} style={s.quickAction}>
                      <View style={s.quickActionIcon}>
                        <MaterialCommunityIcons name={a.icon} size={22} color={colors.blue300} />
                        {a.badge > 0 && <View style={s.quickBadge}><Text style={s.quickBadgeLabel}>{a.badge}</Text></View>}
                      </View>
                      <Text style={s.quickActionLabel}>{a.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Restaurant info card */}
              <View style={s.card}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                  {(restaurant.photos || [])[0]?.url
                    ? <Image source={{ uri: restaurant.photos[0].url }} style={s.overviewThumb} resizeMode="cover" />
                    : <View style={[s.overviewThumb, { backgroundColor: 'rgba(55,138,221,0.15)', alignItems: 'center', justifyContent: 'center' }]}>
                        <MaterialCommunityIcons name="silverware-fork-knife" size={28} color={colors.blue300} />
                      </View>}
                  <View style={{ flex: 1 }}>
                    <Text style={s.overviewName}>{restaurant.name}</Text>
                    <Text style={s.overviewLocation}>{restaurant.location}</Text>
                    <Text style={[s.overviewStatus, { color: restaurant.openStatus === 'Open now' ? '#60C080' : '#E05050' }]}>
                      {restaurant.openStatus || 'Open now'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* ── BOOKINGS ── */}
          {section === 'bookings' && (
            <View>
              {bookingsLoading
                ? <ActivityIndicator color={colors.blue300} style={{ marginTop: 40 }} />
                : bookings.length === 0
                ? <View style={s.emptyState}>
                    <MaterialCommunityIcons name="calendar-blank-outline" size={48} color={colors.blue300} />
                    <Text style={s.emptyTitle}>No bookings yet</Text>
                    <Text style={s.emptyDesc}>When customers book a table, they'll appear here.</Text>
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
                    <Text style={s.bookingMeta}>{b.partySize} {b.partySize === 1 ? 'person' : 'people'} · {b.date} at {b.time}</Text>
                    {b.guestPhone ? <Text style={s.bookingPhone}>📞 {b.guestPhone}</Text> : null}
                    {b.notes ? <Text style={s.bookingNotes}>"{b.notes}"</Text> : null}
                    {b.noshowCount > 0 && <Text style={s.noshowWarning}>⚠️ {b.noshowCount} previous no-show{b.noshowCount > 1 ? 's' : ''}</Text>}
                    {b.status === 'pending' && (
                      <View style={s.bookingActions}>
                        <Pressable onPress={() => updateBookingStatus(b.id, 'confirmed')} style={[s.actionBtn, { backgroundColor: 'rgba(60,160,80,0.2)', borderColor: '#60C080' }]}>
                          <MaterialCommunityIcons name="check" size={14} color="#60C080" />
                          <Text style={[s.actionBtnLabel, { color: '#60C080' }]}>Confirm</Text>
                        </Pressable>
                        <Pressable onPress={() => updateBookingStatus(b.id, 'rejected')} style={[s.actionBtn, { backgroundColor: 'rgba(224,80,80,0.2)', borderColor: '#E05050' }]}>
                          <MaterialCommunityIcons name="close" size={14} color="#E05050" />
                          <Text style={[s.actionBtnLabel, { color: '#E05050' }]}>Decline</Text>
                        </Pressable>
                      </View>
                    )}
                    {b.status === 'confirmed' && (
                      <View style={s.bookingActions}>
                        <Pressable onPress={() => updateBookingStatus(b.id, 'completed')} style={[s.actionBtn, { backgroundColor: 'rgba(60,160,80,0.15)', borderColor: '#60C080' }]}>
                          <MaterialCommunityIcons name="check-all" size={14} color="#60C080" />
                          <Text style={[s.actionBtnLabel, { color: '#60C080' }]}>Completed</Text>
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
              {/* Add / Edit form */}
              <View style={s.menuFormCard}>
                <Text style={s.cardTitle}>{menuEditId ? 'Edit Dish' : 'Add a Dish'}</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.fieldLabel}>Category</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        {MENU_CATEGORIES.map((cat) => (
                          <Pressable
                            key={cat}
                            onPress={() => setMenuForm((f) => ({ ...f, category: cat }))}
                            style={[s.catChip, menuForm.category === cat && s.catChipActive]}
                          >
                            <Text style={[s.catChipLabel, menuForm.category === cat && s.catChipLabelActive]}>{cat}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                </View>
                <Text style={s.fieldLabel}>Dish Name *</Text>
                <TextInput
                  style={[s.input, { marginBottom: 8 }]}
                  value={menuForm.name}
                  onChangeText={(v) => setMenuForm((f) => ({ ...f, name: v }))}
                  placeholder="e.g. Grilled Salmon"
                  placeholderTextColor={colors.textOnNavyFaint}
                />
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
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
                  <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                    <Pressable
                      onPress={() => setMenuForm((f) => ({ ...f, available: !f.available }))}
                      style={[s.availToggle, menuForm.available && s.availToggleOn]}
                    >
                      <MaterialCommunityIcons name={menuForm.available ? 'check-circle' : 'close-circle-outline'} size={16} color={menuForm.available ? '#60C080' : colors.textOnNavyFaint} />
                      <Text style={[s.availToggleLabel, menuForm.available && { color: '#60C080' }]}>
                        {menuForm.available ? 'Available' : 'Unavailable'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
                <Text style={s.fieldLabel}>Photo (optional)</Text>
                <View style={s.menuPhotoRow}>
                  {menuForm.photoUrl ? (
                    <View style={s.menuPhotoPreview}>
                      <Image source={{ uri: menuForm.photoUrl }} style={s.menuPhotoThumb} resizeMode="cover" />
                      <Pressable onPress={() => setMenuForm((f) => ({ ...f, photoUrl: '' }))} style={s.menuPhotoRemove}>
                        <MaterialCommunityIcons name="close-circle" size={18} color="#e05c5c" />
                      </Pressable>
                    </View>
                  ) : null}
                  <Pressable onPress={handleMenuPhotoUpload} disabled={menuPhotoUploading} style={s.menuPhotoBtn}>
                    {menuPhotoUploading
                      ? <ActivityIndicator size="small" color={colors.blue300} />
                      : <MaterialCommunityIcons name="camera-plus-outline" size={20} color={colors.blue300} />}
                    <Text style={s.menuPhotoBtnLabel}>{menuForm.photoUrl ? 'Change photo' : 'Upload photo'}</Text>
                  </Pressable>
                </View>
                <Text style={s.fieldLabel}>Description (optional)</Text>
                <TextInput
                  style={[s.input, s.inputMulti, { marginBottom: 10 }]}
                  value={menuForm.description}
                  onChangeText={(v) => setMenuForm((f) => ({ ...f, description: v }))}
                  placeholder="Ingredients, preparation, allergens…"
                  placeholderTextColor={colors.textOnNavyFaint}
                  multiline
                />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable onPress={saveMenuItem} disabled={menuSaving || !menuForm.name.trim()} style={[s.saveBtn, { flex: 1 }, (menuSaving || !menuForm.name.trim()) && s.saveBtnDisabled]}>
                    {menuSaving
                      ? <ActivityIndicator color={colors.white} />
                      : <Text style={s.saveBtnLabel}>{menuEditId ? 'Save Changes' : 'Add Dish'}</Text>}
                  </Pressable>
                  {menuEditId && (
                    <Pressable onPress={() => { setMenuEditId(null); setMenuForm({ category: 'Mains', name: '', description: '', price: '', available: true }); }} style={[s.cancelBtn, { flex: 0.5 }]}>
                      <Text style={s.cancelBtnLabel}>Cancel</Text>
                    </Pressable>
                  )}
                </View>
              </View>

              {/* Menu list */}
              {menuLoading
                ? <ActivityIndicator color={colors.blue300} style={{ marginTop: 20 }} />
                : menuItems.length === 0
                ? <View style={s.emptyState}>
                    <MaterialCommunityIcons name="food-outline" size={40} color={colors.blue300} />
                    <Text style={s.emptyTitle}>No dishes yet</Text>
                    <Text style={s.emptyDesc}>Add your dishes above — customers will see them on your page.</Text>
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
                          <View key={item.id} style={[s.menuItemRow, !item.available && { opacity: 0.45 }]}>
                            <View style={{ flex: 1 }}>
                              <Text style={s.menuItemName}>{item.name}</Text>
                              {item.description ? <Text style={s.menuItemDesc}>{item.description}</Text> : null}
                              {!item.available && <Text style={{ fontSize: 11, color: '#E07030', marginTop: 2 }}>Unavailable</Text>}
                            </View>
                            <Text style={s.menuItemPrice}>{Number(item.price).toLocaleString()} RWF</Text>
                            <Pressable
                              onPress={() => { setMenuEditId(item.id); setMenuForm({ category: item.category, name: item.name, description: item.description || '', price: String(item.price), available: item.available !== false, photoUrl: item.photo_url || '' }); }}
                              style={s.iconBtn}
                            >
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

          {/* ── PHOTOS ── */}
          {section === 'photos' && profileForm && (
            <View>
              <View style={s.card}>
                <Text style={s.cardTitle}>Restaurant Photos</Text>
                <Text style={{ fontSize: 13, color: colors.textOnNavyFaint, marginBottom: spacing.md }}>
                  These photos appear on your listing. Add your best shots — {isCafe ? 'coffee, interior, barista, ambiance' : 'food, interior, terrace, team'}.
                </Text>
                {(profileForm.photos || []).map((photo, idx) => (
                  <View key={idx} style={s.photoRow}>
                    {photo.url
                      ? <Image source={{ uri: photo.url }} style={s.photoThumb} resizeMode="cover" />
                      : <View style={[s.photoThumb, s.photoThumbEmpty]}><MaterialCommunityIcons name="image-outline" size={22} color={colors.blue300} /></View>}
                    <View style={{ flex: 1, marginHorizontal: spacing.sm }}>
                      <TextInput
                        style={s.photoLabelInput}
                        value={photo.label}
                        onChangeText={(v) => {
                          const photos = [...profileForm.photos];
                          photos[idx] = { ...photos[idx], label: v };
                          setProfileForm((f) => ({ ...f, photos }));
                        }}
                        placeholder="Label (e.g. Terrace, Interior)"
                        placeholderTextColor={colors.textOnNavyFaint}
                      />
                    </View>
                    <Pressable onPress={() => handlePickPhoto(idx)} style={s.photoPickBtn}>
                      {uploadingIdx === idx
                        ? <ActivityIndicator size="small" color={colors.white} />
                        : <MaterialCommunityIcons name="camera-outline" size={18} color={colors.white} />}
                    </Pressable>
                    <Pressable onPress={() => setProfileForm((f) => ({ ...f, photos: f.photos.filter((_, i) => i !== idx) }))} style={s.photoRemoveBtn}>
                      <MaterialCommunityIcons name="close" size={16} color="#e05c5c" />
                    </Pressable>
                  </View>
                ))}
                {(profileForm.photos || []).length < 10 && (
                  <Pressable onPress={() => handlePickPhoto((profileForm.photos || []).length)} style={s.addPhotoBtn}>
                    {uploadingIdx === (profileForm.photos || []).length
                      ? <ActivityIndicator size="small" color={colors.blue300} />
                      : <MaterialCommunityIcons name="plus" size={16} color={colors.blue300} />}
                    <Text style={s.addPhotoBtnLabel}>Add photo</Text>
                  </Pressable>
                )}
              </View>
              <Pressable onPress={saveProfile} style={[s.saveBtn, profileSaving && s.saveBtnDisabled]} disabled={profileSaving}>
                {profileSaving ? <ActivityIndicator color={colors.white} /> : <Text style={s.saveBtnLabel}>Save Photos</Text>}
              </Pressable>
            </View>
          )}

          {/* ── PROFILE ── */}
          {section === 'profile' && profileForm && (
            <View>
              <ProfileField label={`${isCafe ? 'Coffee Shop' : 'Restaurant'} Name *`} value={profileForm.name} onChange={(v) => setProfileForm((f) => ({ ...f, name: v }))} placeholder={`Your ${isCafe ? 'coffee shop' : 'restaurant'} name`} />
              <ProfileField label="Description" value={profileForm.description} onChange={(v) => setProfileForm((f) => ({ ...f, description: v }))} placeholder={`What makes your ${isCafe ? 'coffee shop' : 'restaurant'} special…`} multiline />
              <ProfileField label="Location" value={profileForm.location} onChange={(v) => setProfileForm((f) => ({ ...f, location: v }))} placeholder="e.g. Kiyovu, Kigali" />
              <ProfileField label="District" value={profileForm.district} onChange={(v) => setProfileForm((f) => ({ ...f, district: v }))} placeholder="e.g. Nyarugenge" />
              <ProfileField label="Phone" value={profileForm.phone} onChange={(v) => setProfileForm((f) => ({ ...f, phone: v }))} placeholder="+250 7XX XXX XXX" keyboardType="phone-pad" />
              <ProfileField label="Website" value={profileForm.website} onChange={(v) => setProfileForm((f) => ({ ...f, website: v }))} placeholder="https://..." keyboardType="url" />
              <ProfileField label="Open Status" value={profileForm.openStatus} onChange={(v) => setProfileForm((f) => ({ ...f, openStatus: v }))} placeholder="Open now / Closed" />
              <ProfileField label="Opening Hours" value={profileForm.openHours} onChange={(v) => setProfileForm((f) => ({ ...f, openHours: v }))} placeholder="e.g. Mon–Sat: 11am–10pm, Sun: Closed" />

              <Pressable onPress={saveProfile} style={[s.saveBtn, profileSaving && s.saveBtnDisabled]} disabled={profileSaving}>
                {profileSaving ? <ActivityIndicator color={colors.white} /> : <Text style={s.saveBtnLabel}>Save Profile</Text>}
              </Pressable>
            </View>
          )}
        </ScrollView>
      </View>
    </GradientBackground>
  );
}

function ProfileField({ label, value, onChange, placeholder, multiline, keyboardType }) {
  return (
    <View style={s.fieldGroup}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        style={[s.input, multiline && s.inputMulti]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textOnNavyFaint}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize="none"
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  topbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: gutter, paddingBottom: spacing.sm, gap: spacing.sm },
  menuBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  menuBtnBadge: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: '#F5C518' },
  topbarTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: colors.white },
  topbarRestaurant: { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: 140 },
  topbarRestaurantName: { fontSize: 12, color: colors.blue300, fontWeight: '600' },

  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9, backgroundColor: 'rgba(0,0,0,0.5)' },
  sidebar: {
    position: 'absolute', top: 0, left: 0, bottom: 0, zIndex: 10,
    width: 230, backgroundColor: '#021e3a',
    borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: 'rgba(133,183,235,0.2)',
    paddingTop: spacing.lg, paddingBottom: spacing.huge,
  },
  sidebarBrand: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, marginBottom: spacing.lg, gap: spacing.sm },
  sidebarTitle: { flex: 1, fontSize: 14, fontWeight: '800', color: colors.white },
  sidebarClose: { padding: 4 },
  sidebarDivider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(133,183,235,0.15)', marginVertical: spacing.sm, marginHorizontal: spacing.md },
  navItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2, gap: spacing.sm, borderRadius: radius.md, marginHorizontal: spacing.xs, marginBottom: 2 },
  navItemActive: { backgroundColor: 'rgba(55,138,221,0.25)' },
  navLabel: { flex: 1, fontSize: 13.5, color: colors.blue300, fontWeight: '600' },
  navLabelActive: { color: colors.white },
  navBadge: { backgroundColor: '#F5C518', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  navBadgeLabel: { fontSize: 10, fontWeight: '800', color: '#000' },

  main: { paddingHorizontal: gutter, paddingTop: spacing.md },

  statRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  statNum: { fontSize: 26, fontWeight: '800', color: colors.white },
  statLabel: { fontSize: 11, color: colors.textOnNavyFaint, marginTop: 2, textAlign: 'center' },

  card: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(133,183,235,0.15)' },
  cardTitle: { fontSize: 13, fontWeight: '700', color: colors.white, marginBottom: spacing.md },

  quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  quickAction: { alignItems: 'center', width: 72 },
  quickActionIcon: { width: 52, height: 52, borderRadius: radius.lg, backgroundColor: 'rgba(55,138,221,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  quickBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#F5C518', borderRadius: 8, paddingHorizontal: 4, paddingVertical: 1 },
  quickBadgeLabel: { fontSize: 10, fontWeight: '800', color: '#000' },
  quickActionLabel: { fontSize: 11, color: colors.textOnNavy, textAlign: 'center', fontWeight: '600' },

  overviewThumb: { width: 64, height: 64, borderRadius: radius.md },
  overviewName: { fontSize: 16, fontWeight: '800', color: colors.white },
  overviewLocation: { fontSize: 12, color: colors.textOnNavyFaint, marginTop: 2 },
  overviewStatus: { fontSize: 12, fontWeight: '600', marginTop: 4 },

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

  menuFormCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(133,183,235,0.15)' },
  catChip: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(133,183,235,0.25)', backgroundColor: 'rgba(255,255,255,0.04)' },
  catChipActive: { backgroundColor: colors.blue500, borderColor: colors.blue500 },
  catChipLabel: { fontSize: 12, color: colors.textOnNavy, fontWeight: '600' },
  catChipLabelActive: { color: colors.white },
  availToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(133,183,235,0.2)', paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, backgroundColor: 'rgba(255,255,255,0.05)' },
  availToggleOn: { borderColor: 'rgba(96,192,128,0.4)' },
  availToggleLabel: { fontSize: 12, fontWeight: '600', color: colors.textOnNavyFaint },
  menuPhotoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 8 },
  menuPhotoPreview: { position: 'relative' },
  menuPhotoThumb: { width: 64, height: 64, borderRadius: radius.md },
  menuPhotoRemove: { position: 'absolute', top: -6, right: -6 },
  menuPhotoBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: 'rgba(133,183,235,0.3)', borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: 'rgba(255,255,255,0.05)' },
  menuPhotoBtnLabel: { fontSize: 12, color: colors.blue300, fontWeight: '600' },
  menuCategoryBlock: { marginBottom: spacing.lg },
  menuCategoryTitle: { fontSize: 12, fontWeight: '800', color: colors.blue300, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.sm, paddingBottom: spacing.xs, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(133,183,235,0.2)' },
  menuItemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(133,183,235,0.08)', gap: 4 },
  menuItemName: { fontSize: 13, fontWeight: '600', color: colors.white },
  menuItemDesc: { fontSize: 11, color: colors.textOnNavyFaint, marginTop: 1 },
  menuItemPrice: { fontSize: 13, fontWeight: '700', color: '#60C080', marginRight: 4 },
  iconBtn: { padding: 8 },

  photoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  photoThumb: { width: 60, height: 60, borderRadius: radius.sm },
  photoThumbEmpty: { backgroundColor: 'rgba(55,138,221,0.12)', alignItems: 'center', justifyContent: 'center' },
  photoLabelInput: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 8, color: colors.white, fontSize: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(133,183,235,0.2)' },
  photoPickBtn: { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.blue500, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  photoRemoveBtn: { width: 32, height: 32, borderRadius: radius.sm, backgroundColor: 'rgba(224,92,92,0.15)', alignItems: 'center', justifyContent: 'center' },
  addPhotoBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.sm },
  addPhotoBtnLabel: { fontSize: 13, color: colors.blue300, fontWeight: '600' },

  fieldGroup: { marginBottom: spacing.lg },
  fieldLabel: { fontSize: 11.5, fontWeight: '700', color: colors.textOnNavyFaint, marginBottom: spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: Platform.OS === 'web' ? spacing.sm : 12, color: colors.white, fontSize: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(133,183,235,0.25)' },
  inputMulti: { minHeight: 80, textAlignVertical: 'top', paddingTop: spacing.sm },

  saveBtn: { backgroundColor: colors.blue500, borderRadius: radius.md, paddingVertical: spacing.md + 2, alignItems: 'center', marginBottom: spacing.sm },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnLabel: { fontSize: 15, fontWeight: '700', color: colors.white },
  cancelBtn: { borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(133,183,235,0.3)' },
  cancelBtnLabel: { fontSize: 14, color: colors.textOnNavy },

  emptyState: { alignItems: 'center', paddingTop: 60, gap: spacing.sm },
  emptyTitle: { fontSize: 15, color: colors.textOnNavy, fontWeight: '600' },
  emptyDesc: { fontSize: 13, color: colors.textOnNavyFaint, textAlign: 'center', paddingHorizontal: spacing.xl },
});
