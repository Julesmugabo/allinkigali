/**
 * useDraftAutosave.js — keeps an unsaved NEW article in this browser so a
 * closed tab or crash doesn't lose it. Saves a few seconds after typing
 * stops; offers to restore it next time the editor opens.
 */
import { useEffect, useState } from 'react';

const KEY = 'portal-news-draft';

const read = () => {
  try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; }
};

export function clearDraft() {
  try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ }
}

export default function useDraftAutosave(enabled, draft) {
  const [saved, setSaved] = useState(() => (enabled ? read() : null)); // offered for restore
  const [savedAt, setSavedAt] = useState(null);
  const snapshot = JSON.stringify(draft);

  useEffect(() => {
    if (!enabled || (!draft.title && !draft.body)) return undefined;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(KEY, JSON.stringify({ ...draft, at: Date.now() }));
        setSavedAt(new Date());
      } catch { /* storage full or blocked */ }
    }, 4000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, snapshot]);

  return {
    restorable: saved && (saved.title || saved.body) ? saved : null,
    dismissRestore: () => setSaved(null),
    discard: () => { clearDraft(); setSaved(null); },
    savedAt,
  };
}
