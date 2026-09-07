/**
 * UserContext.js — Konti y'umukoresha (account state).
 *
 * Holds the signed-in user and the sign-up / sign-in actions. Everything is
 * in memory for now; when you add a backend, only the three async functions
 * below need to change — no screen has to be touched.
 */
import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { isValidEmail } from '../utils/format';

const UserContext = createContext(null);

// Simulates network latency so the loading states are actually visible while
// you're building. Set to 0 when you wire the real API.
const FAKE_DELAY = 700;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const clearError = useCallback(() => setError(null), []);

  /**
   * Create an account with first name, last name and email.
   * Returns the new user, or throws with a Kinyarwanda message.
   */
  const signUp = useCallback(async ({ firstName, lastName, email, phone }) => {
    setError(null);

    if (!firstName || !firstName.trim()) {
      const message = 'Andika izina ryawe rya mbere.';
      setError(message);
      throw new Error(message);
    }
    if (!lastName || !lastName.trim()) {
      const message = 'Andika izina ryawe rya nyuma.';
      setError(message);
      throw new Error(message);
    }
    if (!isValidEmail(email)) {
      const message = 'Imeyili ntabwo yujuje ibisabwa.';
      setError(message);
      throw new Error(message);
    }

    setIsLoading(true);
    try {
      await wait(FAKE_DELAY);
      const newUser = {
        id: `user-${Date.now()}`,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: (phone || '').trim(),
        provider: 'email',
        avatarUrl: null,
        createdAt: new Date().toISOString(),
      };
      setUser(newUser);
      return newUser;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Google sign-in placeholder.
   *
   * TO MAKE THIS REAL:
   *   npx expo install expo-auth-session expo-web-browser
   * then swap the body for a Google.useAuthRequest() flow and map the profile
   * response onto the same user shape returned below.
   */
  const signInWithGoogle = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      await wait(FAKE_DELAY);
      const googleUser = {
        id: `google-${Date.now()}`,
        firstName: 'Umukoresha',
        lastName: 'Google',
        email: 'umukoresha@gmail.com',
        phone: '',
        provider: 'google',
        avatarUrl: null,
        createdAt: new Date().toISOString(),
      };
      setUser(googleUser);
      return googleUser;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback((patch) => {
    setUser((current) => (current ? { ...current, ...patch } : current));
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    setError(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isSignedIn: Boolean(user),
      isLoading,
      error,
      clearError,
      signUp,
      signInWithGoogle,
      updateProfile,
      signOut,
    }),
    [user, isLoading, error, clearError, signUp, signInWithGoogle, updateProfile, signOut]
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
