/**
 * FinanceDocuments.js — Inyandiko zifatanye n'imari (Document attachments).
 *
 * Upload, list, and delete file attachments (receipts, invoices, contracts)
 * linked to transactions, invoices, or projects. Files are stored as URLs
 * (e.g. from a cloud storage provider) with metadata in fin_documents.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Platform, Linking } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, spacing } from '../../../theme';
import { apiFetch } from '../../../services/apiClient';
import {
  FIN, fmtDate, alertMsg,
  SectionHeader, EmptyState, FormField, DropdownField, s,
} from './FinanceShared';

export default function FinanceDocuments({ ctx }) {
  const { transactions, invoices, projects } = ctx;
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterId, setFilterId] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [form, setForm] = useState({ file_name: '', file_url: '', file_type: '', description: '', transaction_id: '', invoice_id: '', project_id: '' });
  const [saving, setSaving] = useState(false);

  async function fetchDocs() {
    setLoading(true);
    try {
      let qs = '';
      if (filterType === 'transaction' && filterId) qs = `?transaction_id=${filterId}`;
      else if (filterType === 'invoice' && filterId) qs = `?invoice_id=${filterId}`;
      else if (filterType === 'project' && filterId) qs = `?project_id=${filterId}`;
      const data = await apiFetch(`/finance/documents${qs}`);
      setDocs(Array.isArray(data) ? data : []);
    } catch { setDocs([]); }
    setLoading(false);
  }

  useEffect(() => { fetchDocs(); }, [filterType, filterId]);

  async function handleUpload() {
    if (!form.file_name || !form.file_url) return alertMsg('Error', 'File name and URL are required');
    setSaving(true);
    try {
      await apiFetch('/finance/documents', {
        method: 'POST',
        body: {
          file_name: form.file_name,
          file_url: form.file_url,
          file_type: form.file_type || null,
          description: form.description || null,
          transaction_id: form.transaction_id || null,
          invoice_id: form.invoice_id || null,
          project_id: form.project_id || null,
        },
      });
      alertMsg('Success', 'Document attached');
      setForm({ file_name: '', file_url: '', file_type: '', description: '', transaction_id: '', invoice_id: '', project_id: '' });
      setShowUpload(false);
      fetchDocs();
    } catch (e) { alertMsg('Error', e.message); }
    setSaving(false);
  }

  async function handleDelete(id, name) {
    if (Platform.OS === 'web') { if (!window.confirm(`Delete "${name}"?`)) return; }
    try {
      await apiFetch(`/finance/documents/${id}`, { method: 'DELETE' });
      alertMsg('Deleted', 'Document removed');
      fetchDocs();
    } catch (e) { alertMsg('Error', e.message); }
  }

  function openFile(url) {
    if (Platform.OS === 'web') window.open(url, '_blank');
    else Linking.openURL(url);
  }

  const FILE_ICONS = { pdf: 'file-pdf-box', xlsx: 'file-excel-box', xls: 'file-excel-box', csv: 'file-table-box', doc: 'file-word-box', docx: 'file-word-box', png: 'file-image', jpg: 'file-image', jpeg: 'file-image' };
  function fileIcon(name) {
    const ext = (name || '').split('.').pop().toLowerCase();
    return FILE_ICONS[ext] || 'file-document-outline';
  }

  const txnOptions = (transactions || []).slice(0, 50).map(t => ({ value: String(t.id), label: `${t.txn_ref} — ${t.description}` }));
  const invOptions = (invoices || []).slice(0, 50).map(i => ({ value: String(i.id), label: i.invoice_number }));
  const projOptions = (projects || []).map(p => ({ value: String(p.id), label: `${p.code} — ${p.name}` }));

  return (
    <>
      <SectionHeader title="Document Attachments" icon="paperclip">
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Pressable style={s.filterBtn} onPress={() => setShowUpload(!showUpload)}>
            <MaterialCommunityIcons name={showUpload ? 'close' : 'plus'} size={16} color={colors.blue300} />
            <Text style={s.filterBtnLabel}>{showUpload ? 'Cancel' : 'Attach File'}</Text>
          </Pressable>
        </View>
      </SectionHeader>

      {showUpload && (
        <View style={[s.panel, { marginBottom: spacing.lg }]}>
          <Text style={s.panelTitle}>Attach a Document</Text>
          <FormField label="File Name *" value={form.file_name} onChangeText={v => setForm({ ...form, file_name: v })} placeholder="e.g. receipt-jan-2026.pdf" />
          <FormField label="File URL *" value={form.file_url} onChangeText={v => setForm({ ...form, file_url: v })} placeholder="https://..." />
          <FormField label="File Type" value={form.file_type} onChangeText={v => setForm({ ...form, file_type: v })} placeholder="e.g. application/pdf" />
          <FormField label="Description" value={form.description} onChangeText={v => setForm({ ...form, description: v })} placeholder="What is this document?" />
          {txnOptions.length > 0 && <DropdownField label="Link to Transaction" value={form.transaction_id} options={txnOptions} onChange={v => setForm({ ...form, transaction_id: v })} />}
          {invOptions.length > 0 && <DropdownField label="Link to Invoice" value={form.invoice_id} options={invOptions} onChange={v => setForm({ ...form, invoice_id: v })} />}
          {projOptions.length > 0 && <DropdownField label="Link to Project" value={form.project_id} options={projOptions} onChange={v => setForm({ ...form, project_id: v })} />}
          <Pressable style={[s.saveBtn, { marginTop: spacing.md, alignSelf: 'flex-start' }]} onPress={handleUpload} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.saveBtnLabel}>Upload</Text>}
          </Pressable>
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg, flexWrap: 'wrap' }}>
        {['all', 'transaction', 'invoice', 'project'].map(f => (
          <Pressable key={f} style={[s.filterBtn, filterType === f && { backgroundColor: FIN.primaryBg }]} onPress={() => { setFilterType(f); setFilterId(''); }}>
            <Text style={[s.filterBtnLabel, filterType === f && { color: FIN.primary }]}>{f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}</Text>
          </Pressable>
        ))}
      </View>

      {loading ? <ActivityIndicator color={FIN.primary} size="large" style={{ marginTop: 30 }} /> : docs.length === 0 ? (
        <EmptyState icon="paperclip" text="No documents attached yet" sub="Attach receipts, contracts, or invoices" />
      ) : (
        <View style={s.panel}>
          {docs.map(d => (
            <View key={d.id} style={[s.txRow, { alignItems: 'center' }]}>
              <MaterialCommunityIcons name={fileIcon(d.file_name)} size={28} color={FIN.primary} style={{ marginRight: spacing.sm }} />
              <View style={{ flex: 1 }}>
                <Text style={s.txDesc}>{d.file_name}</Text>
                <Text style={s.txMeta}>
                  {d.description ? `${d.description} · ` : ''}{fmtDate(d.created_at)}
                  {d.uploader_name ? ` · ${d.uploader_name}` : ''}
                  {d.transaction_id ? ' · Txn' : ''}{d.invoice_id ? ' · Invoice' : ''}{d.project_id ? ' · Project' : ''}
                </Text>
              </View>
              <Pressable style={[s.filterBtn, { marginRight: spacing.sm }]} onPress={() => openFile(d.file_url)}>
                <MaterialCommunityIcons name="open-in-new" size={14} color={colors.blue300} />
              </Pressable>
              <Pressable style={s.filterBtn} onPress={() => handleDelete(d.id, d.file_name)}>
                <MaterialCommunityIcons name="delete-outline" size={14} color={FIN.expense} />
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </>
  );
}
