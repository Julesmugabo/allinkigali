/**
 * FinanceApprovals.js — Kwemeza ibikorwa (Approval workflow section).
 *
 * Shows pending transactions that require approval before they are finalized.
 * Approvers can approve or reject each item with an optional note.
 */
import React, { useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { spacing } from '../../../theme';
import {
  FIN, formatRWF, fmtDate,
  KPICard, SectionHeader, StatusBadge, EmptyState, ActionBtn, s,
} from './FinanceShared';

export default function FinanceApprovals({ ctx }) {
  const {
    approvals, approvalsLoading, fetchApprovals, handleTxnAction,
  } = ctx;

  useEffect(() => { fetchApprovals(); }, []);

  const pending = approvals.filter(a => a.status === 'pending_approval');
  const drafts = approvals.filter(a => a.status === 'draft');
  const approved = approvals.filter(a => a.status === 'approved');

  return (
    <>
      {approvalsLoading ? <ActivityIndicator color={FIN.primary} size="large" style={{ marginTop: 40 }} /> : (
        <>
          <View style={s.kpiRow}>
            <KPICard icon="clock-outline" label="Pending Approval" value={String(pending.length)} color={FIN.warning} bgColor={FIN.warningBg} />
            <KPICard icon="file-edit-outline" label="Drafts" value={String(drafts.length)} color="#6B7280" bgColor="rgba(107,114,128,0.1)" />
            <KPICard icon="check-circle-outline" label="Approved (not posted)" value={String(approved.length)} color={FIN.primary} bgColor={FIN.primaryBg} />
          </View>

          {pending.length > 0 && (
            <View style={s.panel}>
              <SectionHeader title="Pending Approval" />
              {pending.map(tx => (
                <View key={tx.id} style={s.txRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.txDesc}>{tx.description}</Text>
                    <Text style={s.txMeta}>{fmtDate(tx.txn_date)} · {tx.txn_ref} · {tx.txn_type}{tx.created_by_name ? ` · by ${tx.created_by_name}` : ''}</Text>
                  </View>
                  <Text style={[s.txAmount, { color: tx.txn_type === 'income' ? FIN.income : FIN.expense, marginRight: spacing.md }]}>{formatRWF(tx.amount)}</Text>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <ActionBtn label="Approve" color={FIN.income} onPress={() => { handleTxnAction(tx.id, 'approve'); setTimeout(fetchApprovals, 500); }} />
                  </View>
                </View>
              ))}
            </View>
          )}

          {approved.length > 0 && (
            <View style={s.panel}>
              <SectionHeader title="Approved — Ready to Post" />
              {approved.map(tx => (
                <View key={tx.id} style={s.txRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.txDesc}>{tx.description}</Text>
                    <Text style={s.txMeta}>{fmtDate(tx.txn_date)} · {tx.txn_ref} · {tx.txn_type}</Text>
                  </View>
                  <Text style={[s.txAmount, { color: tx.txn_type === 'income' ? FIN.income : FIN.expense, marginRight: spacing.md }]}>{formatRWF(tx.amount)}</Text>
                  <ActionBtn label="Post" color={FIN.primary} onPress={() => { handleTxnAction(tx.id, 'post'); setTimeout(fetchApprovals, 500); }} />
                </View>
              ))}
            </View>
          )}

          {drafts.length > 0 && (
            <View style={s.panel}>
              <SectionHeader title="Drafts" />
              {drafts.map(tx => (
                <View key={tx.id} style={s.txRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.txDesc}>{tx.description}</Text>
                    <Text style={s.txMeta}>{fmtDate(tx.txn_date)} · {tx.txn_ref} · {tx.txn_type}</Text>
                  </View>
                  <Text style={[s.txAmount, { color: tx.txn_type === 'income' ? FIN.income : FIN.expense }]}>{formatRWF(tx.amount)}</Text>
                </View>
              ))}
            </View>
          )}

          {approvals.length === 0 && <EmptyState icon="clipboard-check-outline" text="No pending items" sub="All transactions are either posted or voided" />}
        </>
      )}
    </>
  );
}
