/**
 * FilterSidebar.js — the always-open filter column on the browse page.
 * Each group is a titled set of tick boxes; long groups show 6 options
 * with a "Show all" link. "Clear all" resets every choice.
 */
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import RwandaLocationPicker from '../../common/RwandaLocationPicker';
import { colors, spacing } from '../../../theme';

const SHORT = 6;

function Group({ group, picked, onToggle }) {
  const [all, setAll] = useState(false);
  const options = all ? group.options : group.options.slice(0, SHORT);
  if (!group.options.length) return null;
  return (
    <View style={styles.group}>
      <Text style={styles.title}>{group.title}</Text>
      {options.map((o) => {
        const on = picked.includes(o.key);
        return (
          <Pressable key={o.key} onPress={() => onToggle(group.key, o.key)} accessibilityRole="checkbox" accessibilityState={{ checked: on }}
            style={({ hovered }) => [styles.option, hovered && styles.optionHover]}>
            <MaterialCommunityIcons name={on ? 'checkbox-marked' : 'checkbox-blank-outline'} size={18} color={on ? colors.blue500 : colors.textOnNavyFaint} />
            <Text style={[styles.optionLabel, on && styles.optionOn]} numberOfLines={1}>{o.label}</Text>
          </Pressable>
        );
      })}
      {group.options.length > SHORT && (
        <Pressable onPress={() => setAll((v) => !v)}><Text style={styles.more}>{all ? 'Show less' : `Show all ${group.options.length}`}</Text></Pressable>
      )}
    </View>
  );
}

export default function FilterSidebar({ groups, state, onToggle, onLocation, onClear, hasChoices }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={styles.heading}>Filters</Text>
        {hasChoices ? <Pressable onPress={onClear}><Text style={styles.clear}>Clear all</Text></Pressable> : null}
      </View>
      <View style={styles.group}>
        <Text style={styles.title}>Location</Text>
        <RwandaLocationPicker value={state.loc} onChange={onLocation} />
      </View>
      {groups.map((g) => <Group key={g.key} group={g} picked={state.groups[g.key] || []} onToggle={onToggle} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: 230 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  heading: { color: colors.white, fontSize: 16, fontWeight: '800' },
  clear: { color: colors.blue300, fontSize: 13, fontWeight: '600' },
  group: { paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: 'rgba(133,183,235,0.14)' },
  title: { color: colors.white, fontSize: 13, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.6 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5, borderRadius: 6 },
  optionHover: { backgroundColor: 'rgba(255,255,255,0.04)' },
  optionLabel: { color: colors.textOnNavy, fontSize: 13.5, flex: 1 },
  optionOn: { color: colors.white, fontWeight: '600' },
  more: { color: colors.blue300, fontSize: 12.5, fontWeight: '600', marginTop: 4 },
});
