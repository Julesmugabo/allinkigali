/**
 * AdOps.jsx — advertisers and their campaigns (the ads themselves live on
 * the App ads and Web ads pages). The open tab is kept in the URL (?tab=campaigns).
 */
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs } from '../../../../components/PageShell';
import { Panel } from '../../../../components/ui';
import Advertisers from './Advertisers';
import Campaigns from './Campaigns';

const TABS = [
  { key: 'advertisers', label: 'Advertisers', C: Advertisers },
  { key: 'campaigns', label: 'Campaigns', C: Campaigns },
];

export default function AdOps() {
  const [params, setParams] = useSearchParams();
  const active = TABS.find((x) => x.key === params.get('tab')) || TABS[0];
  const View = active.C;
  return (
    <Panel title="Advertisers & campaigns">
      <Tabs tabs={TABS} active={active.key} onChange={(k) => setParams(k === 'advertisers' ? {} : { tab: k })} />
      <View />
    </Panel>
  );
}
