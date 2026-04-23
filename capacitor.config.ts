import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

const isDev = process.env.NODE_ENV !== 'production';

const config: CapacitorConfig = {
  appId: 'com.mindtalk.com',
  appName: 'MindTalk',
  webDir: 'out',
  ios: {
    preferredContentMode: 'mobile',
    limitsNavigationsToAppBoundDomains: false,
    // Only enable WebView debugging in dev — exposes the app to Chrome DevTools in prod otherwise
    webContentsDebuggingEnabled: isDev,
    scrollEnabled: true,
    allowsLinkPreview: false,
  },
  android: {
    webContentsDebuggingEnabled: isDev,
    allowMixedContent: true,
    captureInput: true,
  },
  plugins: {
    StatusBar: {
      overlaysWebView: false,
      style: 'LIGHT',
      backgroundColor: '#FFFFFF',
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
    url: 'https://consult.cadabams.com/',
    cleartext: false,
  },
  loggingBehavior: isDev ? 'debug' : 'none',
};

export default config;
