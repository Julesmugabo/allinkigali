/**
 * Projects.jsx — projects / donor funds with an approved amount and dates.
 */
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { DataTable } from '../../../../components/PageShell';
import Modal, { ModalActions } from '../../../../components/common/Modal';
import Button from '../../../../components/common/Button';
import { FormGrid, Field, SelectField, TextAreaField } from '../../../../components/form/Fields';
import { useFinance } from '../../FinanceContext';
import { financeApi } from '../../financeApi';
import { Panel, ErrorText, StatusBadge, Money, fmtDate } from '../../components/ui';

const STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'completed', label: 'Completed' },
  { value: 'closed', label: 'Closed' },
];

function ProjectModal({ project, onClose }) {
  const { changed, notify } = useFinance();
  const d = (v) => (v ? String(v).slice(0, 10) : '');
  const [form, setForm] = useState({
    code: project?.code || '', name: project?.name || '', description: project?.description || '',
    approved_amount: project?.approved_amount != null ? String(project.approved_amount) : '',
    start_date: d(project?.start_date), end_date: d(project?.end_date), status: project?.status || 'active',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.code.trim() || !form.name.trim()) { setError('Code and name are required.'); return; }
    setSaving(true); setError('');
    try {
      const body = { ...form, approved_amount: form.approved_amount ? parseFloat(form.approved_amount) : null, start_date: form.start_date || null, end_date: form.end_date || null };
      if (project) await financeApi.updateProject(project.id, body);
      else await financeApi.createProject(body);
      notify(project ? 'Project updated' : 'Project created');
      changed();
      onClose();
    } catch (e) { setError(e.message); }
    setSaving(false);
  };

  return (
    <Modal open onClose={onClose} title={project ? `Edit ${project.code}` : 'New Project'} width={560}>
      <ErrorText>{error}</ErrorText>
      <FormGrid>
        <Field label="Code *" value={form.code} onChange={set('code')} disabled={!!project} />
        <Field label="Name *" value={form.name} onChange={set('name')} />
        <Field label="Approved amount (RWF)" type="number" min="0" value={form.approved_amount} onChange={set('approved_amount')} />
        {project && <SelectField label="Status" value={form.status} onChange={set('status')} options={STATUSES} />}
        <Field label="Start date" type="date" value={form.start_date} onChange={set('start_date')} />
        <Field label="End date" type="date" value={form.end_date} onChange={set('end_date')} />
        <TextAreaField label="Description" value={form.description} onChange={set('description')} rows={2} />
      </FormGrid>
      <ModalActions>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : project ? 'Save changes' : 'Create project'}</Button>
      </ModalActions>
    </Modal>
  );
}

export default function Projects() {
  const { projects } = useFinance();
  const [editing, setEditing] = useState(null);
  return (
    <Panel title="Projects & funds" actions={<Button icon={Plus} onClick={() => setEditing({})}>New project</Button>}>
      <DataTable
        columns={[
          { key: 'code', label: 'Code' },
          { key: 'name', label: 'Name' },
          { key: 'approved_amount', label: 'Approved', render: (p) => (p.approved_amount != null ? <Money value={p.approved_amount} /> : '—') },
          { key: 'dates', label: 'Dates', render: (p) => `${fmtDate(p.start_date)} → ${fmtDate(p.end_date)}` },
          { key: 'status', label: 'Status', render: (p) => <StatusBadge status={p.status} /> },
          { key: 'e', label: '', render: (p) => <Button size="sm" variant="info" onClick={() => setEditing(p)}>Edit</Button> },
        ]}
        rows={projects}
        emptyText="No projects yet."
      />
      {editing && <ProjectModal project={editing.id ? editing : null} onClose={() => setEditing(null)} />}
    </Panel>
  );
}
