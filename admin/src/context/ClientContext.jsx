/**
 * ClientContext — tracks which client business the Sellers Admin is currently
 * managing. When set, a ClientBanner appears at the top of every page so the
 * user always knows they are inside a client's space, with a one-click way
 * back to the client list.
 *
 * Shape of `client`:
 *   { type: 'restaurant' | 'coffeeshop', id: string, name: string }
 */
import React, { createContext, useContext, useState, useCallback } from 'react';

const ClientContext = createContext(null);

export function ClientProvider({ children }) {
  const [client, setClient] = useState(null);

  const enterClient = useCallback((type, id, name) => {
    setClient({ type, id, name });
  }, []);

  const exitClient = useCallback(() => {
    setClient(null);
  }, []);

  return (
    <ClientContext.Provider value={{ client, enterClient, exitClient }}>
      {children}
    </ClientContext.Provider>
  );
}

export function useClient() {
  return useContext(ClientContext);
}
