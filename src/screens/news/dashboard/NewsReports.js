/**
 * NewsReports.js — Editorial reports for the News Admin Dashboard.
 *
 * Six report types: Published Summary, Drafts Backlog, Pending Approvals,
 * Breaking News Log, Sponsored / Labeled Articles, and Archive Inventory.
 * Each report can be exported as a CSV string or printed (web-only).
 */
import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, Platform } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { spacing } from '../../../theme';
import { NEWS, SectionHeader, EmptyState, ActionBtn, FilterBtn, fmtDate, s } from './NewsShared';

const REPORTS = [
  { key: 'published',  label: 'Published Summary',      icon: 'check-circle-outline',   color: NEWS.success },
  { key: 'drafts',     label: 'Drafts Backlog',          icon: 'pencil-outline',         color: NEWS.muted },
  { key: 'pending',    label: 'Pending Approvals',       icon: 'clock-outline',          color: NEWS.warning },
  { key: 'breaking',   label: 'Breaking News Log',       icon: 'lightning-bolt',         color: NEWS.danger },
  { key: 'sponsored',  label: 'Sponsored / Labeled',     icon: 'tag-outline',            color: NEWS.purple },
  { key: 'archived',   label: 'Archive Inventory',       icon: 'archive-outline',        color: NEWS.teal },
];

function buildRows(articles, key) {
  const base = {
    published: articles.filter(a => a.status === 'published' && !a.isArchived),
    drafts:    articles.filter(a => a.status === 'draft' && !a.isArchived),
    pending:   articles.filter(a => a.status === 'pending'),
    breaking:  articles.filter(a => a.isBreaking),
    sponsored: articles.filter(a => a.isSponsored || (a.labels || []).includes('sponsored')),
    archived:  articles.filter(a => a.isArchived),
  }[key] || [];
  return base;
}

function toCsv(rows) {
  const header = 'ID,Title,Category,Status,Views,Published At';
  const lines = rows.map(a =>
    [a.id, `"${(a.title || '').replace(/"/g, '""')}"`, a.category || '', a.status || '', a.views || 0, a.publishedAt || ''].join(',')
  );
  return [header, ...lines].join('\n');
}

function downloadCsv(csv, filename) {
  if (Platform.OS !== 'web') return;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function printTable(rows, label) {
  if (Platform.OS !== 'web') return;
  const html = `
    <html><head><title>${label}</title>
    <style>body{font-family:sans-serif;padding:24px}h2{margin-bottom:16px}
    table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:8px;text-align:left;font-size:13px}
    th{background:#f0f0f0}</style></head><body>
    <h2>${label}</h2>
    <table><tr><th>ID</th><th>Title</th><th>Category</th><th>Status</th><th>Views</th><th>Published At</th></tr>
    ${rows.map(a => `<tr><td>${a.id}</td><td>${a.title}</td><td>${a.category||''}</td><td>${a.status||''}</td><td>${a.views||0}</td><td>${fmtDate(a.publishedAt)}</td></tr>`).join('')}
    </table></body></html>`;
  const win = window.open('', '_blank');
  win.document.write(html); win.document.close(); win.print();
}

export default function NewsReports({ ctx }) {
  const { articles = [] } = ctx;
  const [activeReport, setActiveReport] = useState('published');

  const report = REPORTS.find(r => r.key === activeReport);
  const rows = useMemo(() => buildRows(articles, activeReport), [articles, activeReport]);

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <SectionHeader title="Editorial Reports" icon="file-chart-outline" />

      {/* Report picker */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.lg }}>
        {REPORTS.map(r => (
          <FilterBtn
            key={r.key}
            label={r.label}
            icon={r.icon}
            active={activeReport === r.key}
            onPress={() => setActiveReport(r.key)}
          />
        ))}
      </View>

      {/* Export actions */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: spacing.lg }}>
        <ActionBtn
          label="Export CSV"
          icon="download-outline"
          color={NEWS.success}
          onPress={() => downloadCsv(toCsv(rows), `${activeReport}-report.csv`)}
          disabled={rows.length === 0 || Platform.OS !== 'web'}
        />
        <ActionBtn
          label="Print"
          icon="printer-outline"
          color={NEWS.primary}
          onPress={() => printTable(rows, report?.label)}
          disabled={rows.length === 0 || Platform.OS !== 'web'}
        />
      </View>

      {/* Table */}
      <View style={[s.panel, { paddingHorizontal: spacing.md, paddingTop: spacing.sm }]}>
        <View style={{ flexDirection: 'row', paddingBottom: spacing.sm, borderBottomWidth: 2, borderColor: NEWS.border }}>
          <Text style={[s.inputLabel, { flex: 2 }]}>Title</Text>
          <Text style={[s.inputLabel, { width: 90 }]}>Category</Text>
          <Text style={[s.inputLabel, { width: 60, textAlign: 'right' }]}>Views</Text>
        </View>
        {rows.length === 0 ? (
          <EmptyState icon={report?.icon || 'file-outline'} text={`No articles in this report`} />
        ) : (
          rows.map((a, i) => (
            <View key={a.id} style={[
              { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
              i < rows.length - 1 && { borderBottomWidth: 1, borderColor: NEWS.border },
            ]}>
              <View style={{ flex: 2 }}>
                <Text style={[s.rowTitle, { fontSize: 13 }]} numberOfLines={2}>{a.title}</Text>
                <Text style={s.rowMeta}>{fmtDate(a.publishedAt)}</Text>
              </View>
              <Text style={[s.rowMeta, { width: 90 }]}>{a.category}</Text>
              <Text style={{ width: 60, textAlign: 'right', fontSize: 13, fontWeight: '700', color: NEWS.primary }}>
                {(a.views || 0).toLocaleString()}
              </Text>
            </View>
          ))
        )}
      </View>

      {rows.length > 0 && (
        <Text style={[s.rowMeta, { textAlign: 'right', marginTop: spacing.sm }]}>
          {rows.length} article{rows.length !== 1 ? 's' : ''} · Total views: {rows.reduce((sum, a) => sum + (a.views || 0), 0).toLocaleString()}
        </Text>
      )}
    </ScrollView>
  );
}
