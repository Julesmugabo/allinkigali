/**
 * DeliveryCell.jsx — delivery on/off, and its fee / minimum / time, edited
 * in place in the places list.
 */
import React, { useState } from 'react';
import { t } from '../../../../theme';
import Button from '../../../../components/common/Button';

export default function DeliveryCell({ place, onSave, disabled }) {
  const [editing, setEditing] = useState(false);
  const [fee, setFee] = useState(place.delivery_fee ?? '');
  const [min, setMin] = useState(place.min_order ?? '');
  const [eta, setEta] = useState(place.estimated_time ?? '');

  if (editing) {
    return (
      <div style={s.form}>
        <input type="number" min="0" value={fee} onChange={(e) => setFee(e.target.value)} placeholder="Fee RWF" style={s.in} />
        <input type="number" min="0" value={min} onChange={(e) => setMin(e.target.value)} placeholder="Min order" style={s.in} />
        <input value={eta} onChange={(e) => setEta(e.target.value)} placeholder="e.g. 30-45 min" style={s.in} />
        <Button size="sm" variant="success" onClick={() => { onSave({ delivery_fee: fee === '' ? null : Number(fee), min_order: min === '' ? null : Number(min), estimated_time: eta || null }, 'Delivery details saved'); setEditing(false); }}>Save</Button>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <button disabled={disabled} onClick={() => onSave({ delivery_enabled: !place.delivery_enabled }, place.delivery_enabled ? 'Delivery switched off' : 'Delivery switched on')}
        style={{ ...s.switch, ...(place.delivery_enabled ? s.on : s.off) }}>
        {place.delivery_enabled ? 'On' : 'Off'}
      </button>
      {place.delivery_enabled && (
        <button onClick={() => setEditing(true)} style={s.link}>
          {place.delivery_fee == null ? 'set fee' : Number(place.delivery_fee) === 0 ? 'Free delivery' : `${Number(place.delivery_fee).toLocaleString()} RWF`}
        </button>
      )}
    </div>
  );
}

const s = {
  switch: { padding: '4px 10px', fontSize: 12, fontWeight: 600, borderRadius: 20 },
  on: { background: '#E6B92E22', color: '#E6B92E' },
  off: { background: t.bgHover, color: t.textSecondary },
  link: { background: 'transparent', color: t.inkAccent, padding: 0, fontSize: 12 },
  form: { display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 260 },
  in: { width: 90, padding: '5px 8px', fontSize: 12 },
};
