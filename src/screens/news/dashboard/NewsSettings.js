/**
 * NewsSettings.js — Workflow and editorial settings for the News Admin Dashboard.
 *
 * Covers: breaking-flag auto-expiry hours, scheduled-publish check interval,
 * require-editor-approval toggle, default publish status, ad frequency,
 * and the existing show-view-counts reader toggle.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, Switch, ActivityIndicator } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { spacing } from '../../../theme';
import { NEWS, SectionHeader, ActionBtn, AlertBanner, alertMsg, s } from './NewsShared';
import { apiFetch } from '../../../services/apiClient';

const DEFAULT = {
  breaking_expiry_hours:     6,
  scheduled_check_interval:  5,
  require_editor_approval:   false,
  default_publish_status:    'draft',
  ad_frequency_every_n:      5,
};

export default function NewsSettings({ ctx }) {
  const { showViewCounts, updateViewCountSetting } = ctx;
  const [settings, setSettings] = useState(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    apiFetch('/news/workflow-settings')
      .then(data => { if (data?.id) setSettings({ ...DEFAULT, ...data }); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function update(key, value) {
    setSettings(prev => ({ ...prev, [key]: value }));
    setDirty(true);
  }

  async function save() {
    setSaving(true);
    try {
      const payload = {
        breakingExpiryHours:     settings.breaking_expiry_hours,
        scheduledCheckInterval:  settings.scheduled_check_interval,
        requireEditorApproval:   settings.require_editor_approval,
        defaultPublishStatus:    settings.default_publish_status,
        adFrequencyEveryN:       settings.ad_frequency_every_n,
      };
      await apiFetch('/news/workflow-settings', { method: 'PATCH', body: JSON.stringify(payload) });
      alertMsg('Saved', 'Workflow settings updated');
      setDirty(false);
    } catch (e) { alertMsg('Error', e.message); }
    setSaving(false);
  }

  if (loading) return <ActivityIndicator color={NEWS.primary} size="large" style={{ marginTop: 40 }} />;

  return (
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <SectionHeader title="Workflow Settings" icon="cog-outline" />

      {dirty && (
        <AlertBanner icon="content-save-outline" text="You have unsaved changes" color={NEWS.warning} />
      )}

      {/* ── Breaking news ── */}
      <View style={[s.panel, { padding: spacing.md, marginBottom: spacing.lg }]}>
        <Text style={[s.sectionTitle, { marginBottom: spacing.md }]}>Breaking News</Text>

        <Text style={s.inputLabel}>Auto-expire breaking flag after (hours)</Text>
        <Text style={[s.rowMeta, { marginBottom: spacing.sm }]}>
          Articles marked Breaking will automatically lose the flag after this many hours.
        </Text>
        <TextInput
          style={[s.input]}
          value={String(settings.breaking_expiry_hours)}
          onChangeText={v => update('breaking_expiry_hours', parseInt(v, 10) || 6)}
          keyboardType="numeric"
        />

        <Pressable
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm }}
          onPress={async () => {
            try {
              const res = await apiFetch('/news/articles/expire-breaking', { method: 'POST' });
              alertMsg('Done', `${res.expired?.length || 0} breaking flag(s) expired`);
            } catch (e) { alertMsg('Error', e.message); }
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={s.rowTitle}>Run expiry check now</Text>
            <Text style={s.rowMeta}>Expire any breaking articles past their deadline</Text>
          </View>
          <MaterialCommunityIcons name="lightning-bolt" size={18} color={NEWS.warning} />
        </Pressable>
      </View>

      {/* ── Scheduled publishing ── */}
      <View style={[s.panel, { padding: spacing.md, marginBottom: spacing.lg }]}>
        <Text style={[s.sectionTitle, { marginBottom: spacing.md }]}>Scheduled Publishing</Text>

        <Text style={s.inputLabel}>Check interval (minutes)</Text>
        <Text style={[s.rowMeta, { marginBottom: spacing.sm }]}>
          How often the system should publish scheduled articles (informational; auto-publish requires a cron or periodic call).
        </Text>
        <TextInput
          style={s.input}
          value={String(settings.scheduled_check_interval)}
          onChangeText={v => update('scheduled_check_interval', parseInt(v, 10) || 5)}
          keyboardType="numeric"
        />

        <Text style={s.inputLabel}>Default article status when saved</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: spacing.sm }}>
          {['draft', 'pending', 'published'].map(st => (
            <Pressable
              key={st}
              style={[s.filterBtn, settings.default_publish_status === st && { backgroundColor: NEWS.primaryBg, borderColor: NEWS.primary }]}
              onPress={() => update('default_publish_status', st)}
            >
              <Text style={[s.filterBtnLabel, settings.default_publish_status === st && { color: NEWS.primary }]}>
                {st.charAt(0).toUpperCase() + st.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm }}
          onPress={async () => {
            try {
              const res = await apiFetch('/news/articles/publish-scheduled', { method: 'POST' });
              alertMsg('Done', `${res.published?.length || 0} scheduled article(s) published`);
            } catch (e) { alertMsg('Error', e.message); }
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={s.rowTitle}>Publish scheduled articles now</Text>
            <Text style={s.rowMeta}>Immediately publish all articles whose publish_at has passed</Text>
          </View>
          <MaterialCommunityIcons name="clock-check-outline" size={18} color={NEWS.success} />
        </Pressable>
      </View>

      {/* ── Workflow ── */}
      <View style={[s.panel, { padding: spacing.md, marginBottom: spacing.lg }]}>
        <Text style={[s.sectionTitle, { marginBottom: spacing.md }]}>Editorial Workflow</Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
          <View style={{ flex: 1, marginRight: spacing.md }}>
            <Text style={s.rowTitle}>Require editor approval</Text>
            <Text style={s.rowMeta}>Articles submitted by reporters go to Pending instead of Publishing directly</Text>
          </View>
          <Switch
            value={settings.require_editor_approval}
            onValueChange={v => update('require_editor_approval', v)}
          />
        </View>
      </View>

      {/* ── Ads ── */}
      <View style={[s.panel, { padding: spacing.md, marginBottom: spacing.lg }]}>
        <Text style={[s.sectionTitle, { marginBottom: spacing.md }]}>Ad Frequency</Text>

        <Text style={s.inputLabel}>Show an ad every N articles</Text>
        <TextInput
          style={s.input}
          value={String(settings.ad_frequency_every_n)}
          onChangeText={v => update('ad_frequency_every_n', parseInt(v, 10) || 5)}
          keyboardType="numeric"
        />
      </View>

      {/* ── Reader display ── */}
      <View style={[s.panel, { padding: spacing.md, marginBottom: spacing.lg }]}>
        <Text style={[s.sectionTitle, { marginBottom: spacing.md }]}>Reader Display</Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, marginRight: spacing.md }}>
            <Text style={s.rowTitle}>Show view counts to readers</Text>
            <Text style={s.rowMeta}>{showViewCounts ? 'Readers can see how many people read each article.' : 'Hidden from readers.'}</Text>
          </View>
          <Switch
            value={showViewCounts}
            onValueChange={async v => {
              const ok = await updateViewCountSetting(v);
              if (!ok) alertMsg('Error', 'Could not update setting. Please try again.');
            }}
          />
        </View>
      </View>

      <ActionBtn
        label={saving ? 'Saving…' : 'Save Workflow Settings'}
        icon="content-save-outline"
        color={NEWS.primary}
        onPress={save}
        disabled={saving || !dirty}
      />
    </ScrollView>
  );
}
