/**
 * FILE: capacitor.config.ts
 *
 * PURPOSE:
 *   Capacitor native shell configuration for the MindTalk (Cadabams Consult)
 *   mobile app. The native shell is REMOTE-ONLY — the WebView always loads
 *   the deployed web app (dev-x3 staging by default). We do NOT ship a
 *   bundled `out/` build because the Next.js app uses middleware running
 *   on serverless functions and cannot be statically exported.
 *
 * LOGIC OVERVIEW:
 *   1. Detect build mode via `NODE_ENV` to toggle WebView debugging and
 *      native logging level.
 *   2. `CAP_REMOTE_URL` env var overrides the default remote origin — use
 *      it to point a local native build at prod or at a local ngrok tunnel.
 *      Default is `https://www.dev-x3.cadabams.com/`.
 *   3. Plugin options (StatusBar, Keyboard, Razorpay, Push/Local Notifs,
 *      CapacitorHttp) are locked to sensible defaults tuned for this app.
 *   4. `webDir` points at `out/` where a minimal fallback HTML lives. The
 *      WebView never renders it under normal conditions — `server.url`
 *      takes over at launch — but Capacitor CLI requires the directory to
 *      exist for `cap sync` to succeed.
 *
 * KEY VARIABLES / EXPORTS:
 *   isDev        — true when NODE_ENV !== 'production'
 *   remoteUrl    — resolved remote origin for `server.url`
 *   config       — default export consumed by the Capacitor CLI
 *
 * DEPENDENCIES:
 *   @capacitor/cli               — CapacitorConfig type
 *   @capacitor/keyboard          — KeyboardResize enum
 *
 * LAST UPDATED: 2026-05-05 — overlaysWebView: true for iOS (Phase 3.5 status bar blending)
 *   and default backgroundColor for Android consistency.
 */
import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

const isDev = process.env.NODE_ENV !== 'production';

/*
 * Remote URL: the WebView always loads the deployed web app. Override via
 * CAP_REMOTE_URL only to aim a native build at a different origin (e.g.
 * prod, ngrok). Never set to empty — the app has no standalone mode.
 */
const remoteUrl = process.env.CAP_REMOTE_URL || 'https://www.dev-x3.cadabams.com/';

const config: CapacitorConfig = {
  appId: 'com.mindtalk.com',
  appName: 'MindTalk',
  // `out/` holds a minimal fallback page only — the WebView navigates to
  // `server.url` on launch and never renders this under normal conditions.
  webDir: 'out',
  ios: {
    preferredContentMode: 'mobile',
    limitsNavigationsToAppBoundDomains: false,
    // Only enable WebView debugging in dev — exposes the app to Safari/Chrome DevTools in prod otherwise
    webContentsDebuggingEnabled: isDev,
    scrollEnabled: true,
    allowsLinkPreview: false,
  },
  android: {
    webContentsDebuggingEnabled: isDev,
    // HTTPS-only: every supported remote origin is HTTPS, so mixed content stays off.
    allowMixedContent: false,
    captureInput: true,
  },
  plugins: {
    // Native HTTP client — bypasses WebView CORS and lets us add cert pinning later.
    CapacitorHttp: {
      enabled: true,
    },
    StatusBar: {
      overlaysWebView: true,
      style: 'LIGHT',
      backgroundColor: '#fffdf9',
    },
    Keyboard: {
      resize: KeyboardResize.Body,
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#E7590F',
      sound: 'beep.wav',
    },
    RazorpayCheckout: {
      enabled: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  server: {
    url: remoteUrl,
    cleartext: false,
  },
  loggingBehavior: isDev ? 'debug' : 'none',
};

export default config;
