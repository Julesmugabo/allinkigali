/**
 * CategoryTabs.js — Amoko y'amakuru (the scrolling category strip).
 * Horizontal, scrolls to keep the selected tab in view, and underlines the
 * active one exactly like the mockup.
 */
import React, { useRef, useEffect, useCallback } from 'react';
import { ScrollView, Pressable, Text, StyleSheet, View } from 'react-native';
import { colors, typography, spacing, gutter } from '../../theme';

export default function CategoryTabs({ categories, activeKey, onChange }) {
  const scrollRef = useRef(null);
  const layouts = useRef({});

  // Keep the active tab visible when it changes from outside (deep links etc.)
  useEffect(() => {
    const layout = layouts.current[activeKey];
    if (layout && scrollRef.current) {
      scrollRef.current.scrollTo({
        x: Math.max(0, layout.x - gutter * 2),
        animated: true,
      });
    }
  }, [activeKey]);

  const handleLayout = useCallback((key) => (event) => {
    layouts.current[key] = event.nativeEvent.layout;
  }, []);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      style={styles.container}
      accessibilityRole="tablist"
    >
      {categories.map((category) => {
        const isActive = category.key === activeKey;
        return (
          <Pressable
            key={category.key}
            onLayout={handleLayout(category.key)}
            onPress={() => onChange(category.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            style={styles.tab}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>{category.label}</Text>
            <View style={[styles.underline, isActive && styles.underlineActive]} />
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: -gutter,
  },
  content: {
    paddingHorizontal: gutter - spacing.md,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    alignItems: 'center',
  },
  label: {
    ...typography.tab,
    color: 'rgba(133,183,235,0.5)',
    marginBottom: spacing.sm,
  },
  labelActive: {
    color: colors.blue300,
    fontWeight: '600',
  },
  underline: {
    height: 2.5,
    width: '100%',
    minWidth: 24,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  underlineActive: {
    backgroundColor: colors.blue500,
  },
});
