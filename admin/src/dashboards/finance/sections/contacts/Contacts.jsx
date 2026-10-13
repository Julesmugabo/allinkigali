/**
 * Contacts.jsx — suppliers, customers, donors and employees the finance
 * team deals with (used by transactions and invoices).
 */
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { DataTable } from '../../../../components/PageShell';
import Button from '../../../../components/common/Button';
import { useFinance } from '../../FinanceContext';
import { Panel, StatusBadge } from '../../components/ui';
import ContactModal from './ContactModal';

export default function Contacts() {
  const { contacts } = useFinance();
  const [editing, setEditing] = useState(null); // null = closed, {} = new, contact = edit

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'contact_type', label: 'Type' },
    { key: 'email', label: 'Email', render: (r) => r.email || '—' },
    { key: 'phone', label: 'Phone', render: (r) => r.phone || '—' },
    { key: 'payment_terms_days', label: 'Terms', render: (r) => (r.payment_terms_days != null ? `${r.payment_terms_days} days` : '—') },
    { key: 'is_active', label: 'Status', render: (r) => <StatusBadge status={r.is_active === false ? 'inactive' : 'active'} /> },
    { key: 'actions', label: '', render: (r) => <Button size="sm" variant="info" onClick={() => setEditing(r)}>Edit</Button> },
  ];

  return (
    <Panel title="Contacts" actions={<Button icon={Plus} onClick={() => setEditing({})}>Add contact</Button>}>
      <DataTable columns={columns} rows={contacts} emptyText="No contacts yet — add suppliers, customers or donors." />
      {editing && <ContactModal contact={editing.id ? editing : null} onClose={() => setEditing(null)} />}
    </Panel>
  );
}
