/**
 * FinanceInvoices.js — Amafatire (Invoices section).
 *
 * List of all invoices with status filters (draft, sent, paid, overdue).
 * Includes InvoiceModal for creating/editing invoices with line items,
 * and PayModal for recording payments against outstanding invoices.
 */
import React, { useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, Modal, ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, spacing } from '../../../theme';
import {
  FIN, PAYMENT_METHODS,
  formatRWF, fmtDate,
  Chip, StatusBadge, EmptyState,
  FormField, DropdownField, s,
} from './FinanceShared';

export function InvoicesSection({ ctx }) {
  const {
    invoices, invoiceLoading, invoiceTab, setInvoiceTab,
    setShowInvoiceModal, wide,
    setPayInvoice, setPayForm, setShowPayModal,
    fetchInvoices,
  } = ctx;

  useEffect(() => { fetchInvoices(invoiceTab === 'all' ? {} : { type: invoiceTab }); }, [invoiceTab]);

  const INV_TABS = [
    { key: 'all', label: 'All' },
    { key: 'receivable', label: 'Receivable' },
    { key: 'payable', label: 'Payable' },
  ];

  return (
    <>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', gap: spacing.xs }}>
            {INV_TABS.map(t => (
              <Chip key={t.key} label={t.label} active={invoiceTab === t.key} onPress={() => setInvoiceTab(t.key)} />
            ))}
          </View>
        </ScrollView>
        <Pressable style={s.addBtn} onPress={() => setShowInvoiceModal(true)}>
          <MaterialCommunityIcons name="plus" size={16} color="#fff" />
          <Text style={s.addBtnLabel}>New Invoice</Text>
        </Pressable>
      </View>

      {invoiceLoading ? <ActivityIndicator color={FIN.primary} size="large" style={{ marginTop: 40 }} /> : invoices.length === 0 ? (
        <EmptyState icon="receipt" text="No invoices found" sub="Create your first invoice" />
      ) : (
        <View style={s.panel}>
          {wide && (
            <View style={s.tableHeader}>
              <Text style={[s.th, { flex: 0.8 }]}>Invoice #</Text>
              <Text style={[s.th, { flex: 0.6 }]}>Type</Text>
              <Text style={[s.th, { flex: 1.2 }]}>Contact</Text>
              <Text style={[s.th, { flex: 0.7 }]}>Due Date</Text>
              <Text style={[s.th, { flex: 0.8, textAlign: 'right' }]}>Total</Text>
              <Text style={[s.th, { flex: 0.8, textAlign: 'right' }]}>Outstanding</Text>
              <Text style={[s.th, { flex: 0.6 }]}>Status</Text>
              <Text style={[s.th, { flex: 0.6 }]}>Actions</Text>
            </View>
          )}
          {invoices.map(inv => (
            <View key={inv.id} style={s.txTableRow}>
              {wide ? (
                <>
                  <Text style={[s.td, { flex: 0.8 }]}>{inv.invoice_number}</Text>
                  <Text style={[s.td, { flex: 0.6 }]}>{inv.invoice_type}</Text>
                  <Text style={[s.td, { flex: 1.2 }]}>{inv.contact_name}</Text>
                  <Text style={[s.td, { flex: 0.7 }]}>{fmtDate(inv.due_date)}</Text>
                  <Text style={[s.td, { flex: 0.8, textAlign: 'right' }]}>{formatRWF(inv.total_amount)}</Text>
                  <Text style={[s.td, { flex: 0.8, textAlign: 'right', color: Number(inv.outstanding) > 0 ? FIN.warning : FIN.income }]}>{formatRWF(inv.outstanding)}</Text>
                  <View style={{ flex: 0.6 }}><StatusBadge status={inv.status} /></View>
                  <View style={{ flex: 0.6, flexDirection: 'row', gap: 4 }}>
                    {Number(inv.outstanding) > 0 && inv.status !== 'voided' && (
                      <Pressable style={[s.actionBtn, { borderColor: FIN.income }]} onPress={() => { setPayInvoice(inv); setPayForm({ amount: String(inv.outstanding), payment_date: new Date().toISOString().slice(0, 10), payment_method: '', reference: '' }); setShowPayModal(true); }}>
                        <Text style={[s.actionBtnLabel, { color: FIN.income }]}>Pay</Text>
                      </Pressable>
                    )}
                  </View>
                </>
              ) : (
                <>
                  <View style={{ flex: 1 }}>
                    <Text style={s.txDesc}>{inv.invoice_number} — {inv.contact_name}</Text>
                    <Text style={s.txMeta}>{inv.invoice_type} · Due {fmtDate(inv.due_date)}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[s.txAmount, { color: Number(inv.outstanding) > 0 ? FIN.warning : FIN.income }]}>{formatRWF(inv.outstanding)}</Text>
                    <StatusBadge status={inv.status} />
                    {Number(inv.outstanding) > 0 && inv.status !== 'voided' && (
                      <Pressable style={{ marginTop: 4 }} onPress={() => { setPayInvoice(inv); setPayForm({ amount: String(inv.outstanding), payment_date: new Date().toISOString().slice(0, 10), payment_method: '', reference: '' }); setShowPayModal(true); }}>
                        <Text style={{ fontSize: 12, color: FIN.income, fontWeight: '600' }}>Record Payment</Text>
                      </Pressable>
                    )}
                  </View>
                </>
              )}
            </View>
          ))}
        </View>
      )}
    </>
  );
}

