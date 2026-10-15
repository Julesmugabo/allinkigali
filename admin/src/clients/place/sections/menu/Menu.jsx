/**
 * Menu.jsx — this place's menu (dishes, or drinks with brew method/origin).
 */
import React from 'react';
import { Panel } from '../../../../components/ui';
import MenuEditor from '../../../../components/places/MenuEditor';
import { useOwner } from '../../OwnerContext';

export default function Menu() {
  const { menu, api, kind, changed, notify } = useOwner();
  const onSave = async (item, f) => {
    const body = { category: f.category, name: f.name.trim(), description: f.description, price: f.price, available: f.available, photoUrl: f.photoUrl || null };
    if (kind === 'coffeeshop') Object.assign(body, { brewMethod: f.brewMethod || null, origin: f.origin || null });
    if (item) await api.updateMenuItem(item.id, body);
    else await api.addMenuItem(body);
    notify(item ? 'Menu item saved' : 'Menu item added'); changed();
  };
  const onDelete = async (i) => { await api.deleteMenuItem(i.id); notify('Menu item removed'); changed(); };
  const onToggle = async (i) => {
    await api.updateMenuItem(i.id, { available: i.available === false });
    notify(i.available === false ? `${i.name} is available again` : `${i.name} marked sold out`); changed();
  };
  return (
    <Panel title="Menu">
      <MenuEditor kind={kind} items={menu} onSave={onSave} onDelete={onDelete} onToggle={onToggle} />
    </Panel>
  );
}
