const ENV = (process.env.NEXT_PUBLIC_ENV as 'development' | 'production') ?? 'production';

const baseConfig = {
  BEARER_TOKEN: process.env.NEXT_PUBLIC_BEARER_TOKEN ?? 'haMdbrivrvkBfviurhDVviuhgrnfrhHFhgjf99G99uihbyrgJybfhrbf',
  zegoCloudUrl: process.env.NEXT_PUBLIC_ZEGO_URL ?? 'https://next-video-call-demo-six.vercel.app',
};

const envConfigs = {
  development: {
    BASE_URL: process.env.NEXT_PUBLIC_BASE_URL ?? 'https://dev-cadambams-crm.p7devs.com',
    BASE_URL_HOS: process.env.NEXT_PUBLIC_BASE_URL_HOS ?? 'https://dev-cadambams-hos.p7devs.com',
    BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL ?? 'https://staging-api.cadabams.com',
    RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? 'rzp_test_Ou8P829VSfUh1E',

    ConsumerKey: process.env.NEXT_PUBLIC_CONSUMER_KEY ?? 'j5r7K9FLCRbuli9w4Z4Ddyq6pnYY1ooc',
    ConsumerSecret: process.env.CONSUMER_SECRET ?? '1TsoADkdRqCcdi6gfZTarAx0pXaey5Pr',
    AccessToken: process.env.ACCESS_TOKEN ?? 'IK4BaunTMgBRk9J9wVLsUZW4eHjPZyYY',
    TokenSecret: process.env.TOKEN_SECRET ?? 'POwMpxRHniIwmb3ziothQf96LhiNfRvb',

    HOS_ConsumerKey: process.env.NEXT_PUBLIC_HOS_CONSUMER_KEY ?? '0mj3DFFhWpc3WsAMIUyaOpsyh5ei7NTZ',
    HOS_ConsumerSecret: process.env.HOS_CONSUMER_SECRET ?? 'jHsjVmy7uZkj2qVpzamOQoXaOi8w3Fya',
    HOS_AccessToken: process.env.HOS_ACCESS_TOKEN ?? 't9tKlNNfeMl4GFOr82SCvzjqxoWm20mx',
    HOS_TokenSecret: process.env.HOS_TOKEN_SECRET ?? 'v2r119adoPDpjczIcvs7Xt0XrktfTZtn',

    firebaseConfig: {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? 'AIzaSyC_02cU1Juexd7PELLcj1zgzTs2ilc71V8',
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'mindtalk-hospital-staging.firebaseapp.com',
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'mindtalk-hospital-staging',
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'mindtalk-hospital-staging.firebasestorage.app',
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '1062765425253',
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '1:1062765425253:web:f854ca5da62fa9d5764c8c',
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? 'G-XYHXGY97YX',
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ?? 'https://mindtalk-hospital-staging-default-rtdb.asia-southeast1.firebasedatabase.app',
      WEB_FCM_VAPID_KEY: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ?? 'BN3_KXCfD8wcsQkBZMeUJzzdFrYHIYkZxogDuKoTqbrzfGQU8KwI7h9moAz0sy2sRsd0Mz-N2dQRVjoup3c7ubU',
    },
  },

  production: {
    BASE_URL: process.env.NEXT_PUBLIC_BASE_URL ?? 'https://crm.cadabams.com',
    BASE_URL_HOS: process.env.NEXT_PUBLIC_BASE_URL_HOS ?? 'https://hospital.cadabams.com',
    BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL ?? 'https://api.cadabams.com',
    RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? 'rzp_live_TbfeDut5Cuw7EK',

    ConsumerKey: process.env.NEXT_PUBLIC_CONSUMER_KEY ?? 'j5r7K9FLCRbuli9w4Z4Ddyq6pnYY1ooc',
    ConsumerSecret: process.env.CONSUMER_SECRET ?? '1TsoADkdRqCcdi6gfZTarAx0pXaey5Pr',
    AccessToken: process.env.ACCESS_TOKEN ?? 'IK4BaunTMgBRk9J9wVLsUZW4eHjPZyYY',
    TokenSecret: process.env.TOKEN_SECRET ?? 'POwMpxRHniIwmb3ziothQf96LhiNfRvb',

    HOS_ConsumerKey: process.env.NEXT_PUBLIC_HOS_CONSUMER_KEY ?? '43SDHXPQK14joipBXPAx3MU7vlFW9qr5',
    HOS_ConsumerSecret: process.env.HOS_CONSUMER_SECRET ?? 'iiZ0rF79KVP97dajC1BVv2X12KuddcrB',
    HOS_AccessToken: process.env.HOS_ACCESS_TOKEN ?? 'YFbGJpu2a3cEsW6w9Y7q17KMQV22xZji',
    HOS_TokenSecret: process.env.HOS_TOKEN_SECRET ?? 'LCx4l5LaFdWw4eNUu0Y1zuA3EfZid5V7',

    firebaseConfig: {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? 'AIzaSyAMA1XVByemL722onXugcZZwCFKIXPwILQ',
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'cadabamshospitals-a7d3b.firebaseapp.com',
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'cadabamshospitals-a7d3b',
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'cadabamshospitals-a7d3b.appspot.com',
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '467712032994',
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '1:467712032994:web:8fcb9eaa53b7c7b68a9ebb',
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? 'G-L7C1V92S79',
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ?? 'https://cadabamshospitals-a7d3b-default-rtdb.firebaseio.com',
      WEB_FCM_VAPID_KEY: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ?? 'BN3_KXCfD8wcsQkBZMeUJzzdFrYHIYkZxogDuKoTqbrzfGQU8KwI7h9moAz0sy2sRsd0Mz-N2dQRVjoup3c7ubU',
    },
  },
};

const envConfig = envConfigs[ENV];

export const appConfig = {
  ...baseConfig,
  ...envConfig,
  OAuthSignature: `${envConfig.ConsumerSecret}%26${envConfig.TokenSecret}`,
};

export const {
  BASE_URL,
  BASE_URL_HOS,
  BACKEND_URL,
  RAZORPAY_KEY_ID,
  BEARER_TOKEN,
  ConsumerKey,
  ConsumerSecret,
  AccessToken,
  TokenSecret,
  OAuthSignature,
  HOS_ConsumerKey,
  HOS_ConsumerSecret,
  HOS_AccessToken,
  HOS_TokenSecret,
  zegoCloudUrl,
  firebaseConfig,
} = appConfig;
