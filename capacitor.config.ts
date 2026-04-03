import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'com.mindtalk.com',
  appName: 'MindTalk',
  webDir: 'out',
  ios: {
    preferredContentMode: 'mobile',
    limitsNavigationsToAppBoundDomains: false,
    webContentsDebuggingEnabled: true,
    scrollEnabled: true,
    allowsLinkPreview: false,
  },
  android: {
    webContentsDebuggingEnabled: true,
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
  loggingBehavior: 'debug',
};

export default config;
