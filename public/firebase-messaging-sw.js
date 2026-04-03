// Firebase Web Messaging Service Worker
// This file must live at the site root (public/) to receive background messages

importScripts(
  'https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js'
);
importScripts(
  'https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js'
);

// IMPORTANT: This config is public. It mirrors production firebaseConfig
// See constants/apiEndpoints for the same values
firebase.initializeApp({
  apiKey: 'AIzaSyAMA1XVByemL722onXugcZZwCFKIXPwILQ',
  authDomain: 'cadabamshospitals-a7d3b.firebaseapp.com',
  projectId: 'cadabamshospitals-a7d3b',
  storageBucket: 'cadabamshospitals-a7d3b.appspot.com',
  messagingSenderId: '467712032994',
  appId: '1:467712032994:web:8fcb9eaa53b7c7b68a9ebb',
  measurementId: 'G-L7C1V92S79',
  databaseURL: 'https://cadabamshospitals-a7d3b-default-rtdb.firebaseio.com',
});

const messaging = firebase.messaging();

console.log('🔥 [SW] Firebase Messaging Service Worker initialized');

// Handle background messages
messaging.onBackgroundMessage(function (payload) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔔 [SW] BACKGROUND MESSAGE RECEIVED!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📦 [SW] Full payload:', payload);
  console.log('📋 [SW] Notification:', payload.notification);
  console.log('📊 [SW] Data:', payload.data);
  console.log('⏰ [SW] Received at:', new Date().toLocaleString());

  // Customize and show a notification
  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || '',
    data: payload.data || {},
    icon: '/icons/icon-192.webp',
    badge: '/icons/icon-72.webp',
    tag: payload.messageId || Date.now().toString(),
    requireInteraction: false,
  };

  console.log('✅ [SW] Showing notification with title:', notificationTitle);
  console.log('📝 [SW] Notification options:', notificationOptions);

  self.registration
    .showNotification(notificationTitle, notificationOptions)
    .then(() => {
      console.log('✅ [SW] Background notification displayed successfully!');
    })
    .catch((error) => {
      console.error('❌ [SW] Error showing notification:', error);
    });
});

self.addEventListener('notificationclick', function (event) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👆 [SW] NOTIFICATION CLICKED!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 [SW] Notification data:', event.notification);
  console.log('📊 [SW] Data payload:', event.notification.data);

  const action = event.notification?.data?.action;
  console.log('🔗 [SW] Action URL:', action);

  if (action) {
    console.log('🌐 [SW] Opening URL:', action);
    event.waitUntil(self.clients.openWindow(action));
  } else {
    console.log('📱 [SW] No action URL, focusing app window');
    // Focus the app if no action URL
    event.waitUntil(
      self.clients
        .matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          if (clientList.length > 0) {
            console.log(
              '✅ [SW] Found',
              clientList.length,
              'open windows, focusing first'
            );
            return clientList[0].focus();
          }
          console.log('📂 [SW] No open windows found');
          return null;
        })
    );
  }

  event.notification.close();
  console.log('✅ [SW] Notification closed');
});

// Log service worker activation
self.addEventListener('activate', (event) => {
  console.log('🚀 [SW] Service Worker activated!');
});

// Log service worker installation
self.addEventListener('install', (event) => {
  console.log('📥 [SW] Service Worker installing...');
  self.skipWaiting();
});

// Log when SW takes control
self.addEventListener('message', (event) => {
  console.log('📨 [SW] Message received:', event.data);
});

console.log('✅ [SW] All event listeners registered');
