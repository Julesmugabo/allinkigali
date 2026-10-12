/**
 * googleAuth.js — Google One Tap sign-in for web.
 * Loads the Google Identity Services script once, then exposes
 * `promptGoogleSignIn()` which triggers the One Tap popup.
 * On non-web platforms this is a no-op (returns null).
 */
import { Platform } from 'react-native';

const CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
let scriptLoaded = false;
let initDone = false;

function loadGISScript() {
  return new Promise((resolve) => {
    if (scriptLoaded) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => { scriptLoaded = true; resolve(); };
    document.head.appendChild(script);
  });
}

/**
 * Trigger the Google One Tap popup.
 * Returns the raw Google credential string, or null if cancelled / not web.
 */
export function promptGoogleSignIn() {
  if (Platform.OS !== 'web' || !CLIENT_ID) return Promise.resolve(null);

  return new Promise(async (resolve) => {
    await loadGISScript();

    if (!window.google?.accounts?.id) { resolve(null); return; }

    if (!initDone) {
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (response) => {
          resolve(response?.credential || null);
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      initDone = true;
    } else {
      // Re-initialize callback so a fresh promise gets the result
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (response) => {
          resolve(response?.credential || null);
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });
    }

    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        resolve(null);
      }
    });
  });
}
