/**
 * Team.jsx — Team › Staff (/team/staff) and Team › Tablets (/team/tablets).
 */
import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageShell';
import Flash, { useFlash } from '../common/Flash';
import StaffList from './StaffList';
import Tablets from './Tablets';

export default function Team({ me }) {
  const { tab } = useParams();
  const [flash, show] = useFlash();
  if (!['staff', 'tablets'].includes(tab)) return <Navigate to="/team/staff" replace />;
  return (
    <div>
      <PageHeader title={tab === 'staff' ? 'Staff' : 'Tablets'} subtitle={me.place.name} />
      {tab === 'staff' ? <StaffList me={me} show={show} /> : <Tablets show={show} />}
      <Flash flash={flash} />
    </div>
  );
}
