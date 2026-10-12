/**
 * FinanceImportExport.js — Kuzana no kohereza (Import & Export section).
 *
 * XLSX/CSV import: paste or upload spreadsheet data to bulk-create transactions.
 * Export: download transactions and reports as CSV. Print: open a print-friendly
 * view of any report or transaction list in the browser's print dialog.
 */
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Platform, ActivityIndicator, ScrollView } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, spacing } from '../../../theme';
import { apiFetch } from '../../../services/apiClient';
import {
  FIN, REPORT_TYPES, formatRWF, fmtDate, alertMsg,
  SectionHeader, Chip, EmptyState, FormField, s,
} from './FinanceShared';

export default function FinanceImportExport({ ctx }) {
  const { transactions, handleExportCSV, handleExportTransactions, customFrom, customTo, summary } = ctx;
  const [tab, setTab] = useState('import');
  const [csvText, setCsvText] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [autoPost, setAutoPost] = useState(false);

  function parseCSVRows(text) {
    const lines = text.trim().split('\n').filter(l => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    return lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim());
      const row = {};
      headers.forEach((h, i) => { row[h] = vals[i] || ''; });
      return {
        type: row.type || row.txn_type || 'expense',
        date: row.date || row.txn_date || new Date().toISOString().slice(0, 10),
        description: row.description || row.desc || '',
        amount: row.amount || '0',
        payment_method: row.payment_method || row.method || null,
        reference: row.reference || row.ref || null,
        auto_post: autoPost,
      };
    });
  }

  async function handleImport() {
    const rows = parseCSVRows(csvText);
    if (!rows.length) return alertMsg('Error', 'No valid rows found. Use CSV format: type,date,description,amount,payment_method,reference');
    setImporting(true);
    try {
      const result = await apiFetch('/finance/import/transactions', { method: 'POST', body: { rows } });
      setImportResult(result);
      alertMsg('Success', `Imported ${result.imported} transactions`);
      setCsvText('');
    } catch (e) { alertMsg('Error', e.message); }
    setImporting(false);
  }

  function handlePrint(title, content) {
    if (Platform.OS !== 'web') return alertMsg('Print', 'Printing is only available on web');
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
      <style>
        body{font-family:system-ui,sans-serif;padding:40px;color:#1a1a1a;max-width:900px;margin:0 auto}
        h1{font-size:22px;margin-bottom:4px}
        .sub{color:#666;margin-bottom:20px;font-size:13px}
        table{width:100%;border-collapse:collapse;margin-top:16px}
        th,td{text-align:left;padding:8px 12px;border-bottom:1px solid #e0e0e0;font-size:13px}
        th{background:#f5f5f5;font-weight:600}
        .right{text-align:right}
        .total{font-weight:700;border-top:2px solid #333}
        @media print{body{padding:20px}button{display:none}}
      </style></head><body>
      <h1>${title}</h1>
      <p class="sub">allinkigali Finance · Printed ${new Date().toLocaleDateString()}</p>
      ${content}
      <script>window.print();</script>
    </body></html>`);
    printWindow.document.close();
  }

  function printTransactions() {
    const rows = (transactions || []).slice(0, 200);
    if (!rows.length) return alertMsg('Print', 'No transactions to print');
    const tableRows = rows.map(t =>
      `<tr><td>${t.txn_ref}</td><td>${fmtDate(t.txn_date)}</td><td>${t.txn_type}</td><td>${t.description}</td><td class="right">${formatRWF(t.amount)}</td><td>${t.status}</td></tr>`
    ).join('');
    const total = rows.reduce((s, t) => s + Number(t.amount || 0), 0);
    handlePrint('Transaction Report', `
      <table><thead><tr><th>Ref</th><th>Date</th><th>Type</th><th>Description</th><th class="right">Amount</th><th>Status</th></tr></thead>
      <tbody>${tableRows}<tr class="total"><td colspan="4">Total (${rows.length} transactions)</td><td class="right">${formatRWF(total)}</td><td></td></tr></tbody></table>
    `);
  }

  function printSummary() {
    if (!summary) return alertMsg('Print', 'Load the dashboard first');
    handlePrint('Financial Summary', `
      <table><tbody>
        <tr><td>Total Income</td><td class="right">${formatRWF(summary.income)}</td></tr>
        <tr><td>Total Expenses</td><td class="right">${formatRWF(summary.expenses)}</td></tr>
        <tr class="total"><td>Net Income</td><td class="right">${formatRWF(summary.net)}</td></tr>
        <tr><td>Cash & Bank</td><td class="right">${formatRWF(summary.cashBank)}</td></tr>
        <tr><td>Receivables</td><td class="right">${formatRWF(summary.receivables)}</td></tr>
        <tr><td>Payables</td><td class="right">${formatRWF(summary.payables)}</td></tr>
      </tbody></table>
    `);
  }

  return (
    <>
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg }}>
        <Chip label="Import" active={tab === 'import'} onPress={() => setTab('import')} />
        <Chip label="Export" active={tab === 'export'} onPress={() => setTab('export')} />
        <Chip label="Print" active={tab === 'print'} onPress={() => setTab('print')} />
      </View>

      {tab === 'import' && (
        <>
          <SectionHeader title="Import Transactions" icon="file-upload-outline" />
          <View style={s.panel}>
            <Text style={[s.panelTitle, { marginBottom: spacing.sm }]}>Paste CSV Data</Text>
            <Text style={[s.txMeta, { marginBottom: spacing.md }]}>
              Format: type,date,description,amount,payment_method,reference{'\n'}
              Types: income, expense, transfer
            </Text>
            <TextInput
              style={[s.inputBox, { minHeight: 120, color: '#fff', fontFamily: Platform.OS === 'web' ? 'monospace' : undefined }]}
              multiline value={csvText} onChangeText={setCsvText}
              placeholder={'type,date,description,amount,payment_method,reference\nincome,2026-01-15,Client payment,500000,bank_transfer,INV-001\nexpense,2026-01-16,Office supplies,25000,cash,'}
              placeholderTextColor="rgba(255,255,255,0.3)"
            />
            <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md, alignItems: 'center' }}>
              <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }} onPress={() => setAutoPost(!autoPost)}>
                <MaterialCommunityIcons name={autoPost ? 'checkbox-marked' : 'checkbox-blank-outline'} size={20} color={autoPost ? FIN.income : colors.textMuted} />
                <Text style={{ color: colors.white, fontSize: 13 }}>Auto-post transactions</Text>
              </Pressable>
              <Pressable style={s.saveBtn} onPress={handleImport} disabled={importing}>
                {importing ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.saveBtnLabel}>Import</Text>}
              </Pressable>
            </View>
          </View>
          {importResult && (
            <View style={[s.panel, { marginTop: spacing.lg }]}>
              <Text style={s.panelTitle}>Import Result</Text>
              <Text style={[s.txDesc, { color: FIN.income }]}>Successfully imported {importResult.imported} transactions</Text>
              {(importResult.transactions || []).slice(0, 10).map(t => (
                <View key={t.id} style={s.txRow}>
                  <Text style={[s.txMeta, { flex: 1 }]}>{t.txn_ref} — {t.description} — {formatRWF(t.amount)}</Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}

      {tab === 'export' && (
        <>
          <SectionHeader title="Export Data" icon="file-download-outline" />
          <View style={s.panel}>
            <Text style={s.panelTitle}>Download as CSV</Text>
            <View style={{ gap: spacing.md, marginTop: spacing.md }}>
              <Pressable style={[s.filterBtn, { paddingVertical: spacing.sm, paddingHorizontal: spacing.md }]} onPress={handleExportTransactions}>
                <MaterialCommunityIcons name="table-arrow-down" size={18} color={colors.blue300} />
                <Text style={[s.filterBtnLabel, { fontSize: 14 }]}>Export All Transactions (CSV)</Text>
              </Pressable>
              {REPORT_TYPES.map(r => (
                <Pressable key={r.key} style={[s.filterBtn, { paddingVertical: spacing.sm, paddingHorizontal: spacing.md }]}
                  onPress={() => handleExportCSV(r.key)}>
                  <MaterialCommunityIcons name="file-chart-outline" size={18} color={colors.blue300} />
                  <Text style={[s.filterBtnLabel, { fontSize: 14 }]}>Export {r.label} (CSV)</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </>
      )}

      {tab === 'print' && (
        <>
          <SectionHeader title="Print Reports" icon="printer" />
          <View style={s.panel}>
            <Text style={s.panelTitle}>Print-Friendly Views</Text>
            <Text style={[s.txMeta, { marginBottom: spacing.md }]}>
              Opens a clean, printable page in a new window.
              {Platform.OS !== 'web' ? ' (Available on web only)' : ''}
            </Text>
            <View style={{ gap: spacing.md }}>
              <Pressable style={[s.filterBtn, { paddingVertical: spacing.sm, paddingHorizontal: spacing.md }]} onPress={printSummary}>
                <MaterialCommunityIcons name="chart-box-outline" size={18} color={colors.blue300} />
                <Text style={[s.filterBtnLabel, { fontSize: 14 }]}>Print Financial Summary</Text>
              </Pressable>
              <Pressable style={[s.filterBtn, { paddingVertical: spacing.sm, paddingHorizontal: spacing.md }]} onPress={printTransactions}>
                <MaterialCommunityIcons name="format-list-bulleted" size={18} color={colors.blue300} />
                <Text style={[s.filterBtnLabel, { fontSize: 14 }]}>Print Transaction List</Text>
              </Pressable>
            </View>
          </View>
        </>
      )}
    </>
  );
}
