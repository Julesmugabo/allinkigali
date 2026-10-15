/**
 * openClientDashboard.js — "Open dashboard" for a client (Director, Sales
 * Partners, Finance): asks the API for a one-minute code and opens the
 * client dashboard in a new tab as allinkigali support — read-only until
 * "Make changes". The client sees every visit in their activity list.
 */
import { apiFetch } from '../api';

export const CLIENTS_URL = (import.meta.env.VITE_CLIENTS_URL || 'https://business.allinkigali.rw').replace(/\/$/, '');

export async function openClientDashboard(placeType, placeId) {
  const tab = window.open('', '_blank'); // opened during the click, so pop-up blockers allow it
  try {
    const { code } = await apiFetch('/clients/support/start', { method: 'POST', body: { placeType, placeId: String(placeId) } });
    const url = `${CLIENTS_URL}/support#code=${encodeURIComponent(code)}`;
    if (tab) { tab.opener = null; tab.location.href = url; } else window.location.href = url;
  } catch (e) {
    tab?.close();
    alert(e.message);
  }
}
