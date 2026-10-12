/**
 * FinanceTransactions.js — Ibikorwa by'imari (Transactions section).
 *
 * Filterable list of all income/expense/transfer/journal transactions with
 * search, date range, and type tabs. Includes modals for recording new
 * transactions (TxnModal), bank transfers (TransferModal), and journal
 * entries (JournalModal).
 */
import React from 'react';
import {
  View, Text, ScrollView, TextInput, Pressable, Modal,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, spacing, radius } from '../../../theme';
import {
  FIN, TXN_TABS, PAYMENT_METHODS, SURFACE,
  formatRWF, fmtDate,
  SectionHeader, Chip, StatusBadge, EmptyState, ActionBtn,
  FormField, DropdownField, s,
} from './FinanceShared';

export function TransactionsSection({ ctx }) {
  const {
    transactions, txnLoading, txnTab, setTxnTab, txnSearch, setTxnSearch,
    wide, setTxnType, setShowTxnModal,
    fetchTransactions, buildTxnFilters, handleExportTransactions,
    handleTxnAction, openEditTxn,
  } = ctx;

  return (
    <>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', gap: spacing.xs }}>
            {TXN_TABS.map(t => (
              <Chip key={t.key} label={t.label} active={txnTab === t.key} onPress={() => setTxnTab(t.key)} />
            ))}
          </View>
        </ScrollView>
        <Pressable style={s.addBtn} onPress={() => { setTxnType('income'); setShowTxnModal(true); }}>
          <MaterialCommunityIcons name="plus" size={16} color="#fff" />
          <Text style={s.addBtnLabel}>New</Text>
        </Pressable>
      </View>

      <View style={[s.filterRow, { marginBottom: spacing.lg }]}>
        <View style={s.searchBox}>
          <MaterialCommunityIcons name="magnify" size={16} color={colors.textMuted} />
          <TextInput
            style={s.searchInput}
            value={txnSearch}
            onChangeText={t => { setTxnSearch(t); }}
            onSubmitEditing={() => fetchTransactions(buildTxnFilters())}
            placeholder="Search by description, reference..."
            placeholderTextColor={colors.textMuted}
            returnKeyType="search"
          />
        </View>
        <Pressable style={s.filterBtn} onPress={handleExportTransactions}>
          <MaterialCommunityIcons name="download" size={16} color={colors.blue300} />
          <Text style={s.filterBtnLabel}>Export CSV</Text>
        </Pressable>
      </View>

      {txnLoading ? <ActivityIndicator color={FIN.primary} size="large" style={{ marginTop: 40 }} /> : transactions.length === 0 ? (
        <EmptyState icon="receipt" text="No transactions found" sub="Record your first transaction to get started" />
      ) : (
        <>
          {wide && (
            <View style={s.tableHeader}>
              <Text style={[s.th, { flex: 0.8 }]}>Date</Text>
              <Text style={[s.th, { flex: 0.8 }]}>Reference</Text>
              <Text style={[s.th, { flex: 0.6 }]}>Type</Text>
              <Text style={[s.th, { flex: 1.5 }]}>Description</Text>
              <Text style={[s.th, { flex: 0.8, textAlign: 'right' }]}>Amount</Text>
              <Text style={[s.th, { flex: 0.6 }]}>Status</Text>
              <Text style={[s.th, { flex: 0.8 }]}>Actions</Text>
            </View>
          )}
          {transactions.map(tx => (
            <View key={tx.id} style={s.txTableRow}>
              {wide ? (
                <>
                  <Text style={[s.td, { flex: 0.8 }]}>{fmtDate(tx.txn_date)}</Text>
                  <Text style={[s.td, { flex: 0.8 }]}>{tx.txn_ref}</Text>
                  <Text style={[s.td, { flex: 0.6 }]}>{tx.txn_type}</Text>
                  <Text style={[s.td, { flex: 1.5 }]} numberOfLines={1}>{tx.description}</Text>
                  <Text style={[s.td, { flex: 0.8, textAlign: 'right', color: tx.txn_type === 'income' ? FIN.income : FIN.expense }]}>{formatRWF(tx.amount)}</Text>
                  <View style={{ flex: 0.6 }}><StatusBadge status={tx.status} /></View>
                  <View style={{ flex: 0.8, flexDirection: 'row', gap: 6 }}>
                    {tx.status === 'draft' && <ActionBtn label="Edit" color={FIN.purple} onPress={() => openEditTxn(tx)} />}
                    {tx.status === 'draft' && <ActionBtn label="Submit" color={FIN.primary} onPress={() => handleTxnAction(tx.id, 'approve')} />}
                    {tx.status === 'pending_approval' && <ActionBtn label="Approve" color={FIN.income} onPress={() => handleTxnAction(tx.id, 'approve')} />}
                    {tx.status === 'approved' && <ActionBtn label="Post" color={FIN.income} onPress={() => handleTxnAction(tx.id, 'post')} />}
                    {tx.status === 'posted' && <ActionBtn label="Void" color={FIN.expense} onPress={() => handleTxnAction(tx.id, 'void')} />}
                  </View>
                </>
              ) : (
                <>
                  <View style={{ flex: 1 }}>
                    <Text style={s.txDesc}>{tx.description}</Text>
                    <Text style={s.txMeta}>{fmtDate(tx.txn_date)} · {tx.txn_ref} · {tx.txn_type}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[s.txAmount, { color: tx.txn_type === 'income' ? FIN.income : FIN.expense }]}>{formatRWF(tx.amount)}</Text>
                    <StatusBadge status={tx.status} />
                  </View>
                </>
              )}
            </View>
          ))}
        </>
      )}
    </>
  );
}

