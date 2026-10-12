/**
 * FinanceSettings.js — Igenamiterere ry'imari (Finance settings section).
 *
 * Organization profile, chart of accounts, projects & funds, accounting
 * periods (lock/unlock), and audit trail. Includes AccountModal for adding
 * new GL accounts and ProjectModal for creating fund-tracked projects.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, Pressable, Modal, ActivityIndicator, Platform,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, spacing } from '../../../theme';
import { apiFetch } from '../../../services/apiClient';
import {
  FIN, formatRWF, fmtDate, alertMsg,
  SectionHeader, StatusBadge, EmptyState, SettingRow,
  FormField, DropdownField, s,
} from './FinanceShared';

export function SettingsSection({ ctx }) {
  const {
    settingsView, setSettingsView,
    accounts, departments,
    orgProfile, setOrgProfile, orgSaving, handleSaveOrg, fetchOrgProfile,
    setShowAccountModal, setShowProjectModal,
    projects, fetchProjects,
    periods, periodsLoading, fetchPeriods, handleLockPeriod, handleUnlockPeriod,
  } = ctx;

  if (settingsView === 'org') {
    useEffect(() => { fetchOrgProfile(); }, []);
    return (
      <>
        <Pressable style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }} onPress={() => setSettingsView('menu')}>
          <MaterialCommunityIcons name="arrow-left" size={18} color={colors.blue300} />
          <Text style={{ color: colors.blue300, marginLeft: spacing.sm, fontSize: 14 }}>Back to Settings</Text>
        </Pressable>
        <View style={s.panel}>
          <SectionHeader title="Organization Profile" />
          {orgProfile ? (
            <>
              <FormField label="Legal Name" value={orgProfile.legal_name || ''} onChangeText={v => setOrgProfile({ ...orgProfile, legal_name: v })} />
              <FormField label="Display Name" value={orgProfile.display_name || ''} onChangeText={v => setOrgProfile({ ...orgProfile, display_name: v })} />
              <FormField label="Address" value={orgProfile.address || ''} onChangeText={v => setOrgProfile({ ...orgProfile, address: v })} multiline />
              <FormField label="Phone" value={orgProfile.phone || ''} onChangeText={v => setOrgProfile({ ...orgProfile, phone: v })} />
              <FormField label="Email" value={orgProfile.email || ''} onChangeText={v => setOrgProfile({ ...orgProfile, email: v })} />
              <FormField label="Primary Currency" value={orgProfile.primary_currency || 'RWF'} onChangeText={v => setOrgProfile({ ...orgProfile, primary_currency: v })} />
              <FormField label="Fiscal Year Start Month (1-12)" value={String(orgProfile.fiscal_year_start_month || 1)} onChangeText={v => setOrgProfile({ ...orgProfile, fiscal_year_start_month: parseInt(v) || 1 })} keyboardType="numeric" />
              <Pressable style={[s.saveBtn, { marginTop: spacing.md, alignSelf: 'flex-start' }]} onPress={handleSaveOrg} disabled={orgSaving}>
                {orgSaving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.saveBtnLabel}>Save Changes</Text>}
              </Pressable>
            </>
          ) : <ActivityIndicator color={FIN.primary} />}
        </View>
      </>
    );
  }

  if (settingsView === 'accounts') {
    const grouped = { asset: [], liability: [], equity: [], income: [], expense: [] };
    accounts.forEach(a => { if (grouped[a.account_type]) grouped[a.account_type].push(a); });
    return (
      <>
        <Pressable style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }} onPress={() => setSettingsView('menu')}>
          <MaterialCommunityIcons name="arrow-left" size={18} color={colors.blue300} />
          <Text style={{ color: colors.blue300, marginLeft: spacing.sm, fontSize: 14 }}>Back to Settings</Text>
        </Pressable>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md }}>
          <Text style={s.sectionTitle}>Chart of Accounts</Text>
          <Pressable style={s.addBtn} onPress={() => setShowAccountModal(true)}>
            <MaterialCommunityIcons name="plus" size={16} color="#fff" />
            <Text style={s.addBtnLabel}>Add Account</Text>
          </Pressable>
        </View>
        {['asset', 'liability', 'equity', 'income', 'expense'].map(type => (
          <View key={type} style={[s.panel, { marginBottom: spacing.md }]}>
            <Text style={[s.panelTitle, { textTransform: 'capitalize' }]}>{type}s ({grouped[type].length})</Text>
            {grouped[type].map(a => (
              <View key={a.id} style={s.txRow}>
                <Text style={[s.td, { width: 60, fontWeight: '600' }]}>{a.code}</Text>
                <Text style={[s.td, { flex: 1, color: colors.white }]}>{a.name}</Text>
                <Text style={[s.td, { width: 50 }]}>{a.normal_balance}</Text>
              </View>
            ))}
          </View>
        ))}
      </>
    );
  }

  if (settingsView === 'projects') {
    useEffect(() => { fetchProjects(); }, []);
    return (
      <>
        <Pressable style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }} onPress={() => setSettingsView('menu')}>
          <MaterialCommunityIcons name="arrow-left" size={18} color={colors.blue300} />
          <Text style={{ color: colors.blue300, marginLeft: spacing.sm, fontSize: 14 }}>Back to Settings</Text>
        </Pressable>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md }}>
          <Text style={s.sectionTitle}>Projects & Funds</Text>
          <Pressable style={s.addBtn} onPress={() => setShowProjectModal(true)}>
            <MaterialCommunityIcons name="plus" size={16} color="#fff" />
            <Text style={s.addBtnLabel}>New Project</Text>
          </Pressable>
        </View>
        <View style={s.panel}>
          {projects.length === 0 ? (
            <EmptyState icon="folder-outline" text="No projects yet" sub="Create a project to track fund-specific spending" />
          ) : projects.map(p => (
            <View key={p.id} style={s.txRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.txDesc}>{p.code} — {p.name}</Text>
                <Text style={s.txMeta}>{p.status} · {p.donor_name ? `Donor: ${p.donor_name}` : 'No donor'}{p.approved_amount ? ` · Budget: ${formatRWF(p.approved_amount)}` : ''}</Text>
              </View>
              <StatusBadge status={p.status} />
            </View>
          ))}
        </View>
      </>
    );
  }

  if (settingsView === 'periods') {
    useEffect(() => { fetchPeriods(); }, []);
    return (
      <>
        <Pressable style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }} onPress={() => setSettingsView('menu')}>
          <MaterialCommunityIcons name="arrow-left" size={18} color={colors.blue300} />
          <Text style={{ color: colors.blue300, marginLeft: spacing.sm, fontSize: 14 }}>Back to Settings</Text>
        </Pressable>
        <View style={s.panel}>
          <SectionHeader title="Accounting Periods" />
          {periodsLoading ? <ActivityIndicator color={FIN.primary} /> : periods.length === 0 ? (
            <EmptyState icon="calendar-range" text="No periods defined" />
          ) : periods.map(p => (
            <View key={p.id} style={[s.txRow, { justifyContent: 'space-between' }]}>
              <View style={{ flex: 1 }}>
                <Text style={s.txDesc}>{p.name}</Text>
                <Text style={s.txMeta}>{fmtDate(p.period_start)} — {fmtDate(p.period_end)}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <StatusBadge status={p.status} />
                {p.status === 'open' ? (
                  <Pressable style={s.filterBtn} onPress={() => handleLockPeriod(p.id)}>
                    <MaterialCommunityIcons name="lock" size={14} color={FIN.warning} />
                    <Text style={[s.filterBtnLabel, { color: FIN.warning }]}>Lock</Text>
                  </Pressable>
                ) : (
                  <Pressable style={s.filterBtn} onPress={() => handleUnlockPeriod(p.id)}>
                    <MaterialCommunityIcons name="lock-open" size={14} color={FIN.income} />
                    <Text style={[s.filterBtnLabel, { color: FIN.income }]}>Unlock</Text>
                  </Pressable>
                )}
              </View>
            </View>
          ))}
        </View>
      </>
    );
  }

  if (settingsView === 'audit') {
    const [auditLog, setAuditLog] = useState([]);
    const [auditLoading, setAuditLoading] = useState(true);
    useEffect(() => {
      (async () => {
        setAuditLoading(true);
        try { const d = await apiFetch('/finance/audit-log?limit=50'); setAuditLog(Array.isArray(d) ? d : []); } catch { setAuditLog([]); }
        setAuditLoading(false);
      })();
    }, []);
    return (
      <>
        <Pressable style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }} onPress={() => setSettingsView('menu')}>
          <MaterialCommunityIcons name="arrow-left" size={18} color={colors.blue300} />
          <Text style={{ color: colors.blue300, marginLeft: spacing.sm, fontSize: 14 }}>Back to Settings</Text>
        </Pressable>
        <View style={s.panel}>
          <SectionHeader title="Audit Trail" />
          {auditLoading ? <ActivityIndicator color={FIN.primary} /> : auditLog.length === 0 ? (
            <EmptyState icon="shield-search" text="No audit entries" />
          ) : auditLog.map(a => (
            <View key={a.id} style={s.txRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.txDesc}>{a.action} — {a.entity_type} #{a.entity_id}</Text>
                <Text style={s.txMeta}>{fmtDate(a.created_at)}{a.user_name ? ` · ${a.user_name}` : ''}</Text>
              </View>
            </View>
          ))}
        </View>
      </>
    );
  }

  if (settingsView === 'thresholds') {
    const [thresholds, setThresholds] = useState([]);
    const [thLoading, setThLoading] = useState(true);
    const [thForm, setThForm] = useState({ txn_type: 'all', min_amount: '', max_amount: '', required_role: 'finance', description: '' });
    const [thSaving, setThSaving] = useState(false);
    const [showThForm, setShowThForm] = useState(false);

    useEffect(() => {
      (async () => {
        setThLoading(true);
        try { const d = await apiFetch('/finance/approval-thresholds'); setThresholds(Array.isArray(d) ? d : []); } catch { setThresholds([]); }
        setThLoading(false);
      })();
    }, []);

    const handleCreateThreshold = async () => {
      if (!thForm.min_amount) return alertMsg('Error', 'Minimum amount is required');
      setThSaving(true);
      try {
        const created = await apiFetch('/finance/approval-thresholds', { method: 'POST', body: { ...thForm, min_amount: parseFloat(thForm.min_amount), max_amount: thForm.max_amount ? parseFloat(thForm.max_amount) : null } });
        setThresholds(prev => [...prev, created]);
        setThForm({ txn_type: 'all', min_amount: '', max_amount: '', required_role: 'finance', description: '' });
        setShowThForm(false);
        alertMsg('Success', 'Threshold created');
      } catch (e) { alertMsg('Error', e.message); }
      setThSaving(false);
    };

    const handleDeleteThreshold = async (id) => {
      if (Platform.OS === 'web' && !window.confirm('Delete this threshold?')) return;
      try {
        await apiFetch(`/finance/approval-thresholds/${id}`, { method: 'DELETE' });
        setThresholds(prev => prev.filter(t => t.id !== id));
      } catch (e) { alertMsg('Error', e.message); }
    };

    const handleToggleThreshold = async (th) => {
      try {
        const updated = await apiFetch(`/finance/approval-thresholds/${th.id}`, { method: 'PUT', body: { is_active: !th.is_active } });
        setThresholds(prev => prev.map(t => t.id === th.id ? updated : t));
      } catch (e) { alertMsg('Error', e.message); }
    };

    return (
      <>
        <Pressable style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }} onPress={() => setSettingsView('menu')}>
          <MaterialCommunityIcons name="arrow-left" size={18} color={colors.blue300} />
          <Text style={{ color: colors.blue300, marginLeft: spacing.sm, fontSize: 14 }}>Back to Settings</Text>
        </Pressable>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md }}>
          <Text style={s.sectionTitle}>Approval Thresholds</Text>
          <Pressable style={s.addBtn} onPress={() => setShowThForm(!showThForm)}>
            <MaterialCommunityIcons name={showThForm ? 'close' : 'plus'} size={16} color="#fff" />
            <Text style={s.addBtnLabel}>{showThForm ? 'Cancel' : 'Add Rule'}</Text>
          </Pressable>
        </View>
        <Text style={[s.txMeta, { marginBottom: spacing.lg }]}>
          Transactions exceeding these amounts will be sent for approval instead of being posted directly.
        </Text>

        {showThForm && (
          <View style={[s.panel, { marginBottom: spacing.lg }]}>
            <DropdownField label="Transaction Type" value={thForm.txn_type} options={[{ value: 'all', label: 'All Types' }, { value: 'income', label: 'Income' }, { value: 'expense', label: 'Expense' }, { value: 'transfer', label: 'Transfer' }]} onChange={v => setThForm({ ...thForm, txn_type: v })} />
            <FormField label="Minimum Amount (RWF) *" value={thForm.min_amount} onChangeText={v => setThForm({ ...thForm, min_amount: v })} placeholder="e.g. 500000" keyboardType="numeric" />
            <FormField label="Maximum Amount (RWF)" value={thForm.max_amount} onChangeText={v => setThForm({ ...thForm, max_amount: v })} placeholder="No limit if empty" keyboardType="numeric" />
            <DropdownField label="Required Role" value={thForm.required_role} options={[{ value: 'finance', label: 'Finance' }, { value: 'director', label: 'Director' }]} onChange={v => setThForm({ ...thForm, required_role: v })} />
            <FormField label="Description" value={thForm.description} onChangeText={v => setThForm({ ...thForm, description: v })} placeholder="Why this rule exists" />
            <Pressable style={[s.saveBtn, { marginTop: spacing.md, alignSelf: 'flex-start' }]} onPress={handleCreateThreshold} disabled={thSaving}>
              {thSaving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.saveBtnLabel}>Create Rule</Text>}
            </Pressable>
          </View>
        )}

        {thLoading ? <ActivityIndicator color={FIN.primary} /> : (
          <View style={s.panel}>
            {thresholds.length === 0 ? (
              <EmptyState icon="shield-check-outline" text="No approval thresholds set" sub="All transactions can be posted directly" />
            ) : thresholds.map(th => (
              <View key={th.id} style={[s.txRow, { alignItems: 'center', opacity: th.is_active ? 1 : 0.5 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={s.txDesc}>
                    {th.txn_type === 'all' ? 'All types' : th.txn_type} · {formatRWF(th.min_amount)}{th.max_amount ? ` – ${formatRWF(th.max_amount)}` : '+'}
                  </Text>
                  <Text style={s.txMeta}>
                    Requires: {th.required_role}{th.description ? ` · ${th.description}` : ''}
                  </Text>
                </View>
                <Pressable style={[s.filterBtn, { marginRight: spacing.sm }]} onPress={() => handleToggleThreshold(th)}>
                  <MaterialCommunityIcons name={th.is_active ? 'toggle-switch' : 'toggle-switch-off'} size={20} color={th.is_active ? FIN.income : colors.textMuted} />
                </Pressable>
                <Pressable style={s.filterBtn} onPress={() => handleDeleteThreshold(th.id)}>
                  <MaterialCommunityIcons name="delete-outline" size={16} color={FIN.expense} />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </>
    );
  }

  return (
    <View style={s.panel}>
      <SettingRow icon="office-building" title="Organization Profile" desc="Legal name, address, logo, report header" onPress={() => setSettingsView('org')} />
      <SettingRow icon="file-tree" title="Chart of Accounts" desc="Account codes, types, parent accounts" onPress={() => setSettingsView('accounts')} />
      <SettingRow icon="folder-outline" title="Projects & Funds" desc="Track fund-specific spending and donor budgets" onPress={() => setSettingsView('projects')} />
      <SettingRow icon="shield-check" title="Approval Thresholds" desc="Amount-based rules that require approval before posting" onPress={() => setSettingsView('thresholds')} />
      <SettingRow icon="shield-search" title="Audit Trail" desc="View all recorded financial actions" onPress={() => setSettingsView('audit')} />
      <SettingRow icon="calendar-range" title="Financial Year & Periods" desc="Fiscal year start, accounting periods, lock/unlock" onPress={() => setSettingsView('periods')} />
      <SettingRow icon="currency-usd" title="Currency Settings" desc="Primary currency (RWF)" />
      <SettingRow icon="counter" title="Transaction Numbering" desc="Reference sequences: INC, EXP, TRF, JNL" />
    </View>
  );
}

export function AccountModal({ ctx }) {
  const {
    showAccountModal, setShowAccountModal,
    accountForm, setAccountForm, accountSaving, handleCreateAccount,
  } = ctx;

  return (
    <Modal visible={showAccountModal} transparent animationType="fade" onRequestClose={() => setShowAccountModal(false)}>
      <View style={s.modalOverlay}>
        <View style={[s.modalCard, { maxWidth: 440 }]}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Add Account</Text>
            <Pressable onPress={() => setShowAccountModal(false)}><MaterialCommunityIcons name="close" size={22} color={colors.white} /></Pressable>
          </View>
          <View style={{ padding: spacing.lg }}>
            <FormField label="Account Code *" value={accountForm.code} onChangeText={v => setAccountForm({ ...accountForm, code: v })} placeholder="e.g. 5250" />
            <FormField label="Account Name *" value={accountForm.name} onChangeText={v => setAccountForm({ ...accountForm, name: v })} placeholder="e.g. Cloud Services" />
            <DropdownField label="Type" value={accountForm.account_type} options={[{ value: 'asset', label: 'Asset' }, { value: 'liability', label: 'Liability' }, { value: 'equity', label: 'Equity' }, { value: 'income', label: 'Income' }, { value: 'expense', label: 'Expense' }]} onChange={v => setAccountForm({ ...accountForm, account_type: v })} />
            <FormField label="Description" value={accountForm.description} onChangeText={v => setAccountForm({ ...accountForm, description: v })} placeholder="Optional" />
          </View>
          <View style={s.modalFooter}>
            <Pressable style={s.cancelBtn} onPress={() => setShowAccountModal(false)}><Text style={s.cancelBtnLabel}>Cancel</Text></Pressable>
            <Pressable style={s.saveBtn} onPress={handleCreateAccount} disabled={accountSaving}>
              {accountSaving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.saveBtnLabel}>Create Account</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function ProjectModal({ ctx }) {
  const {
    showProjectModal, setShowProjectModal,
    projectForm, setProjectForm, projectSaving, handleCreateProject,
  } = ctx;

  return (
    <Modal visible={showProjectModal} transparent animationType="fade" onRequestClose={() => setShowProjectModal(false)}>
      <View style={s.modalOverlay}>
        <View style={s.modalCard}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>New Project / Fund</Text>
            <Pressable onPress={() => setShowProjectModal(false)}><MaterialCommunityIcons name="close" size={22} color={colors.white} /></Pressable>
          </View>
          <View style={{ padding: spacing.lg }}>
            <FormField label="Project Code *" value={projectForm.code} onChangeText={v => setProjectForm({ ...projectForm, code: v })} placeholder="e.g. PROJ-001" />
            <FormField label="Project Name *" value={projectForm.name} onChangeText={v => setProjectForm({ ...projectForm, name: v })} placeholder="Project name" />
            <FormField label="Description" value={projectForm.description} onChangeText={v => setProjectForm({ ...projectForm, description: v })} placeholder="Project description" multiline />
            <FormField label="Approved Budget (RWF)" value={projectForm.approved_amount} onChangeText={v => setProjectForm({ ...projectForm, approved_amount: v })} placeholder="0" keyboardType="numeric" />
            <FormField label="Start Date" value={projectForm.start_date} onChangeText={v => setProjectForm({ ...projectForm, start_date: v })} placeholder="YYYY-MM-DD" />
            <FormField label="End Date" value={projectForm.end_date} onChangeText={v => setProjectForm({ ...projectForm, end_date: v })} placeholder="YYYY-MM-DD" />
          </View>
          <View style={s.modalFooter}>
            <Pressable style={s.cancelBtn} onPress={() => setShowProjectModal(false)}><Text style={s.cancelBtnLabel}>Cancel</Text></Pressable>
            <Pressable style={s.saveBtn} onPress={handleCreateProject} disabled={projectSaving}>
              {projectSaving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.saveBtnLabel}>Create Project</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
