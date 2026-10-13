/**
 * Fields.jsx — labelled form controls shared by every dashboard's modals,
 * so each form only lists its fields instead of re-styling inputs.
 *
 *   <FormGrid>                       two-column layout (one column on phones)
 *     <Field label="Name" value={v} onChange={setV} />
 *     <SelectField label="Type" value={v} onChange={setV} options={[{ value, label }]} />
 *     <TextAreaField label="Notes" ... full />   full = spans both columns
 *   </FormGrid>
 */
import React from 'react';
import { t } from '../../theme';

export function FormGrid({ children }) {
  return <div style={s.grid}>{children}</div>;
}

function Labelled({ label, full, hint, children }) {
  return (
    <label style={{ ...s.field, ...(full ? s.full : {}) }}>
      {label && <span style={s.label}>{label}</span>}
      {children}
      {hint && <span style={s.hint}>{hint}</span>}
    </label>
  );
}

export function Field({ label, value, onChange, type = 'text', placeholder, full, hint, ...rest }) {
  return (
    <Labelled label={label} full={full} hint={hint}>
      <input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={s.control}
        {...rest}
      />
    </Labelled>
  );
}

export function SelectField({ label, value, onChange, options, placeholder, full, hint }) {
  return (
    <Labelled label={label} full={full} hint={hint}>
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value)} style={s.control}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </Labelled>
  );
}

export function TextAreaField({ label, value, onChange, placeholder, rows = 3, full = true, mono }) {
  return (
    <Labelled label={label} full={full}>
      <textarea
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        style={{ ...s.control, resize: 'vertical', ...(mono ? { fontFamily: 'monospace', fontSize: 13 } : {}) }}
      />
    </Labelled>
  );
}

export function CheckboxField({ label, checked, onChange, full }) {
  return (
    <label style={{ ...s.check, ...(full ? s.full : {}) }}>
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <span style={{ color: t.textSecondary, fontSize: 13 }}>{label}</span>
    </label>
  );
}

const s = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 },
  field: { display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 },
  full: { gridColumn: '1 / -1' },
  label: { color: t.textSecondary, fontSize: 13, fontWeight: 500 },
  hint: { color: t.textMuted, fontSize: 12 },
  control: { width: '100%' },
  check: { display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' },
};
