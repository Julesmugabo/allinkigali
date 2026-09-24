/**
 * SettingsList.js — The signed-in Me screen's settings groups.
 *
 * Roles stack rather than replace each other: everyone gets Activity,
 * Account and Help; an account that owns a business also gets My business;
 * an account with an admin role also gets an Admin group at the top. Every
 * row is something you tap to open a screen.
 */
import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { showAlert } from '../../utils/showAlert';

import MenuRow from './MenuRow';
import { ROLE_META } from '../../admin/adminAuth';
import { colors, typography, spacing, radius } from '../../theme';

const ADMIN_ROW_LABEL = {
  news: 'Access the News dashboard',
  sellers: 'Access the Sales Partners dashboard',
  director: 'Access the Director dashboard',
};

// Which dashboards each admin role gets a row for. The director can open all
// three so it doesn't have to go through the Director dashboard first.
const ROLE_DASHBOARDS = {
  news: ['news'],
  sellers: ['sellers'],
  director: ['director', 'news', 'sellers'],
};

function Group({ label, children }) {
  return (
    <>
      <Text style={styles.groupLabel}>{label}</Text>
      <View style={styles.group}>{children}</View>
    </>
  );
}

export default function SettingsList({ user, navigation, myBusiness, waitingRequests, onSignOut }) {
  const adminRows = user.role ? ROLE_DASHBOARDS[user.role] || [] : [];

  return (
    <>
      {adminRows.length ? (
        <Group label="Admin">
          {adminRows.map((role, index) => (
            <MenuRow
              key={role}
              icon={ROLE_META[role].icon}
              label={ADMIN_ROW_LABEL[role]}
              onPress={() => navigation.navigate('Admin', { screen: ROLE_META[role].route })}
              isLast={index === adminRows.length - 1}
            />
          ))}
        </Group>
      ) : null}

      <Group label="My activity">
        <MenuRow
          icon="inbox-arrow-up-outline"
          label="My service requests"
          badgeCount={waitingRequests || null}
          onPress={() => navigation.navigate('MyRequests')}
          isLast
        />
      </Group>

      <Group label="My business">
        {myBusiness ? (
          myBusiness.verified ? (
            <MenuRow
              icon="view-dashboard-outline"
              label="Business dashboard"
              value={myBusiness.name}
              onPress={() => navigation.navigate('SellerDashboard', { businessId: myBusiness.id })}
              isLast
            />
          ) : (
            <MenuRow
              icon="clock-outline"
              label="Business under review"
              value={myBusiness.name}
              onPress={() =>
                showAlert(
                  'Under review',
                  'The platform team is reviewing your business. Your dashboard opens once it is approved.'
                )
              }
              isLast
            />
          )
        ) : (
          <MenuRow
            icon="storefront-outline"
            label="Register a business"
            value="Become a partner"
            onPress={() => navigation.navigate('SalesPartner')}
            isLast
          />
        )}
      </Group>

      <Group label="Account">
        <MenuRow icon="account-edit-outline" label="Edit profile" onPress={() => navigation.navigate('EditProfile')} />
        <MenuRow icon="key-outline" label="Change password" onPress={() => navigation.navigate('ChangePassword')} isLast />
      </Group>

      <Group label="Help">
        <MenuRow icon="help-circle-outline" label="Help & FAQ" onPress={() => navigation.navigate('Info', { kind: 'help' })} />
        <MenuRow
          icon="shield-check-outline"
          label="Terms & privacy"
          onPress={() => navigation.navigate('Info', { kind: 'privacy' })}
          isLast
        />
      </Group>

      <View style={styles.group}>
        <MenuRow icon="logout" label="Sign out" destructive onPress={onSignOut} isLast />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  groupLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.blue600,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  group: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
});
