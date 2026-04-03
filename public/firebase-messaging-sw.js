// Firebase Web Messaging Service Worker
// This file must live at the site root (public/) to receive background FCM messages

importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

// NOTE: Firebase config here is intentionally public — it is the same as
// the production firebaseConfig in config/env.ts
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

messaging.onBackgroundMessage(function (payload) {
  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || '',
    data: payload.data || {},
    icon: '/icons/icon-192.webp',
    badge: '/icons/icon-72.webp',
    tag: payload.messageId || Date.now().toString(),
    requireInteraction: false,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function (event) {
  const action = event.notification?.data?.action;

  if (action) {
    event.waitUntil(self.clients.openWindow(action));
  } else {
    event.waitUntil(
      self.clients
        .matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          if (clientList.length > 0) return clientList[0].focus();
          return null;
        })
    );
  }

  event.notification.close();
});

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
