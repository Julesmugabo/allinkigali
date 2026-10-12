/**
 * UserContext.js — Konti y'umukoresha (account state).
 *
 * Talks to our own Express + Postgres backend now (server/src/routes/auth.js:
 * POST /signup, POST /login, GET /me), not in-memory state — every screen
 * still only ever calls useUser().
 *
 * On mount, if a token from a previous session is already stored
 * (AsyncStorage, via apiClient), GET /me rehydrates the signed-in user so a
 * reload doesn't silently sign someone out while their token is still
 * valid. `isLoading` covers both that bootstrap check and every sign-in/
 * sign-up call — screens that need to tell "still checking" from "signed
 * out" apart can rely on it being true during the bootstrap.
 */
import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import { apiFetch, getToken, setToken } from '../services/apiClient';
import { isValidEmail } from '../utils/format';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [error, setError] = useState(null);

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) {
        setIsBootstrapping(false);
        return;
      }
      try {
        const { user: me } = await apiFetch('/auth/me');
        setUser(me);
      } catch {
        // Token is stale/invalid — drop it rather than staying stuck
        // "signed in" with a session the server no longer recognizes.
        await setToken(null);
      } finally {
        setIsBootstrapping(false);
      }
    })();
  }, []);

  /**
   * Create an account with first name, last name, email and password.
   * Returns the new user, or throws with a Kinyarwanda message.
   */
  const signUp = useCallback(async ({ firstName, lastName, email, phone, password }) => {
    setError(null);

    if (!firstName || !firstName.trim()) {
      const message = 'Enter your first name.';
      setError(message);
      throw new Error(message);
    }
    if (!lastName || !lastName.trim()) {
      const message = 'Enter your last name.';
      setError(message);
      throw new Error(message);
    }
    if (!isValidEmail(email)) {
      const message = 'That email does not look right.';
      setError(message);
      throw new Error(message);
    }
    if (!password || password.length < 6) {
      const message = 'Password must be at least 6 characters.';
      setError(message);
      throw new Error(message);
    }

    setIsLoading(true);
    try {
      const { token, user: newUser } = await apiFetch('/auth/signup', {
        method: 'POST',
        body: { firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), phone, password },
      });
      await setToken(token);
      setUser(newUser);
      return newUser;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Sign in to an existing account.
   */
  const signIn = useCallback(async ({ email, password }) => {
    setError(null);

    if (!isValidEmail(email)) {
      const message = 'That email does not look right.';
      setError(message);
      throw new Error(message);
    }
    if (!password) {
      const message = 'Enter your password.';
      setError(message);
      throw new Error(message);
    }

    setIsLoading(true);
    try {
      const { token, user: signedInUser } = await apiFetch('/auth/login', {
        method: 'POST',
        body: { email: email.trim(), password },
      });
      await setToken(token);
      setUser(signedInUser);
      return signedInUser;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Save name + phone. Email and role can't be changed from here. Returns
   * true on success; on failure sets `error` and returns false.
   */
  const saveProfile = useCallback(async ({ firstName, lastName, phone }) => {
    setError(null);
    try {
      const { user: updated } = await apiFetch('/auth/me', {
        method: 'PATCH',
        body: { firstName, lastName, phone },
      });
      setUser(updated);
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
  }, []);

  const signInWithGoogle = useCallback(async (credential) => {
    setIsLoading(true);
    setError(null);
    try {
      const { token, user: signedInUser } = await apiFetch('/auth/google', {
        method: 'POST',
        body: { credential },
      });
      await setToken(token);
      setUser(signedInUser);
      return signedInUser;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const changePassword = useCallback(async ({ currentPassword, newPassword }) => {
    await apiFetch('/auth/change-password', { method: 'POST', body: { currentPassword, newPassword } });
  }, []);

  const signOut = useCallback(async () => {
    await setToken(null);
    setUser(null);
    setError(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isSignedIn: Boolean(user),
      isLoading,
      isBootstrapping,
      error,
      clearError,
      signUp,
      signIn,
      signInWithGoogle,
      saveProfile,
      changePassword,
      signOut,
    }),
    [user, isLoading, isBootstrapping, error, clearError, signUp, signIn, signInWithGoogle, saveProfile, changePassword, signOut]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used inside <UserProvider>.');
  }
  return context;
}

export default UserContext;
