import React from 'react';
import { t } from '../../../theme';
import { Badge } from '../../../components/PageShell';
import { STATUS_COLOR } from '../constants';

export default function StatusBadge({ status }) {
  if (!status) return null;
  return <Badge color={STATUS_COLOR[status] || t.textSecondary}>{status}</Badge>;
}
