/**
 * NewsAds.js — Ad operations for the News Admin Dashboard.
 *
 * Three tabs: Feed Ads (the existing inline-ad placements), Advertisers
 * (company/contact records), and Campaigns (budget, date range, status).
 * Impression and click counts come from the backend events table.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { showAlert } from '../../../utils/showAlert';
import { spacing } from '../../../theme';
import {
  NEWS, SectionHeader, EmptyState, StatusBadge, ActionBtn, FilterBtn,
  alertMsg, fmtDate, s,
} from './NewsShared';
import { apiFetch } from '../../../services/apiClient';

const TABS = ['Feed Ads', 'Advertisers', 'Campaigns'];

const EMPTY_ADV = { name: '', contact: '', email: '', phone: '', logoUrl: '', notes: '' };
const EMPTY_CAM = { advertiserId: '', name: '', budget: '', startsAt: '', endsAt: '', notes: '' };

export default function NewsAds({ ctx }) {
  const { ads = [], deleteAd, articles = [], navigation } = ctx;

  const [tab, setTab] = useState(0);
  const [advertisers, setAdvertisers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdvForm, setShowAdvForm] = useState(false);
  const [advForm, setAdvForm] = useState(EMPTY_ADV);
  const [showCamForm, setShowCamForm] = useState(false);
  const [camForm, setCamForm] = useState(EMPTY_CAM);

  const articleTitleFor = useCallback(id => articles.find(a => a.id === id)?.title || '—', [articles]);

  async function loadAdvertisers() {
    setLoading(true);
    try { setAdvertisers(await apiFetch('/news/advertisers')); } catch {}
    setLoading(false);
  }

  async function loadCampaigns() {
    setLoading(true);
    try { setCampaigns(await apiFetch('/news/campaigns')); } catch {}
    setLoading(false);
  }

  useEffect(() => {
    if (tab === 1) loadAdvertisers();
    if (tab === 2) { loadAdvertisers(); loadCampaigns(); }
  }, [tab]);

  async function saveAdvertiser() {
    if (!advForm.name.trim()) return alertMsg('Error', 'Name is required');
    try {
      await apiFetch('/news/advertisers', { method: 'POST', body: JSON.stringify({ ...advForm }) });
      setAdvForm(EMPTY_ADV); setShowAdvForm(false); loadAdvertisers();
    } catch (e) { alertMsg('Error', e.message); }
  }

  async function deleteAdvertiser(adv) {
    showAlert('Delete advertiser', `Delete "${adv.name}"? Their campaigns will also be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await apiFetch(`/news/advertisers/${adv.id}`, { method: 'DELETE' }); loadAdvertisers(); }
        catch (e) { alertMsg('Error', e.message); }
      }},
    ]);
  }

  async function saveCampaign() {
    if (!camForm.advertiserId || !camForm.name.trim()) return alertMsg('Error', 'Advertiser and name required');
    try {
      await apiFetch('/news/campaigns', { method: 'POST', body: JSON.stringify({
        advertiserId: parseInt(camForm.advertiserId, 10),
        name: camForm.name,
        budget: camForm.budget ? parseFloat(camForm.budget) : null,
        startsAt: camForm.startsAt || null,
        endsAt: camForm.endsAt || null,
        notes: camForm.notes || null,
      })});
      setCamForm(EMPTY_CAM); setShowCamForm(false); loadCampaigns();
    } catch (e) { alertMsg('Error', e.message); }
  }

  async function setCampaignStatus(id, status) {
    try { await apiFetch(`/news/campaigns/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }); loadCampaigns(); }
    catch (e) { alertMsg('Error', e.message); }
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <SectionHeader title="Ad Operations" icon="bullhorn-outline" />

      {/* Tab bar */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: spacing.lg }}>
        {TABS.map((t, i) => (
          <FilterBtn key={t} label={t} active={tab === i} onPress={() => setTab(i)} />
        ))}
      </View>

      {/* ── Feed Ads ── */}
      {tab === 0 && (
        <>
          <View style={{ marginBottom: spacing.md }}>
            <ActionBtn label="New Ad" icon="plus" color={NEWS.primary}
              onPress={() => navigation?.navigate('AdEditor')} />
          </View>
          {ads.length === 0 ? (
            <EmptyState icon="bullhorn-outline" text="No feed ads yet" sub="Ads appear inline after the article you choose" />
          ) : (
            <View style={s.panel}>
              {ads.map((ad, i) => (
                <View key={ad.id} style={[s.row, i === ads.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: NEWS.primaryBg, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                    <MaterialCommunityIcons name={ad.type === 'video' ? 'play-circle-outline' : 'image-outline'} size={20} color={NEWS.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.rowTitle}>{ad.type === 'video' ? 'Video Ad' : 'Photo Ad'}</Text>
                    <Text style={s.rowMeta} numberOfLines={1}>After: {articleTitleFor(ad.afterArticleId)}</Text>
                  </View>
                  <Pressable style={{ padding: 8 }} onPress={() => navigation?.navigate('AdEditor', { adId: ad.id })}>
                    <MaterialCommunityIcons name="pencil-outline" size={16} color={NEWS.primary} />
                  </Pressable>
                  <Pressable style={{ padding: 8 }} onPress={() => showAlert('Delete ad', 'Remove this ad?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => deleteAd(ad.id) },
                  ])}>
                    <MaterialCommunityIcons name="trash-can-outline" size={16} color={NEWS.danger} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </>
      )}

      {/* ── Advertisers ── */}
      {tab === 1 && (
        <>
          <ActionBtn label="Add Advertiser" icon="plus" color={NEWS.primary}
            onPress={() => setShowAdvForm(v => !v)} />
          {showAdvForm && (
            <View style={[s.panel, { padding: spacing.md, marginTop: spacing.md }]}>
              <Text style={[s.inputLabel, { fontSize: 14, fontWeight: '700', marginBottom: spacing.sm }]}>New Advertiser</Text>
              {[
                ['name', 'Company / Advertiser Name *'],
                ['contact', 'Contact Person'],
                ['email', 'Email'],
                ['phone', 'Phone'],
                ['logoUrl', 'Logo URL'],
                ['notes', 'Notes'],
              ].map(([field, label]) => (
                <View key={field}>
                  <Text style={s.inputLabel}>{label}</Text>
                  <TextInput
                    style={s.input}
                    placeholder={label}
                    placeholderTextColor={NEWS.muted}
                    value={advForm[field]}
                    onChangeText={v => setAdvForm(p => ({ ...p, [field]: v }))}
                  />
                </View>
              ))}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <ActionBtn label="Save" icon="content-save-outline" color={NEWS.success} onPress={saveAdvertiser} />
                <ActionBtn label="Cancel" color={NEWS.muted} onPress={() => { setShowAdvForm(false); setAdvForm(EMPTY_ADV); }} />
              </View>
            </View>
          )}
          {loading ? <ActivityIndicator color={NEWS.primary} style={{ marginTop: 24 }} /> : advertisers.length === 0 ? (
            <EmptyState icon="domain" text="No advertisers yet" sub="Add an advertiser to attach campaigns and track billing" />
          ) : (
            <View style={[s.panel, { marginTop: spacing.md }]}>
              {advertisers.map((adv, i) => (
                <View key={adv.id} style={[s.row, i === advertisers.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.rowTitle}>{adv.name}</Text>
                    <Text style={s.rowMeta}>{[adv.contact, adv.email, adv.phone].filter(Boolean).join(' · ')}</Text>
                  </View>
                  <Pressable style={{ padding: 8 }} onPress={() => deleteAdvertiser(adv)}>
                    <MaterialCommunityIcons name="trash-can-outline" size={16} color={NEWS.danger} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </>
      )}

      {/* ── Campaigns ── */}
      {tab === 2 && (
        <>
          <ActionBtn label="New Campaign" icon="plus" color={NEWS.primary}
            onPress={() => setShowCamForm(v => !v)} />
          {showCamForm && (
            <View style={[s.panel, { padding: spacing.md, marginTop: spacing.md }]}>
              <Text style={[s.inputLabel, { fontSize: 14, fontWeight: '700', marginBottom: spacing.sm }]}>New Campaign</Text>
              <Text style={s.inputLabel}>Advertiser *</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.sm }}>
                {advertisers.map(adv => (
                  <Pressable
                    key={adv.id}
                    style={[s.filterBtn, String(camForm.advertiserId) === String(adv.id) && { backgroundColor: NEWS.primaryBg, borderColor: NEWS.primary }]}
                    onPress={() => setCamForm(p => ({ ...p, advertiserId: String(adv.id) }))}
                  >
                    <Text style={[s.filterBtnLabel, String(camForm.advertiserId) === String(adv.id) && { color: NEWS.primary }]}>{adv.name}</Text>
                  </Pressable>
                ))}
              </View>
              {[
                ['name', 'Campaign Name *'],
                ['budget', 'Budget (RWF)'],
                ['startsAt', 'Start Date (YYYY-MM-DD)'],
                ['endsAt', 'End Date (YYYY-MM-DD)'],
                ['notes', 'Notes'],
              ].map(([field, label]) => (
                <View key={field}>
                  <Text style={s.inputLabel}>{label}</Text>
                  <TextInput
                    style={s.input}
                    placeholder={label}
                    placeholderTextColor={NEWS.muted}
                    value={camForm[field]}
                    onChangeText={v => setCamForm(p => ({ ...p, [field]: v }))}
                    keyboardType={field === 'budget' ? 'numeric' : 'default'}
                  />
                </View>
              ))}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <ActionBtn label="Save" icon="content-save-outline" color={NEWS.success} onPress={saveCampaign} />
                <ActionBtn label="Cancel" color={NEWS.muted} onPress={() => { setShowCamForm(false); setCamForm(EMPTY_CAM); }} />
              </View>
            </View>
          )}
          {loading ? <ActivityIndicator color={NEWS.primary} style={{ marginTop: 24 }} /> : campaigns.length === 0 ? (
            <EmptyState icon="bullhorn-variant-outline" text="No campaigns yet" sub="Create an advertiser first, then attach campaigns" />
          ) : (
            <View style={[s.panel, { marginTop: spacing.md }]}>
              {campaigns.map((cam, i) => (
                <View key={cam.id} style={[s.row, i === campaigns.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.rowTitle}>{cam.name}</Text>
                    <Text style={s.rowMeta}>
                      {cam.advertiser_name} · {cam.budget ? `RWF ${Number(cam.budget).toLocaleString()}` : 'No budget'}
                      {cam.starts_at ? ` · ${fmtDate(cam.starts_at)}` : ''}
                    </Text>
                  </View>
                  <StatusBadge status={cam.status} />
                  {cam.status === 'draft' && (
                    <Pressable style={{ padding: 8 }} onPress={() => setCampaignStatus(cam.id, 'active')}>
                      <MaterialCommunityIcons name="play-circle-outline" size={18} color={NEWS.success} />
                    </Pressable>
                  )}
                  {cam.status === 'active' && (
                    <Pressable style={{ padding: 8 }} onPress={() => setCampaignStatus(cam.id, 'paused')}>
                      <MaterialCommunityIcons name="pause-circle-outline" size={18} color={NEWS.warning} />
                    </Pressable>
                  )}
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}
