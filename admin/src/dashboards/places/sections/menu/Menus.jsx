/**
 * Menus.jsx — pick a restaurant and manage its menu (platform staff).
 */
import React, { useCallback, useEffect, useState } from 'react';
import { SelectField } from '../../../../components/form/Fields';
import { Panel, Loading, ErrorText } from '../../../../components/ui';
import MenuEditor from '../../../../components/places/MenuEditor';
import { usePlaces } from '../../PlacesContext';
import { placesApi } from '../../placesApi';

// The public menu endpoint returns camelCase; MenuEditor reads either.
const toItem = (i) => ({ ...i, photo_url: i.photoUrl ?? i.photo_url });

export default function Menus() {
  const { places, notify } = usePlaces();
  const [placeId, setPlaceId] = useState('');
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { if (!placeId && places[0]) setPlaceId(String(places[0].id)); }, [places, placeId]);
  const load = useCallback(() => {
    if (!placeId) return;
    setItems(null);
    placesApi.menu(placeId).then((d) => setItems(d.map(toItem))).catch((e) => setError(e.message));
  }, [placeId]);
  useEffect(() => { load(); }, [load]);

  const body = (f) => ({ restaurantId: placeId, category: f.category, name: f.name.trim(), description: f.description, price: f.price, available: f.available, sortOrder: f.sortOrder ?? 0 });
  const onSave = async (item, f) => {
    if (item) await placesApi.updateMenuItem(item.id, body(f));
    else await placesApi.createMenuItem(body(f));
    notify(item ? 'Menu item saved' : 'Menu item added'); load();
  };
  const onDelete = async (i) => { await placesApi.deleteMenuItem(i.id); notify('Menu item removed'); load(); };
  const onToggle = async (i) => {
    await placesApi.updateMenuItem(i.id, body({ ...i, available: i.available === false }));
    notify(i.available === false ? `${i.name} is available` : `${i.name} marked sold out`); load();
  };

  return (
    <Panel title="Menus">
      <div style={{ maxWidth: 360, marginBottom: 16 }}>
        <SelectField label="Restaurant" value={placeId} onChange={setPlaceId} options={places.map((p) => ({ value: String(p.id), label: p.name }))} />
      </div>
      <ErrorText>{error}</ErrorText>
      {!placeId ? null : !items ? <Loading /> : <MenuEditor kind="restaurant" items={items} onSave={onSave} onDelete={onDelete} onToggle={onToggle} />}
    </Panel>
  );
}
