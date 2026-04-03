/* Basic Service Worker for local notifications */

self.addEventListener('install', (event) => {
  // Activate immediately so notifications can be scheduled right away
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Become the active service worker for the page
  event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const urlToOpen = notification?.data?.url || '/self-journaling';

  event.notification.close();

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      const client = allClients.find((c) => c.url.includes(urlToOpen));
      if (client) {
        await client.focus();
        client.postMessage({ type: 'journal-reminder-clicked' });
      } else {
        await self.clients.openWindow(urlToOpen);
      }
    })()
  );
});
