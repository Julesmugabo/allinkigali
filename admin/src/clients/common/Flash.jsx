/**
 * Flash.jsx — a message pinned to the bottom of the screen for a few
 * seconds, so it's seen wherever the person tapped (errors in red).
 *   const [flash, show] = useFlash();  show('Saved');  show(e.message, true)
 *   <Flash flash={flash} />
 */
import React, { useCallback, useRef, useState } from 'react';
import { t } from '../../theme';

export function useFlash() {
  const [flash, setFlash] = useState(null);
  const timer = useRef(null);
  const show = useCallback((text, isError = false) => {
    setFlash({ text, isError, id: Date.now() });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setFlash(null), isError ? 7000 : 3500);
  }, []);
  return [flash, show];
}

export default function Flash({ flash }) {
  if (!flash) return null;
  return (
    <div key={flash.id} style={{ ...s.flash, borderLeft: `5px solid ${flash.isError ? t.danger : t.lime}` }}>
      {flash.text}
    </div>
  );
}

const s = {
  flash: { position: 'fixed', left: '50%', bottom: 24, transform: 'translateX(-50%)', zIndex: 300, maxWidth: 'calc(100vw - 32px)', padding: '12px 18px', borderRadius: 10, fontWeight: 700, fontSize: 14, boxShadow: t.shadowLg, background: t.bgCard, color: t.text },
};
