/**
 * MediaUpload.jsx — pick a photo/video and upload it through the server
 * (POST /upload → permanent URL), or paste a link. Shows a preview, and
 * warns when a pasted "link" is really a search-page thumbnail (data: URL),
 * which is what makes covers come out blurry.
 */
import React, { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { t } from '../../theme';
import { getToken } from '../../api';
import Button from '../common/Button';

const API_URL = import.meta.env.VITE_API_URL;
const MAX_MB = 10; // server limit (routes/upload.js)

export const isEmbeddedPreview = (url) => typeof url === 'string' && url.trim().startsWith('data:');

export default function MediaUpload({ label, value, onChange, kind = 'image', hint }) {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const upload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024) { setError(`That file is ${(file.size / 1048576).toFixed(1)} MB — the limit is ${MAX_MB} MB.`); return; }
    setBusy(true); setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const token = getToken();
      const res = await fetch(`${API_URL}/upload`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`);
      onChange(data.url);
    } catch (err) { setError(err.message); }
    setBusy(false);
  };

  return (
    <div style={s.wrap}>
      {label && <span style={s.label}>{label}</span>}
      <div style={s.row}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <input value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="Paste a link, or upload" style={{ width: '100%' }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input ref={fileRef} type="file" accept={kind === 'video' ? 'video/*' : 'image/*'} onChange={upload} style={{ display: 'none' }} />
            <Button type="button" size="sm" variant="info" icon={Upload} disabled={busy} onClick={() => fileRef.current?.click()}>
              {busy ? 'Uploading...' : kind === 'video' ? 'Upload video' : 'Upload photo'}
            </Button>
            {value && <Button type="button" size="sm" variant="ghost" icon={X} onClick={() => onChange('')}>Remove</Button>}
          </div>
        </div>
        {value && !isEmbeddedPreview(value) && (kind === 'video'
          ? <video src={value} style={s.preview} muted />
          : <img src={value} alt="" style={s.preview} />)}
      </div>
      {isEmbeddedPreview(value) && (
        <div style={s.warn}>
          This is a small preview copied from a search page (like Google Images), not the real file — it will look
          blurry. Open the image, right-click the large version and choose "Copy image address", or upload the file.
        </div>
      )}
      {error && <div style={s.err}>{error}</div>}
      {hint && <span style={s.hint}>{hint}</span>}
    </div>
  );
}

const s = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 6, gridColumn: '1 / -1' },
  label: { color: t.textSecondary, fontSize: 13, fontWeight: 500 },
  row: { display: 'flex', gap: 12, alignItems: 'flex-start' },
  preview: { width: 110, height: 72, objectFit: 'cover', borderRadius: 8, border: `1px solid ${t.borderLight}`, background: t.bg },
  warn: { padding: '8px 10px', borderRadius: 6, background: 'rgba(251,191,36,0.12)', color: t.inkStatus || t.warning, fontSize: 12, lineHeight: 1.5 },
  err: { color: t.inkStatus || t.danger, fontSize: 12 },
  hint: { color: t.textMuted, fontSize: 12 },
};
