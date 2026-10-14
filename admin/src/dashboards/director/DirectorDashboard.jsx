/**
 * DirectorDashboard.jsx — the director's own area (/overview/:section?):
 * a platform-wide overview with what needs attention, the marketplace
 * shops, and team access. Every other dashboard is in the sidebar too.
 */
import React, { useCallback, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageShell';
import { Toast } from '../../components/ui';
import { SECTIONS } from './nav';
import Overview from './sections/overview/Overview';
import Marketplace from './sections/marketplace/Marketplace';
import Team from './sections/team/Team';

const VIEWS = { overview: Overview, marketplace: Marketplace, team: Team };

export default function DirectorDashboard() {
  const { section = 'overview' } = useParams();
  const [toast, setToast] = useState(null);
  const notify = useCallback((text) => {
    const id = Date.now();
    setToast({ text, id });
    setTimeout(() => setToast((c) => (c?.id === id ? null : c)), 3000);
  }, []);
  const View = VIEWS[section];
  if (!View) return <Navigate to="/overview" replace />;
  return (
    <div>
      <PageHeader title="Director" subtitle={SECTIONS.find((x) => x.key === section)?.label} />
      <View notify={notify} />
      <Toast toast={toast} />
    </div>
  );
}