export function TxnModal({ ctx }) {
  const {
    showTxnModal, setShowTxnModal, editingTxnId, txnType, setTxnType,
    txnForm, setTxnForm, txnSaving, handleSaveTxn, resetTxnForm,
    accounts, bankAccounts, contacts,
  } = ctx;

  const catOptions = accounts.filter(a => {
    if (txnType === 'income') return a.account_type === 'income';
    if (txnType === 'expense') return a.account_type === 'expense';
    return true;
  }).map(a => ({ value: a.id, label: `${a.code} — ${a.name}` }));

  const bankOpts = bankAccounts.map(b => ({ value: b.id, label: b.name }));
  const contactOpts = [{ value: '', label: 'None' }, ...contacts.map(c => ({ value: c.id, label: c.name }))];

  return (
    <Modal visible={showTxnModal} transparent animationType="fade" onRequestClose={() => setShowTxnModal(false)}>
      <View style={s.modalOverlay}>
        <View style={s.modalCard}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>{editingTxnId ? 'Edit' : 'New'} {txnType.charAt(0).toUpperCase() + txnType.slice(1)}</Text>
            <Pressable onPress={() => { setShowTxnModal(false); resetTxnForm(); }}><MaterialCommunityIcons name="close" size={22} color={colors.white} /></Pressable>
          </View>
          <ScrollView style={{ maxHeight: 500 }} contentContainerStyle={{ padding: spacing.lg }}>
            {!editingTxnId && (
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
                {['income', 'expense'].map(t => (
                  <Chip key={t} label={t.charAt(0).toUpperCase() + t.slice(1)} active={txnType === t} onPress={() => setTxnType(t)} />
                ))}
              </View>
            )}
            <FormField label="Date" value={txnForm.txn_date} onChangeText={v => setTxnForm({ ...txnForm, txn_date: v })} placeholder="YYYY-MM-DD" />
            <FormField label="Description *" value={txnForm.description} onChangeText={v => setTxnForm({ ...txnForm, description: v })} placeholder="What is this for?" />
            <FormField label="Amount (RWF) *" value={txnForm.amount} onChangeText={v => setTxnForm({ ...txnForm, amount: v })} placeholder="0" keyboardType="numeric" />
            {catOptions.length > 0 && <DropdownField label="Category Account" value={txnForm.category_account_id} options={catOptions} onChange={v => setTxnForm({ ...txnForm, category_account_id: v })} />}
            {bankOpts.length > 0 && <DropdownField label="Bank / Cash Account" value={txnForm.bank_account_id} options={bankOpts} onChange={v => setTxnForm({ ...txnForm, bank_account_id: v })} />}
            <DropdownField label="Payment Method" value={txnForm.payment_method} options={PAYMENT_METHODS} onChange={v => setTxnForm({ ...txnForm, payment_method: v })} />
            <DropdownField label="Contact" value={txnForm.contact_id} options={contactOpts} onChange={v => setTxnForm({ ...txnForm, contact_id: v })} />
            <FormField label="External Reference" value={txnForm.external_ref} onChangeText={v => setTxnForm({ ...txnForm, external_ref: v })} placeholder="Invoice #, receipt #, etc." />
            <FormField label="Notes" value={txnForm.notes} onChangeText={v => setTxnForm({ ...txnForm, notes: v })} placeholder="Additional notes" multiline />
            <DropdownField label="Status" value={txnForm.status} options={[{ value: 'draft', label: 'Save as Draft' }, { value: 'pending_approval', label: 'Submit for Approval' }]} onChange={v => setTxnForm({ ...txnForm, status: v })} />
          </ScrollView>
          <View style={s.modalFooter}>
            <Pressable style={s.cancelBtn} onPress={() => setShowTxnModal(false)}>
              <Text style={s.cancelBtnLabel}>Cancel</Text>
            </Pressable>
            <Pressable style={s.saveBtn} onPress={handleSaveTxn} disabled={txnSaving}>
              {txnSaving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.saveBtnLabel}>Save Transaction</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function TransferModal({ ctx }) {
  const {
    showTransferModal, setShowTransferModal,
    transferForm, setTransferForm, transferSaving, handleCreateTransfer,
    bankAccounts,
  } = ctx;
  const bankOpts = bankAccounts.map(b => ({ value: String(b.id), label: b.name }));

  return (
    <Modal visible={showTransferModal} transparent animationType="fade" onRequestClose={() => setShowTransferModal(false)}>
      <View style={s.modalOverlay}>
        <View style={s.modalCard}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Transfer Funds</Text>
            <Pressable onPress={() => setShowTransferModal(false)}><MaterialCommunityIcons name="close" size={22} color={colors.white} /></Pressable>
          </View>
          <View style={{ padding: spacing.lg }}>
            <FormField label="Date" value={transferForm.txn_date} onChangeText={v => setTransferForm({ ...transferForm, txn_date: v })} placeholder="YYYY-MM-DD" />
            <FormField label="Description *" value={transferForm.description} onChangeText={v => setTransferForm({ ...transferForm, description: v })} placeholder="e.g. Move funds to operations" />
            <FormField label="Amount (RWF) *" value={transferForm.amount} onChangeText={v => setTransferForm({ ...transferForm, amount: v })} placeholder="0" keyboardType="numeric" />
            <DropdownField label="From (Source) *" value={transferForm.source_bank_id} options={bankOpts} onChange={v => setTransferForm({ ...transferForm, source_bank_id: v })} />
            <DropdownField label="To (Destination) *" value={transferForm.destination_bank_id} options={bankOpts} onChange={v => setTransferForm({ ...transferForm, destination_bank_id: v })} />
            <FormField label="Reference" value={transferForm.reference} onChangeText={v => setTransferForm({ ...transferForm, reference: v })} placeholder="Transfer reference" />
            <FormField label="Notes" value={transferForm.notes} onChangeText={v => setTransferForm({ ...transferForm, notes: v })} placeholder="Additional notes" multiline />
          </View>
          <View style={s.modalFooter}>
            <Pressable style={s.cancelBtn} onPress={() => setShowTransferModal(false)}><Text style={s.cancelBtnLabel}>Cancel</Text></Pressable>
            <Pressable style={s.saveBtn} onPress={handleCreateTransfer} disabled={transferSaving}>
              {transferSaving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.saveBtnLabel}>Post Transfer</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function JournalModal({ ctx }) {
  const {
    showJournalModal, setShowJournalModal,
    journalForm, setJournalForm, journalSaving, handleCreateJournal,
    addJournalLine, updateJournalLine, removeJournalLine,
    accounts,
  } = ctx;
  const allAccounts = accounts.map(a => ({ value: String(a.id), label: `${a.code} — ${a.name}` }));
  const totalD = journalForm.lines.reduce((sum, l) => sum + (parseFloat(l.debit) || 0), 0);
  const totalC = journalForm.lines.reduce((sum, l) => sum + (parseFloat(l.credit) || 0), 0);
  const balanced = Math.abs(totalD - totalC) < 0.01;

  return (
    <Modal visible={showJournalModal} transparent animationType="fade" onRequestClose={() => setShowJournalModal(false)}>
      <View style={s.modalOverlay}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: spacing.xl }}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Journal Entry</Text>
              <Pressable onPress={() => setShowJournalModal(false)}><MaterialCommunityIcons name="close" size={22} color={colors.white} /></Pressable>
            </View>
            <View style={{ padding: spacing.lg }}>
              <FormField label="Date" value={journalForm.txn_date} onChangeText={v => setJournalForm({ ...journalForm, txn_date: v })} placeholder="YYYY-MM-DD" />
              <FormField label="Description *" value={journalForm.description} onChangeText={v => setJournalForm({ ...journalForm, description: v })} placeholder="Journal description" />
              <FormField label="Notes" value={journalForm.notes} onChangeText={v => setJournalForm({ ...journalForm, notes: v })} placeholder="Additional notes" multiline />

              <View style={{ marginTop: spacing.lg }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
                  <Text style={[s.sectionTitle, { fontSize: 14 }]}>Journal Lines</Text>
                  <Pressable style={s.filterBtn} onPress={addJournalLine}>
                    <MaterialCommunityIcons name="plus" size={14} color={colors.blue300} />
                    <Text style={s.filterBtnLabel}>Add Line</Text>
                  </Pressable>
                </View>
                {journalForm.lines.map((line, idx) => (
                  <View key={idx} style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.sm }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: colors.blue300, fontSize: 12, fontWeight: '600' }}>Line {idx + 1}</Text>
                      {journalForm.lines.length > 2 && (
                        <Pressable onPress={() => removeJournalLine(idx)}><MaterialCommunityIcons name="close" size={16} color={FIN.expense} /></Pressable>
                      )}
                    </View>
                    <DropdownField label="Account" value={line.account_id} options={allAccounts} onChange={v => updateJournalLine(idx, 'account_id', v)} />
                    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                      <View style={{ flex: 1 }}><FormField label="Debit" value={line.debit} onChangeText={v => updateJournalLine(idx, 'debit', v)} placeholder="0" keyboardType="numeric" /></View>
                      <View style={{ flex: 1 }}><FormField label="Credit" value={line.credit} onChangeText={v => updateJournalLine(idx, 'credit', v)} placeholder="0" keyboardType="numeric" /></View>
                    </View>
                    <FormField label="Line Description" value={line.description} onChangeText={v => updateJournalLine(idx, 'description', v)} placeholder="Optional" />
                  </View>
                ))}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }}>
                  <Text style={{ color: colors.white, fontWeight: '700' }}>Total Debits: {formatRWF(totalD)}</Text>
                  <Text style={{ color: colors.white, fontWeight: '700' }}>Total Credits: {formatRWF(totalC)}</Text>
                </View>
                {!balanced && <Text style={{ color: FIN.expense, fontSize: 12, marginTop: 4 }}>⚠ Journal is not balanced (difference: {formatRWF(Math.abs(totalD - totalC))})</Text>}
              </View>

              <DropdownField label="Status" value={journalForm.status} options={[{ value: 'draft', label: 'Save as Draft' }, { value: 'pending_approval', label: 'Submit for Approval' }]} onChange={v => setJournalForm({ ...journalForm, status: v })} />
            </View>
            <View style={s.modalFooter}>
              <Pressable style={s.cancelBtn} onPress={() => setShowJournalModal(false)}><Text style={s.cancelBtnLabel}>Cancel</Text></Pressable>
              <Pressable style={[s.saveBtn, !balanced && { opacity: 0.5 }]} onPress={handleCreateJournal} disabled={journalSaving || !balanced}>
                {journalSaving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.saveBtnLabel}>Create Journal</Text>}
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
