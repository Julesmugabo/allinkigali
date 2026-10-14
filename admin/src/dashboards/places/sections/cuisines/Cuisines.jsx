/**
 * Cuisines.jsx — how many restaurants offer each cuisine (and which ones),
 * so gaps in what readers can find are easy to spot.
 */
import React, { useEffect, useState } from 'react';
import { t } from '../../../../theme';
import { Panel, Loading, ErrorText } from '../../../../components/ui';
import BarList from '../../../../components/ui/BarList';
import { usePlaces } from '../../PlacesContext';
import { placesApi } from '../../placesApi';

export default function Cuisines() {
  const { type } = usePlaces();
  const [full, setFull] = useState(null);
  const [error, setError] = useState('');
  // The staff list has no tags, so read the public list (active places).
  useEffect(() => { placesApi.publicList(type).then(setFull).catch((e) => setError(e.message)); }, [type]);

  if (!full) return error ? <ErrorText>{error}</ErrorText> : <Loading />;
  const options = type.tags.find((g) => g.key === 'cuisines').options;
  const rows = options.map((o) => ({ ...o, places: full.filter((p) => (p.cuisines || []).includes(o.value)) }));
  const missing = rows.filter((r) => !r.places.length);

  return (
    <>
      <Panel title="Restaurants per cuisine">
        <BarList rows={rows.filter((r) => r.places.length).sort((a, b) => b.places.length - a.places.length)
          .map((r) => ({ key: r.value, label: `${r.label} — ${r.places.map((p) => p.name).join(', ')}`, value: r.places.length }))}
          empty="No restaurant has cuisines set yet." />
      </Panel>
      <Panel title={`No restaurant yet (${missing.length})`}>
        <div style={{ color: t.textSecondary, fontSize: 13 }}>{missing.map((r) => r.label).join(' · ') || 'Every cuisine is covered.'}</div>
      </Panel>
    </>
  );
}
