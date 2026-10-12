/**
 * SettingsList.js — Me tab content for everyone.
 *
 * Signed out: two simple rows (Log in/Sign up, Register business) +
 *   a collapsible Settings row.
 * Signed in: My Bookings, My Orders, role-specific rows, collapsible Settings.
 */
import React, { useState } from 'react';
import { Text, View, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import MenuRow from './MenuRow';
import { ROLE_META } from '../../admin/adminAuth';
import { showAlert } from '../../utils/showAlert';
import { colors, typography, spacing, radius } from '../../theme';

const ADMIN_ROW_LABEL = {
  news:       'News dashboard',
  sellers:    'Sales Partners dashboard',
  director:   'Director dashboard',
  restaurant: 'Manage Restaurants',
  coffeeshop: 'Manage Coffee Shops',
  finance:    'Finance dashboard',
};

const ROLE_DASHBOARDS = {
  news:       ['news'],
  sellers:    ['sellers'],
  director:   ['director', 'news', 'sellers', 'restaurant', 'coffeeshop', 'finance'],
  restaurant: ['restaurant'],
  coffeeshop: ['coffeeshop'],
  finance:    ['finance'],
};

function Group({ children }) {
  return (
    <View style={styles.group}>{children}</View>
  );
}

// Collapsible Settings accordion row
function SettingsAccordion({ children }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={[styles.group, { marginBottom: spacing.xl }]}>
      <TouchableOpacity
        style={styles.accordionHeader}
        onPress={() => setOpen(o => !o)}
        activeOpacity={0.7}
      >
        <View style={styles.accordionLeft}>
          <MaterialCommunityIcons name="cog-outline" size={20} color={colors.text} style={{ marginRight: spacing.sm }} />
          <Text style={styles.accordionLabel}>Settings</Text>
        </View>
        <MaterialCommunityIcons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.textMuted}
        />
      </TouchableOpacity>
      {open && <View style={styles.accordionBody}>{children}</View>}
    </View>
  );
}

export default function SettingsList({ user, navigation, myBusiness, waitingRequests, onLogOut, unreadNotifications }) {

  // ──────────────────────────────────────────── SIGNED OUT
  if (!user) {
    return (
      <>
        <Group>
          <MenuRow
            icon="login"
            label="Log in / Sign up"
            value="Access your account"
            onPress={() => navigation.navigate('Login')}
          />
          <MenuRow
            icon="map-marker-plus-outline"
            label="Register your spot"
            value="Restaurant, café, wedding venue & more"
            onPress={() => navigation.navigate('RegisterListing')}
          />
          <MenuRow
            icon="information-outline"
            label="About Us"
            onPress={() => navigation.navigate('AboutUs')}
            isLast
          />
        </Group>

        <SettingsAccordion>
          <MenuRow
            icon="weather-sunny"
            label="Appearance"
            value="Light mode"
            onPress={null}
          />
          <MenuRow
            icon="help-circle-outline"
            label="Help & FAQ"
            onPress={() => navigation.navigate('Info', { kind: 'help' })}
          />
          <MenuRow
            icon="shield-check-outline"
            label="Terms & privacy"
            onPress={() => navigation.navigate('Info', { kind: 'privacy' })}
            isLast
          />
        </SettingsAccordion>
      </>
    );
  }

  // ──────────────────────────────────────────── SIGNED IN
  const adminRows = user.role ? ROLE_DASHBOARDS[user.role] || [] : [];

  return (
    <>
      {/* Admin dashboards */}
      {adminRows.length > 0 && (
        <Group>
          {adminRows.map((role, index) => (
            <MenuRow
              key={role}
              icon={ROLE_META[role].icon}
              label={ADMIN_ROW_LABEL[role]}
              onPress={() => navigation.navigate(ROLE_META[role].route)}
              isLast={index === adminRows.length - 1}
            />
          ))}
        </Group>
      )}

      {/* Restaurant / coffee shop owner dashboard */}
      {user.role === 'restaurant' && (
        <Group>
          <MenuRow
            icon="silverware-fork-knife"
            label="My Restaurant"
            value="Bookings, menu & profile"
            onPress={() => navigation.navigate('RestaurantOwnerDashboard')}
            isLast
          />
        </Group>
      )}
      {user.role === 'coffeeshop' && (
        <Group>
          <MenuRow
            icon="coffee-outline"
            label="My Coffee Shop"
            value="Bookings & profile"
            onPress={() => navigation.navigate('RestaurantOwnerDashboard')}
            isLast
          />
        </Group>
      )}

      {/* Seller business */}
      {myBusiness && (
        <Group>
          {myBusiness.verified ? (
            <MenuRow
              icon="view-dashboard-outline"
              label="My Business"
              value={myBusiness.name}
              onPress={() => navigation.navigate('SellerDashboard', { businessId: myBusiness.id })}
              isLast
            />
          ) : (
            <View style={styles.pendingRow}>
              <MaterialCommunityIcons name="clock-outline" size={20} color={colors.textMuted} style={{ marginRight: spacing.sm }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.pendingLabel}>{myBusiness.name}</Text>
                <Text style={styles.pendingValue}>Under review · we'll notify you once approved</Text>
              </View>
              <View style={styles.pendingBadge}><Text style={styles.pendingBadgeText}>Pending</Text></View>
            </View>
          )}
        </Group>
      )}

      {/* My activity */}
      <Group>
        <MenuRow
          icon="bell-outline"
          label="Notifications"
          badgeCount={unreadNotifications || null}
          onPress={() => navigation.navigate('Notifications')}
        />
        <MenuRow
          icon="calendar-check-outline"
          label="My Bookings"
          onPress={() => navigation.navigate('MyBookings')}
        />
        <MenuRow
          icon="clipboard-text-clock-outline"
          label="My Orders"
          onPress={() => navigation.navigate('Orders')}
        />
        <MenuRow
          icon="information-outline"
          label="About Us"
          onPress={() => navigation.navigate('AboutUs')}
          isLast
        />
      </Group>


      {/* Settings accordion */}
      <SettingsAccordion>
        <MenuRow
          icon="account-edit-outline"
          label="Edit profile"
          onPress={() => navigation.navigate('EditProfile')}
        />
        <MenuRow
          icon="key-outline"
          label="Change password"
          onPress={() => navigation.navigate('ChangePassword')}
        />
        <MenuRow
          icon="weather-sunny"
          label="Appearance"
          value="Light mode"
          onPress={null}
        />
        <MenuRow
          icon="help-circle-outline"
          label="Help & FAQ"
          onPress={() => navigation.navigate('Info', { kind: 'help' })}
        />
        <MenuRow
          icon="shield-check-outline"
          label="Terms & privacy"
          onPress={() => navigation.navigate('Info', { kind: 'privacy' })}
        />
        <MenuRow
          icon="logout"
          label="Log out"
          destructive
          onPress={onLogOut}
          isLast
        />
      </SettingsAccordion>
    </>
  );
}

const styles = StyleSheet.create({
  group: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md + 2,
  },
  accordionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accordionLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  accordionBody: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  pendingRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.md + 2,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  pendingLabel: { ...typography.body, color: colors.text, fontWeight: '600' },
  pendingValue: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  pendingBadge: { backgroundColor: 'rgba(245,158,11,0.15)', borderRadius: 8, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  pendingBadgeText: { fontSize: 11, fontWeight: '700', color: '#f59e0b' },
});
