/**
 * googleAuth.js — "Sign in with Google" on the web, using Google's own
 * button (Google Identity Services). Google draws the button, the person
 * picks their account in Google's window, and we get an ID token that the
 * API checks (POST /auth/google).
 *
 * The older silent "One Tap" pop-up is not used: browsers often block it
 * without telling anyone, which looked like "the Google button does nothing".
 * On phones (non-web) this isn't available yet — isGoogleAvailable() is false.
 */
import { Platform } from 'react-native';

const CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
let scriptPromise = null;
let current = null; // the mounted button's handler; Google calls one global callback

export const isGoogleAvailable = () => Platform.OS === 'web' && !!CLIENT_ID;

function loadScript() {
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client?hl=en';
      s.async = true;
      s.onload = resolve;
      s.onerror = () => { scriptPromise = null; reject(new Error('Could not reach Google. Check your internet.')); };
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

/**
 * Draws Google's button inside `el`. `onCredential(idToken)` runs after the
 * person chooses their Google account.
 */
export async function renderGoogleButton(el, { onCredential, text = 'continue_with', width = 320 }) {
  if (!isGoogleAvailable() || !el) return;
  await loadScript();
  current = onCredential;
  window.google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: (response) => { if (response?.credential && current) current(response.credential); },
    auto_select: false,
    ux_mode: 'popup',
  });
  el.innerHTML = '';
  window.google.accounts.id.renderButton(el, {
    type: 'standard', theme: 'outline', size: 'large', shape: 'pill', text, logo_alignment: 'left', locale: 'en',
    width: Math.min(Math.max(Math.round(width), 200), 400),
  });
}
