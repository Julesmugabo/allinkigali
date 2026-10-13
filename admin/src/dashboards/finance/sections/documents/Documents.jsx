/**
 * Documents.jsx — receipts, contracts and statements kept with the books,
 * optionally linked to a transaction, invoice or project.
 */
import React, { useState } from 'react';
import { Plus, ExternalLink } from 'lucide-react';
import { DataTable } from '../../../../components/PageShell';
import Button from '../../../../components/common/Button';
import { useFinance, useFinanceData } from '../../FinanceContext';
import { financeApi } from '../../financeApi';
import { Panel, Loading, ErrorText, RowActions, fmtDate } from '../../components/ui';
import DocumentModal from './DocumentModal';

export default function Documents() {
  const { changed, notify } = useFinance();
  const [adding, setAdding] = useState(false);
  const { data, loading, error } = useFinanceData(() => financeApi.documents());

  const remove = async (d) => {
    if (!window.confirm(`Delete "${d.file_name}"?`)) return;
    try { await financeApi.deleteDocument(d.id); notify('Document deleted'); changed(); }
    catch (e) { alert(e.message); }
  };

  const linkedTo = (d) => [
    d.transaction_id && `Transaction #${d.transaction_id}`,
    d.invoice_id && `Invoice #${d.invoice_id}`,
    d.project_id && `Project #${d.project_id}`,
  ].filter(Boolean).join(', ') || '—';

  const columns = [
    { key: 'file_name', label: 'File', render: (d) => <span style={{ fontWeight: 500 }}>{d.file_name}</span> },
    { key: 'description', label: 'Description', render: (d) => d.description || '—' },
    { key: 'linked', label: 'Linked to', render: linkedTo },
    { key: 'uploader_name', label: 'Added by', render: (d) => d.uploader_name || '—' },
    { key: 'created_at', label: 'Added', render: (d) => fmtDate(d.created_at) },
    {
      key: 'actions', label: '', render: (d) => (
        <RowActions>
          <a href={d.file_url} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="info" icon={ExternalLink}>Open</Button>
          </a>
          <Button size="sm" variant="danger" onClick={() => remove(d)}>Delete</Button>
        </RowActions>
      ),
    },
  ];

  return (
    <Panel title="Finance documents" actions={<Button icon={Plus} onClick={() => setAdding(true)}>Add document</Button>}>
      <ErrorText>{error}</ErrorText>
      {loading ? <Loading /> : <DataTable columns={columns} rows={data || []} emptyText="No documents yet." />}
      {adding && <DocumentModal onClose={() => setAdding(false)} />}
    </Panel>
  );
}
