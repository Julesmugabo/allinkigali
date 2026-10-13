/**
 * AuthorModal.jsx — add or edit an author.
 */
import React, { useState } from 'react';
import Modal, { ModalActions } from '../../../../components/common/Modal';
import Button from '../../../../components/common/Button';
import { FormGrid, Field, SelectField, TextAreaField } from '../../../../components/form/Fields';
import MediaUpload from '../../../../components/form/MediaUpload';
import { ErrorText } from '../../../../components/ui';
import { useNews } from '../../NewsContext';
import { newsApi } from '../../newsApi';
import { AUTHOR_ROLES } from '../../constants';

export default function AuthorModal({ author, onClose }) {
  const { changed, notify } = useNews();
  const [form, setForm] = useState({
    name: author?.name || '', role: author?.role || 'reporter', email: author?.email || '',
    bio: author?.bio || '', avatarUrl: author?.avatar_url || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name.trim()) { setError('Name is required.'); return; }
    setSaving(true); setError('');
    try {
      if (author) await newsApi.updateAuthor(author.id, form);
      else await newsApi.createAuthor(form);
      notify(author ? 'Author updated' : 'Author added'); changed(); onClose();
    } catch (e) { setError(e.message); }
    setSaving(false);
  };

  return (
    <Modal open onClose={onClose} title={author ? 'Edit Author' : 'Add Author'} width={560}>
      <ErrorText>{error}</ErrorText>
      <FormGrid>
        <Field label="Full name *" value={form.name} onChange={set('name')} />
        <SelectField label="Role" value={form.role} onChange={set('role')} options={AUTHOR_ROLES} />
        <Field label="Email" type="email" value={form.email} onChange={set('email')} full />
        <TextAreaField label="Short bio" value={form.bio} onChange={set('bio')} rows={2} />
        <MediaUpload label="Photo" value={form.avatarUrl} onChange={set('avatarUrl')} />
      </FormGrid>
      <ModalActions>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : author ? 'Save changes' : 'Add author'}</Button>
      </ModalActions>
    </Modal>
  );
}
