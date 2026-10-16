/**
 * installDevice.js — which "install this site as an app" help a device needs.
 *
 * Android phones and computers running Chrome or Edge offer their own
 * Install prompt. Apple offers none: on an iPhone or iPad only the person
 * can add a site to the Home Screen (Share → Add to Home Screen), and only
 * from a real browser, never from a page opened inside Instagram, Facebook,
 * TikTok or the Google app; on a Mac, Safari 17+ has File → Add to Dock. So:
 *   'android'      — the browser's own Install prompt (InstallAppBanner)
 *   'desktop'      — a computer: offered only if Chrome/Edge raise their Install prompt
 *   'mac-safari'   — Safari on a Mac: File → Add to Dock
 *   'ios-safari'   — iPhone/iPad Safari: Share is in Safari's toolbar
 *   'ios-browser'  — Chrome, Edge, Firefox… on iOS: Share is in the address bar or menu
 *   'ios-in-app'   — inside another app: open the page in Safari first
 */
const IN_APP = /FBAN|FBAV|FB_IAB|Instagram|Line\/|TikTok|musical_ly|BytedanceWebview|LinkedInApp|Snapchat|Twitter|Pinterest|GSA\//i;
const OTHER_IOS_BROWSER = /CriOS|EdgiOS|FxiOS|OPiOS/i;
const NOT_SAFARI = /Chrome|Chromium|CriOS|Edg|Firefox|FxiOS|OPR/i;

const ua = () => window.navigator.userAgent || '';

/** 'iPhone', 'iPad' or null. iPads say they are Macs, so a touch screen gives them away. */
export function appleDevice() {
  if (/iPhone|iPod/.test(ua())) return 'iPhone';
  if (/iPad/.test(ua()) || (/Macintosh/.test(ua()) && window.navigator.maxTouchPoints > 1)) return 'iPad';
  return null;
}

/** How the banner names the device: iPhone, iPad, Mac, phone or computer. */
export function deviceName(kind) {
  return appleDevice() || (/Macintosh/.test(ua()) ? 'Mac' : kind === 'android' ? 'phone' : 'computer');
}

// Safari 17 (macOS Sonoma) and newer can add a site to the Dock.
function isMacSafari() {
  const version = ua().match(/Version\/(\d+)/);
  return /Macintosh/.test(ua()) && /Safari/.test(ua()) && !NOT_SAFARI.test(ua()) && !!version && Number(version[1]) >= 17;
}

export function installKind() {
  if (appleDevice()) {
    if (IN_APP.test(ua())) return 'ios-in-app';
    if (OTHER_IOS_BROWSER.test(ua())) return 'ios-browser';
    return 'ios-safari';
  }
  if (/Android/i.test(ua())) return 'android';
  if (isMacSafari()) return 'mac-safari';
  return 'desktop';
}

/** The browser installs it itself (an Install button); otherwise we show the steps. */
export const hasInstallPrompt = (kind) => kind === 'android' || kind === 'desktop';

/** Already opened from the Home Screen, Dock or app icon. */
export function isInstalled() {
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
}
