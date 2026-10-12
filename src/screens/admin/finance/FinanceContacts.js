/**
 * FinanceContacts.js — Abo dukorana (Finance contacts section).
 *
 * Directory of suppliers, customers, donors, and employees linked to
 * financial transactions. Includes ContactModal for adding or editing
 * contacts with payment terms.
 */
import React from 'react';
import { View, Text, Pressable, Modal, ActivityIndicator } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, spacing } from '../../../theme';
import {
  FIN, StatusBadge, EmptyState,
  FormField, DropdownField, s,
} from './FinanceShared';

export function ContactsSection({ ctx }) {
  const {
    contacts, setShowContactModal, setEditingContact, setContactForm,
  } = ctx;

  return (
    <>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg }}>
        <Text style={s.sectionTitle}>All Contacts</Text>
        <Pressable style={s.addBtn} onPress={() => setShowContactModal(true)}>
          <MaterialCommunityIcons name="plus" size={16} color="#fff" />
          <Text style={s.addBtnLabel}>Add Contact</Text>
        </Pressable>
      </View>
      <View style={s.panel}>
        {contacts.length === 0 ? (
          <EmptyState icon="account-group-outline" text="No contacts yet" sub="Add suppliers, customers, or donors" />
        ) : contacts.map(c => (
          <View key={c.id} style={s.txRow}>
            <View style={s.contactAvatar}>
              <Text style={s.contactInitial}>{(c.name || '?')[0].toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.txDesc}>{c.name}</Text>
              <Text style={s.txMeta}>{c.contact_type} · {c.email || c.phone || 'No contact info'}</Text>
            </View>
            <Pressable style={s.filterBtn} onPress={() => { setEditingContact({ ...c }); setContactForm({ name: c.name, contact_type: c.contact_type, email: c.email || '', phone: c.phone || '', payment_terms_days: String(c.payment_terms_days || 30) }); setShowContactModal(true); }}>
              <MaterialCommunityIcons name="pencil" size={14} color={colors.blue300} />
            </Pressable>
            <StatusBadge status={c.is_active ? 'active' : 'inactive'} />
          </View>
        ))}
      </View>
    </>
  );
}

export function ContactModal({ ctx }) {
  const {
    showContactModal, setShowContactModal,
    editingContact, setEditingContact,
    contactForm, setContactForm, contactSaving,
    handleCreateContact, handleUpdateContact,
  } = ctx;

  return (
    <Modal visible={showContactModal} transparent animationType="fade" onRequestClose={() => setShowContactModal(false)}>
      <View style={s.modalOverlay}>
        <View style={[s.modalCard, { maxWidth: 440 }]}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>{editingContact ? 'Edit Contact' : 'Add Contact'}</Text>
            <Pressable onPress={() => { setShowContactModal(false); setEditingContact(null); }}><MaterialCommunityIcons name="close" size={22} color={colors.white} /></Pressable>
          </View>
          <View style={{ padding: spacing.lg }}>
            <FormField label="Name *" value={contactForm.name} onChangeText={v => setContactForm({ ...contactForm, name: v })} placeholder="Contact name" />
            <DropdownField label="Type" value={contactForm.contact_type} options={[{ value: 'supplier', label: 'Supplier' }, { value: 'customer', label: 'Customer' }, { value: 'donor', label: 'Donor' }, { value: 'employee', label: 'Employee' }, { value: 'other', label: 'Other' }]} onChange={v => setContactForm({ ...contactForm, contact_type: v })} />
            <FormField label="Email" value={contactForm.email} onChangeText={v => setContactForm({ ...contactForm, email: v })} placeholder="email@example.com" />
            <FormField label="Phone" value={contactForm.phone} onChangeText={v => setContactForm({ ...contactForm, phone: v })} placeholder="+250..." />
            <FormField label="Payment Terms (days)" value={contactForm.payment_terms_days} onChangeText={v => setContactForm({ ...contactForm, payment_terms_days: v })} keyboardType="numeric" />
          </View>
          <View style={s.modalFooter}>
            <Pressable style={s.cancelBtn} onPress={() => setShowContactModal(false)}>
              <Text style={s.cancelBtnLabel}>Cancel</Text>
            </Pressable>
            <Pressable style={s.saveBtn} onPress={editingContact ? handleUpdateContact : handleCreateContact} disabled={contactSaving}>
              {contactSaving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.saveBtnLabel}>{editingContact ? 'Update Contact' : 'Save Contact'}</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
