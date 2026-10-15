/**
 * main.jsx — the client dashboard (allinclients.allinkigali.rw): restaurants,
 * coffee shops and wedding venues run their business here. Same codebase as
 * the Staff Portal, its own sign-in.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { configureApi } from '../api';
import ClientsApp from './ClientsApp';
import '../index.css';

configureApi({ tokenKey: 'client-token', userKey: 'client-user' });
document.body.style.overflow = 'auto'; // the page itself scrolls here (the Staff Portal scrolls its main panel)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ClientsApp />
    </BrowserRouter>
  </React.StrictMode>,
);
