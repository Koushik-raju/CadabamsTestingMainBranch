/* ============================================================
 * Cadabams Consult — Modern Service Worker
 *
 * Caching strategies:
 *   /_next/static/        → Cache-First  (immutable content-hashed bundles)
 *   /_next/image/         → Cache-First  (bounded, max MAX_IMAGE_ENTRIES)
 *   S3 / CDN images       → Cache-First  (bounded, max MAX_IMAGE_ENTRIES)
 *   /favicon* /logo* etc. → Cache-First  (static public assets)
 *   HTML navigation       → Network-First with stale-cache fallback
 *   API / other           → Network-Only (always fresh)
 *
 * Features:
 *   ✓ Versioned caches — stale caches auto-deleted on activate
 *   ✓ Background Sync — queued offline journal writes retried on reconnect
 *   ✓ Periodic Background Sync — periodic notification refresh signal
 *   ✓ Rich Push Notifications — icons, badges, vibration, action buttons
 *   ✓ App Badge API — unread count badge on the app icon
 *   ✓ Client Messaging — SKIP_WAITING, CLEAR_CACHE, SET_BADGE, CLEAR_BADGE
 *   ✓ Bounded image cache — trims oldest entries over the limit
 * ============================================================ */

const VERSION = 'v3';
const CACHES = {
  static: `cadabams-static-${VERSION}`,
  images: `cadabams-images-${VERSION}`,
  pages:  `cadabams-pages-${VERSION}`,
};

// Known caches — everything else gets deleted on activate
const KNOWN_CACHES = Object.values(CACHES);

const MAX_IMAGE_ENTRIES = 80;
const MAX_PAGE_ENTRIES  = 20;

// Background sync queue tag (matches what the app posts offline writes to)
const JOURNAL_SYNC_TAG = 'journal-sync';

// Periodic sync tag
const NOTIFICATIONS_SYNC_TAG = 'notifications-check';

// Image hostnames that get cached
const IMAGE_HOSTS = [
  'strapi-bucket-mindtalk-cadabams.s3.ap-south-1.amazonaws.com',
  'cadabams-v2-storage.s3.ap-south-1.amazonaws.com',
  'mindtalk-assets.s3.ap-south-1.amazonaws.com',
  'mindtalkbuddy.com',
  'admin.mindtalkbuddy.com',
  'crm.cadabams.com',
];


/* ── Install ────────────────────────────────────────────────── */

self.addEventListener('install', (event) => {
  // Activate immediately — don't wait for old tabs to close
  self.skipWaiting();

  event.waitUntil(
    // Pre-warm the page cache with the app shell start URL
    caches.open(CACHES.pages).then((cache) =>
      cache.add('/home').catch(() => { /* ignore if offline at install time */ })
    )
  );
});


/* ── Activate ───────────────────────────────────────────────── */

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Take control of all open pages immediately
      self.clients.claim(),

      // Delete any caches from old versions
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) => !KNOWN_CACHES.includes(key))
            .map((key) => caches.delete(key))
        )
      ),
    ])
  );
});


/* ── Fetch (routing + caching strategies) ───────────────────── */

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never intercept non-GET requests or chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') return;

  /* 1. Next.js immutable static bundles — Cache-First, keep forever */
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, CACHES.static));
    return;
  }

  /* 2. Next.js image optimisation endpoint + all S3/CDN image hosts — Cache-First, bounded */
  if (
    url.pathname.startsWith('/_next/image') ||
    url.pathname.match(/\.(png|jpg|jpeg|gif|webp|avif|svg|ico)$/) ||
    IMAGE_HOSTS.includes(url.hostname)
  ) {
    event.respondWith(cacheFirstBounded(request, CACHES.images, MAX_IMAGE_ENTRIES));
    return;
  }

  /* 3. Local static public assets — Cache-First */
  if (url.pathname.match(/\.(png|jpg|jpeg|gif|webp|avif|svg|ico|woff2|woff|ttf|json)$/) && url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request, CACHES.static));
    return;
  }

  /* 4. HTML navigation requests — Network-First with stale fallback */
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithFallback(request, CACHES.pages, MAX_PAGE_ENTRIES));
    return;
  }

  /* 5. Everything else (API calls, etc.) — Network-Only */
  // Intentionally fall through — browser handles it natively
});


/* ── Cache strategy helpers ─────────────────────────────────── */

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function cacheFirstBounded(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok || response.type === 'opaque') {
      cache.put(request, response.clone());
      trimCache(cache, maxEntries);
    }
    return response;
  } catch {
    return new Response('', { status: 408, statusText: 'Network Error' });
  }
}

async function networkFirstWithFallback(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
      trimCache(cache, maxEntries);
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    // Fall back to /home shell if nothing cached for this route
    return cached || (await cache.match('/home')) || new Response('Offline', { status: 503 });
  }
}

/*
 * Trim a cache down to maxEntries by deleting the oldest requests first.
 * Uses the cache's own key order (insertion order) as a proxy for age.
 */
async function trimCache(cache, maxEntries) {
  const keys = await cache.keys();
  if (keys.length > maxEntries) {
    const toDelete = keys.slice(0, keys.length - maxEntries);
    await Promise.all(toDelete.map((k) => cache.delete(k)));
  }
}


/* ── Background Sync ────────────────────────────────────────── */

