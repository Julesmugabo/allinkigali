/**
 * tableLink.js — where a table's QR code points: the customer's Ku Meza page
 * on the main site (allinkigali.rw/t/<token>), and the page where a guest
 * types the short code instead (allinkigali.rw/table).
 */
const SITE = (import.meta.env.VITE_TABLE_URL || 'https://allinkigali.rw').replace(/\/$/, '');

export const tableUrl = (qrToken) => `${SITE}/t/${qrToken}`;
export const codePageLabel = `${SITE.replace(/^https?:\/\//, '')}/table`;
