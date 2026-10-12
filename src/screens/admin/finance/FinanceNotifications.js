/**
 * FinanceNotifications.js — Amakuru y'imari (Finance alerts & notifications).
 *
 * Shows finance-specific notifications (overdue invoices, budget alerts,
 * pending approvals). Includes a "Check Now" button that triggers the server
 * to scan for new alert conditions and insert notifications.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, spacing } from '../../../theme';
import { apiFetch } from '../../../services/apiClient';
import {
  FIN, fmtDate, alertMsg,
  SectionHeader, EmptyState, s,
} from './FinanceShared';

const TYPE_ICONS = {
  finance_overdue: { icon: 'clock-alert-outline', color: FIN.expense, bg: FIN.expenseBg },
  finance_budget: { icon: 'chart-box-outline', color: FIN.warning, bg: FIN.warningBg },
  finance_approval: { icon: 'check-decagram-outline', color: FIN.primary, bg: FIN.primaryBg },
};

export default function FinanceNotifications({ ctx }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  async function fetchNotifications() {
    setLoading(true);
    try {
      const data = await apiFetch('/finance/finance-notifications');
      setNotifications(Array.isArray(data) ? data : []);
    } catch { setNotifications([]); }
    setLoading(false);
  }

  useEffect(() => { fetchNotifications(); }, []);

  async function handleCheckNow() {
    setChecking(true);
    try {
      const result = await apiFetch('/finance/finance-notifications/check', { method: 'POST' });
      if (result.notifications_created > 0) {
        alertMsg('Alerts', `${result.notifications_created} new alert(s) generated`);
      } else {
        alertMsg('All Clear', 'No new alerts found');
      }
      fetchNotifications();
    } catch (e) { alertMsg('Error', e.message); }
    setChecking(false);
  }

  async function markRead(id) {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch {}
  }

  async function markAllRead() {
    try {
      await apiFetch('/notifications/read-all', { method: 'PUT' });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {}
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <>
      <SectionHeader title="Finance Alerts" icon="bell-ring-outline">
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {unreadCount > 0 && (
            <Pressable style={s.filterBtn} onPress={markAllRead}>
              <MaterialCommunityIcons name="check-all" size={16} color={colors.blue300} />
              <Text style={s.filterBtnLabel}>Mark All Read</Text>
            </Pressable>
          )}
          <Pressable style={[s.filterBtn, { backgroundColor: FIN.primaryBg }]} onPress={handleCheckNow} disabled={checking}>
            {checking ? <ActivityIndicator color={FIN.primary} size="small" /> : (
              <>
                <MaterialCommunityIcons name="refresh" size={16} color={FIN.primary} />
                <Text style={[s.filterBtnLabel, { color: FIN.primary }]}>Check Now</Text>
              </>
            )}
          </Pressable>
        </View>
      </SectionHeader>

      {unreadCount > 0 && (
        <View style={[s.alertBanner, { marginBottom: spacing.lg }]}>
          <MaterialCommunityIcons name="bell-badge-outline" size={18} color={FIN.warning} />
          <Text style={s.alertText}>{unreadCount} unread alert{unreadCount > 1 ? 's' : ''}</Text>
        </View>
      )}

      {loading ? <ActivityIndicator color={FIN.primary} size="large" style={{ marginTop: 30 }} /> : notifications.length === 0 ? (
        <EmptyState icon="bell-check-outline" text="No finance alerts" sub="Use 'Check Now' to scan for overdue invoices, budget limits, and pending approvals" />
      ) : (
        <View style={s.panel}>
          {notifications.map(n => {
            const meta = TYPE_ICONS[n.type] || TYPE_ICONS.finance_approval;
            return (
              <Pressable key={n.id} style={[s.txRow, { opacity: n.is_read ? 0.6 : 1 }]} onPress={() => !n.is_read && markRead(n.id)}>
                <View style={[s.kpiIcon, { backgroundColor: meta.bg, width: 36, height: 36, marginRight: spacing.sm }]}>
                  <MaterialCommunityIcons name={meta.icon} size={18} color={meta.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.txDesc, !n.is_read && { fontWeight: '700' }]}>{n.title}</Text>
                  <Text style={s.txMeta}>{n.body}</Text>
                  <Text style={[s.txMeta, { fontSize: 11, marginTop: 2 }]}>{fmtDate(n.created_at)}</Text>
                </View>
                {!n.is_read && (
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: FIN.primary, marginLeft: spacing.sm }} />
                )}
              </Pressable>
            );
          })}
        </View>
      )}
    </>
  );
}
