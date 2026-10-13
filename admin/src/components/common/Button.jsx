/**
 * Button.jsx — the portal's button variants in one place.
 *   primary  solid accent (main action)
 *   ghost    subtle (cancel / secondary)
 *   success / danger / warning / info   tinted (row actions like Approve, Void)
 * size="sm" for compact row actions.
 */
import React from 'react';
import { t } from '../../theme';

const VARIANTS = {
  primary: { background: t.accent, color: t.bg, fontWeight: 600 },
  ghost: { background: t.bgHover, color: t.text },
  success: { background: `${t.success}20`, color: t.success, fontWeight: 600 },
  danger: { background: `${t.danger}20`, color: t.danger, fontWeight: 600 },
  warning: { background: `${t.warning}20`, color: t.warning, fontWeight: 600 },
  info: { background: t.bgActive, color: t.accent, fontWeight: 600 },
};

export default function Button({ variant = 'primary', size, icon: Icon, children, style, ...rest }) {
  const sm = size === 'sm';
  return (
    <button
      {...rest}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
        ...(sm ? { padding: '5px 10px', fontSize: 12 } : {}),
        ...VARIANTS[variant],
        ...style,
      }}
    >
      {Icon && <Icon size={sm ? 13 : 16} />}
      {children}
    </button>
  );
}
