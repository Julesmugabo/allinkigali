/**
 * BottomTabBar.js — Umurongo wo hepfo wo kugendagenda.
 *
 * Custom bar (rather than the default one) so it can carry the brand navy, the
 * pill-shaped active state, and the cart badge on the shop tab.
 *
 * A screen can hide it by setting `tabBarHidden: true` in its options — see
 * RootNavigator, which does that for the checkout flow.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCart } from '../context/CartContext';
import { colors, typography, spacing, radius, shadows, TAB_BAR_HEIGHT } from '../theme';

export default function BottomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const { count } = useCart();

  // Let the focused screen switch the bar off entirely.
  const focusedOptions = descriptors[state.routes[state.index].key].options;
  if (focusedOptions.tabBarHidden) return null;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom, height: TAB_BAR_HEIGHT + insets.bottom }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const label = options.tabLabel || route.name;
        const iconName = isFocused
          ? options.tabIconActive || options.tabIcon
          : options.tabIcon;

        // The cart badge only ever appears on the tab that declares it.
        const badge = options.showsCartBadge && count > 0 ? count : null;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        // Long-press pops a nested stack back to its first screen.
        const onLongPress = () => {
          navigation.emit({ type: 'tabLongPress', target: route.key });
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            onLongPress={onLongPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: isFocused }}
            accessibilityLabel={label}
            style={styles.tab}
          >
            <View style={[styles.iconWell, isFocused && styles.iconWellActive]}>
              <MaterialCommunityIcons
                name={iconName}
                size={22}
                color={isFocused ? colors.white : 'rgba(133,183,235,0.65)'}
              />

              {badge ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
                </View>
              ) : null}
            </View>

            <Text style={[styles.label, isFocused && styles.labelActive]} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.navy800,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(133,183,235,0.18)',
    paddingTop: spacing.sm,
    ...shadows.floating,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  iconWell: {
    width: 46,
    height: 28,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWellActive: {
    backgroundColor: colors.blue500,
  },
  label: {
    ...typography.tabBar,
    color: 'rgba(133,183,235,0.65)',
    marginTop: 3,
  },
  labelActive: {
    color: colors.blue300,
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: 4,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.breaking,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.navy800,
  },
  badgeText: {
    color: colors.white,
    fontSize: 9.5,
    fontWeight: '700',
  },
});
