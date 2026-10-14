/**
 * Intents.jsx — which coffee shops readers find for each visitor intent
 * ("work remotely", "date"...). A shop matches when it has at least one of
 * the intent's attributes; edit a shop's attributes to change that.
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { t } from '../../../../theme';
import { Panel, Loading, ErrorText } from '../../../../components/ui';
import { usePlaces } from '../../PlacesContext';
import { placesApi } from '../../placesApi';
import { COFFEE_INTENTS } from '../../placeTypes';

export default function Intents() {
  const navigate = useNavigate();
  const { type } = usePlaces();
  const [shops, setShops] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { placesApi.publicList(type).then(setShops).catch((e) => setError(e.message)); }, [type]);
  if (!shops) return error ? <ErrorText>{error}</ErrorText> : <Loading />;

  return (
    <div style={s.grid}>
      {COFFEE_INTENTS.map((intent) => {
        const matches = shops.filter((sh) => (sh.attributes || []).some((a) => intent.attrs.includes(a)));
        return (
          <Panel key={intent.key} title={`${intent.label} (${matches.length})`} style={{ marginBottom: 0 }}>
            <div style={s.attrs}>Needs any of: {intent.attrs.join(', ')}</div>
            {matches.length ? matches.map((sh) => (
              <button key={sh.id} onClick={() => navigate(`${type.base}/add?id=${sh.id}`)} style={s.shop}>{sh.name}</button>
            )) : <div style={s.none}>No coffee shop matches yet — add attributes to a shop.</div>}
          </Panel>
        );
      })}
    </div>
  );
}

const s = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 },
  attrs: { color: t.textMuted, fontSize: 12, marginBottom: 10 },
  shop: { display: 'block', background: 'transparent', color: t.accent, padding: '4px 0', fontSize: 14, textAlign: 'left' },
  none: { color: t.warning, fontSize: 13 },
};
