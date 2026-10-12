/**
 * FinanceRecurring.js — Ibikorwa bigaruka (Recurring transactions section).
 *
 * Templates for transactions that repeat on a schedule (weekly, monthly,
 * quarterly, yearly). Each template can be run manually or auto-generated.
 * Includes RecurringModal for creating new recurring templates.
 */
import React from 'react';
import {
  View, Text, ScrollView, Pressable, Modal, ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, spacing } from '../../../theme';
import {
  FIN, PAYMENT_METHODS,
  formatRWF, fmtDate,
  SectionHeader, EmptyState,
  FormField, DropdownField, s,
} from './FinanceShared';

export function RecurringSection({ ctx }) {
  const {
    recurringTxns, recurringLoading,
    setShowRecurringModal, fetchRecurring,
    handleGenerateRecurring, handleDeleteRecurring,
  } = ctx;

  if (recurringTxns.length === 0 && !recurringLoading) {
    fetchRecurring();
  }

  return (
    <>
      <SectionHeader title="Recurring Transactions" icon="refresh-auto">
        <Pressable style={s.filterBtn} onPress={() => setShowRecurringModal(true)}>
          <MaterialCommunityIcons name="plus" size={16} color={colors.blue300} />
          <Text style={s.filterBtnLabel}>New Template</Text>
        </Pressable>
      </SectionHeader>

      {recurringLoading && <ActivityIndicator color={FIN.primary} size="large" style={{ marginTop: 30 }} />}

      {recurringTxns.length === 0 && !recurringLoading && <EmptyState icon="refresh-auto" text="No recurring templates yet" />}

      {recurringTxns.map(r => (
        <View key={r.id} style={s.txnRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.txnDesc}>{r.description}</Text>
            <Text style={s.txnMeta}>{r.txn_type} · {r.frequency} · Next: {fmtDate(r.next_run_date)}</Text>
            {r.category_name && <Text style={s.txnMeta}>Account: {r.category_name}</Text>}
            {r.contact_name && <Text style={s.txnMeta}>Contact: {r.contact_name}</Text>}
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <Text style={[s.txnAmount, { color: r.txn_type === 'income' ? FIN.income : FIN.expense }]}>{formatRWF(r.amount)}</Text>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Pressable style={s.filterBtn} onPress={() => handleGenerateRecurring(r.id)}>
                <MaterialCommunityIcons name="play" size={14} color={FIN.income} />
                <Text style={[s.filterBtnLabel, { color: FIN.income }]}>Run Now</Text>
              </Pressable>
              <Pressable style={s.filterBtn} onPress={() => handleDeleteRecurring(r.id)}>
                <MaterialCommunityIcons name="close" size={14} color={FIN.expense} />
              </Pressable>
            </View>
          </View>
        </View>
      ))}
    </>
  );
}

export function RecurringModal({ ctx }) {
  const {
    showRecurringModal, setShowRecurringModal,
    recurringForm, setRecurringForm, recurringSaving, handleCreateRecurring,
    accounts, bankAccounts, contacts,
  } = ctx;
  const catOptions = accounts.filter(a => ['income', 'expense'].includes(a.account_type)).map(a => ({ value: String(a.id), label: `${a.code} ${a.name}` }));
  const bankOpts = bankAccounts.map(b => ({ value: String(b.id), label: b.name }));
  const contactOpts = contacts.map(c => ({ value: String(c.id), label: c.name }));

  return (
    <Modal visible={showRecurringModal} transparent animationType="fade" onRequestClose={() => setShowRecurringModal(false)}>
      <View style={s.modalOverlay}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: spacing.xl }}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>New Recurring Template</Text>
              <Pressable onPress={() => setShowRecurringModal(false)}><MaterialCommunityIcons name="close" size={22} color={colors.white} /></Pressable>
            </View>
            <View style={{ padding: spacing.lg }}>
              <DropdownField label="Type" value={recurringForm.txn_type} options={[{ value: 'income', label: 'Income' }, { value: 'expense', label: 'Expense' }]} onChange={v => setRecurringForm({ ...recurringForm, txn_type: v })} />
              <FormField label="Description *" value={recurringForm.description} onChangeText={v => setRecurringForm({ ...recurringForm, description: v })} placeholder="e.g. Monthly rent" />
              <FormField label="Amount (RWF) *" value={recurringForm.amount} onChangeText={v => setRecurringForm({ ...recurringForm, amount: v })} placeholder="0" keyboardType="numeric" />
              <DropdownField label="Frequency" value={recurringForm.frequency} options={[{ value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' }, { value: 'quarterly', label: 'Quarterly' }, { value: 'yearly', label: 'Yearly' }]} onChange={v => setRecurringForm({ ...recurringForm, frequency: v })} />
              <FormField label="Next Run Date *" value={recurringForm.next_run_date} onChangeText={v => setRecurringForm({ ...recurringForm, next_run_date: v })} placeholder="YYYY-MM-DD" />
              <FormField label="End Date" value={recurringForm.end_date} onChangeText={v => setRecurringForm({ ...recurringForm, end_date: v })} placeholder="YYYY-MM-DD (optional)" />
              {catOptions.length > 0 && <DropdownField label="Category Account" value={recurringForm.category_account_id} options={catOptions} onChange={v => setRecurringForm({ ...recurringForm, category_account_id: v })} />}
              {bankOpts.length > 0 && <DropdownField label="Bank / Cash Account" value={recurringForm.bank_account_id} options={bankOpts} onChange={v => setRecurringForm({ ...recurringForm, bank_account_id: v })} />}
              {contactOpts.length > 0 && <DropdownField label="Contact" value={recurringForm.contact_id} options={contactOpts} onChange={v => setRecurringForm({ ...recurringForm, contact_id: v })} />}
              <DropdownField label="Payment Method" value={recurringForm.payment_method} options={PAYMENT_METHODS} onChange={v => setRecurringForm({ ...recurringForm, payment_method: v })} />
            </View>
            <View style={s.modalFooter}>
              <Pressable style={s.cancelBtn} onPress={() => setShowRecurringModal(false)}><Text style={s.cancelBtnLabel}>Cancel</Text></Pressable>
              <Pressable style={s.saveBtn} onPress={handleCreateRecurring} disabled={recurringSaving}>
                {recurringSaving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.saveBtnLabel}>Create Template</Text>}
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