self.addEventListener('sync', (event) => {
  if (event.tag === JOURNAL_SYNC_TAG) {
    // Signal all open clients to flush their offline journal queue
    event.waitUntil(broadcastToClients({ type: 'FLUSH_JOURNAL_QUEUE' }));
  }
});


/* ── Periodic Background Sync ───────────────────────────────── */

self.addEventListener('periodicsync', (event) => {
  if (event.tag === NOTIFICATIONS_SYNC_TAG) {
    // Wake the app (or signal an open tab) to refresh notifications
    event.waitUntil(broadcastToClients({ type: 'REFRESH_NOTIFICATIONS' }));
  }
});


/* ── Push Notifications ─────────────────────────────────────── */

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: 'Cadabams Consult', body: event.data?.text() ?? '' };
  }

  const {
    title = 'Cadabams Consult',
    body = '',
    icon = '/favicon.ico',
    badge = '/favicon.ico',
    tag,
    url = '/home',
    category = 'general',
    unreadCount,
  } = payload;

  // Category-specific action buttons
  const actions = getNotificationActions(category);

  const options = {
    body,
    icon,
    badge,
    tag: tag || `cadabams-${category}-${Date.now()}`,
    data: { url, category },
    actions,
    vibrate: [100, 50, 100],
    requireInteraction: category === 'appointment',
    silent: false,
    timestamp: Date.now(),
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, options),
      // Update app icon badge if an unread count is provided
      typeof unreadCount === 'number' && navigator.setAppBadge
        ? navigator.setAppBadge(unreadCount)
        : Promise.resolve(),
    ])
  );
});

function getNotificationActions(category) {
  switch (category) {
    case 'appointment':
      return [
        { action: 'view',    title: 'View Appointment' },
        { action: 'dismiss', title: 'Dismiss' },
      ];
    case 'chat':
      return [
        { action: 'reply',   title: 'Open Chat' },
        { action: 'dismiss', title: 'Dismiss' },
      ];
    case 'journal':
      return [
        { action: 'journal', title: 'Write Now' },
        { action: 'snooze',  title: 'Remind in 1h' },
      ];
    case 'assessment':
      return [
        { action: 'start',   title: 'Start Assessment' },
        { action: 'dismiss', title: 'Later' },
      ];
    default:
      return [{ action: 'open', title: 'Open App' }];
  }
}


/* ── Notification Click ─────────────────────────────────────── */

self.addEventListener('notificationclick', (event) => {
  const { notification, action } = event;
  const { url = '/home', category } = notification.data || {};

  notification.close();

  // Snooze: re-show the notification after 1 hour
  if (action === 'snooze') {
    event.waitUntil(
      new Promise((resolve) => {
        setTimeout(() => {
          self.registration.showNotification(notification.title, {
            ...notification,
            tag: `${notification.tag}-snoozed`,
          });
          resolve();
        }, 60 * 60 * 1000);
      })
    );
    return;
  }

  // Resolve destination URL from action
  const destination = resolveActionUrl(action, url, category);

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      // Focus an existing tab if one is already on that URL
      const match = allClients.find((c) => c.url.includes(destination));
      if (match) {
        await match.focus();
        match.postMessage({ type: 'NOTIFICATION_CLICKED', action, category, url: destination });
      } else {
        // No open tab — open a new window
        const newClient = await self.clients.openWindow(destination);
        // Post after a short tick so the page has time to mount its listener
        if (newClient) {
          setTimeout(() =>
            newClient.postMessage({ type: 'NOTIFICATION_CLICKED', action, category, url: destination }),
            500
          );
        }
      }
    })()
  );
});

function resolveActionUrl(action, defaultUrl, category) {
  if (!action || action === 'open' || action === 'view' || action === 'start') return defaultUrl;
  if (action === 'reply') return defaultUrl.includes('chat') ? defaultUrl : '/chat';
  if (action === 'journal') return '/self-journaling';
  return defaultUrl;
}


/* ── Notification Close (analytics hook) ────────────────────── */

self.addEventListener('notificationclose', (event) => {
  const { category } = event.notification.data || {};
  broadcastToClients({ type: 'NOTIFICATION_DISMISSED', category });
});


/* ── Client Messages ────────────────────────────────────────── */

self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};

  switch (type) {
    // Page posts SKIP_WAITING when a new SW is waiting — activates it immediately
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    // Clear a specific cache or all caches
    case 'CLEAR_CACHE': {
      const target = payload?.cache;
      const toDelete = target ? [target] : KNOWN_CACHES;
      event.waitUntil(Promise.all(toDelete.map((c) => caches.delete(c))));
      break;
    }

    // Set the app icon badge (unread count)
    case 'SET_BADGE':
      if (navigator.setAppBadge && typeof payload?.count === 'number') {
        event.waitUntil(navigator.setAppBadge(payload.count));
      }
      break;

    // Clear the app icon badge
    case 'CLEAR_BADGE':
      if (navigator.clearAppBadge) {
        event.waitUntil(navigator.clearAppBadge());
      }
      break;

    // Legacy journal reminder — kept for backwards-compat
    case 'journal-reminder-clicked':
      broadcastToClients({ type: 'NOTIFICATION_CLICKED', category: 'journal', url: '/self-journaling' });
      break;
  }
});


/* ── Utility ────────────────────────────────────────────────── */

async function broadcastToClients(message) {
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  clients.forEach((client) => client.postMessage(message));
}