export function InvoiceModal({ ctx }) {
  const {
    showInvoiceModal, setShowInvoiceModal,
    invoiceForm, setInvoiceForm, invoiceSaving, handleCreateInvoice,
    contacts,
  } = ctx;
  const contactOpts = contacts.map(c => ({ value: c.id, label: c.name }));

  return (
    <Modal visible={showInvoiceModal} transparent animationType="fade" onRequestClose={() => setShowInvoiceModal(false)}>
      <View style={s.modalOverlay}>
        <View style={s.modalCard}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>New Invoice</Text>
            <Pressable onPress={() => setShowInvoiceModal(false)}><MaterialCommunityIcons name="close" size={22} color={colors.white} /></Pressable>
          </View>
          <ScrollView style={{ maxHeight: 500 }} contentContainerStyle={{ padding: spacing.lg }}>
            <DropdownField label="Invoice Type" value={invoiceForm.invoice_type} options={[{ value: 'receivable', label: 'Receivable (customer owes us)' }, { value: 'payable', label: 'Payable (we owe supplier)' }]} onChange={v => setInvoiceForm({ ...invoiceForm, invoice_type: v })} />
            <FormField label="Invoice Number *" value={invoiceForm.invoice_number} onChangeText={v => setInvoiceForm({ ...invoiceForm, invoice_number: v })} placeholder="INV-001" />
            <DropdownField label="Contact *" value={invoiceForm.contact_id} options={contactOpts} onChange={v => setInvoiceForm({ ...invoiceForm, contact_id: v })} />
            <FormField label="Invoice Date" value={invoiceForm.invoice_date} onChangeText={v => setInvoiceForm({ ...invoiceForm, invoice_date: v })} placeholder="YYYY-MM-DD" />
            <FormField label="Due Date *" value={invoiceForm.due_date} onChangeText={v => setInvoiceForm({ ...invoiceForm, due_date: v })} placeholder="YYYY-MM-DD" />
            <FormField label="Total Amount (RWF) *" value={invoiceForm.total_amount} onChangeText={v => setInvoiceForm({ ...invoiceForm, total_amount: v })} placeholder="0" keyboardType="numeric" />
            <FormField label="Tax Amount (RWF)" value={invoiceForm.tax_amount} onChangeText={v => setInvoiceForm({ ...invoiceForm, tax_amount: v })} placeholder="0" keyboardType="numeric" />
            <FormField label="Description" value={invoiceForm.description} onChangeText={v => setInvoiceForm({ ...invoiceForm, description: v })} placeholder="Invoice description" multiline />
          </ScrollView>
          <View style={s.modalFooter}>
            <Pressable style={s.cancelBtn} onPress={() => setShowInvoiceModal(false)}><Text style={s.cancelBtnLabel}>Cancel</Text></Pressable>
            <Pressable style={s.saveBtn} onPress={handleCreateInvoice} disabled={invoiceSaving}>
              {invoiceSaving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.saveBtnLabel}>Create Invoice</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function PayModal({ ctx }) {
  const {
    showPayModal, setShowPayModal,
    payInvoice, payForm, setPayForm, paySaving, handlePayInvoice,
  } = ctx;

  return (
    <Modal visible={showPayModal} transparent animationType="fade" onRequestClose={() => setShowPayModal(false)}>
      <View style={s.modalOverlay}>
        <View style={[s.modalCard, { maxWidth: 440 }]}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Record Payment</Text>
            <Pressable onPress={() => setShowPayModal(false)}><MaterialCommunityIcons name="close" size={22} color={colors.white} /></Pressable>
          </View>
          <View style={{ padding: spacing.lg }}>
            {payInvoice && <Text style={{ color: colors.blue300, marginBottom: spacing.md }}>Invoice: {payInvoice.invoice_number} — Outstanding: {formatRWF(payInvoice.outstanding)}</Text>}
            <FormField label="Amount (RWF) *" value={payForm.amount} onChangeText={v => setPayForm({ ...payForm, amount: v })} placeholder="0" keyboardType="numeric" />
            <FormField label="Payment Date *" value={payForm.payment_date} onChangeText={v => setPayForm({ ...payForm, payment_date: v })} placeholder="YYYY-MM-DD" />
            <DropdownField label="Payment Method" value={payForm.payment_method} options={PAYMENT_METHODS} onChange={v => setPayForm({ ...payForm, payment_method: v })} />
            <FormField label="Reference" value={payForm.reference} onChangeText={v => setPayForm({ ...payForm, reference: v })} placeholder="Receipt or reference #" />
          </View>
          <View style={s.modalFooter}>
            <Pressable style={s.cancelBtn} onPress={() => setShowPayModal(false)}><Text style={s.cancelBtnLabel}>Cancel</Text></Pressable>
            <Pressable style={s.saveBtn} onPress={handlePayInvoice} disabled={paySaving}>
              {paySaving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.saveBtnLabel}>Record Payment</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
