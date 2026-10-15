/**
 * main.jsx — Ku Meza for guests, no app and no account: /t/<token> is a
 * table's page (opened by its QR code); any other address asks for the
 * short code printed on the table's card.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import TablePage from './TablePage';
import CodePage from './CodePage';
import './table.css';

const match = window.location.pathname.match(/^\/t\/([A-Za-z0-9_-]{8,64})\/?$/);

ReactDOM.createRoot(document.getElementById('root')).render(match ? <TablePage token={match[1]} /> : <CodePage />);
