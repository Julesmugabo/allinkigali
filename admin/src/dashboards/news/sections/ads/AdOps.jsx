/**
 * AdOps.jsx — the ads section: feed ads, advertisers, campaigns.
 * The open tab is kept in the URL (?tab=advertisers).
 */
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs } from '../../../../components/PageShell';
import { Panel } from '../../../../components/ui';
import FeedAds from './FeedAds';
import Advertisers from './Advertisers';
import Campaigns from './Campaigns';

const TABS = [
  { key: 'feed', label: 'Feed ads', C: FeedAds },
  { key: 'advertisers', label: 'Advertisers', C: Advertisers },
  { key: 'campaigns', label: 'Campaigns', C: Campaigns },
];

export default function AdOps() {
  const [params, setParams] = useSearchParams();
  const active = TABS.find((x) => x.key === params.get('tab')) || TABS[0];
  const View = active.C;
  return (
    <Panel title="Ad operations">
      <Tabs tabs={TABS} active={active.key} onChange={(k) => setParams(k === 'feed' ? {} : { tab: k })} />
      <View />
    </Panel>
  );
}
