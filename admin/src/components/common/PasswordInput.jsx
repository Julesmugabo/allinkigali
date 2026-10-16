/**
 * PasswordInput.jsx — a password (or PIN) box with an eye button that shows
 * or hides what was typed. Takes the same props as <input>; used on the
 * Staff Portal and business dashboard sign-in pages.
 */
import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { t } from '../../theme';

export default function PasswordInput({ style, ...props }) {
  const [shown, setShown] = useState(false);
  const Icon = shown ? EyeOff : Eye;
  const label = shown ? 'Hide password' : 'Show password';

  return (
    <span style={s.wrap}>
      <input {...props} type={shown ? 'text' : 'password'} style={{ ...style, ...s.input }} />
      <button type="button" onClick={() => setShown((v) => !v)} aria-label={label} title={label} style={s.eye}>
        <Icon size={18} />
      </button>
    </span>
  );
}

const s = {
  wrap: { position: 'relative', display: 'block' },
  input: { width: '100%', boxSizing: 'border-box', paddingRight: 44 },
  eye: {
    position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
    display: 'flex', padding: 6, border: 'none', background: 'transparent',
    color: t.textMuted, cursor: 'pointer',
  },
};
