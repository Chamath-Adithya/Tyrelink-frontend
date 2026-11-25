/* Tyrelink Lightweight Offline & Low-Internet Service Worker */
const STATIC_CACHE = 'tyrelink-static-v3';
const DATA_CACHE = 'tyrelink-data-v3';

// Auto-cleanup for local development environments
if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
  self.addEventListener('install', () => self.skipWaiting());
  self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches.keys()
        .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
        .then(() => self.registration.unregister())
        .then(() => self.clients.claim())
    );
  });
}

const PRECACHE_URLS = [
  '/',
  '/shop',
  '/hero-tyre.png',
  '/branding/logo-mark.svg',
  '/branding/tyrelink-logo-official.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== STATIC_CACHE && k !== DATA_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isPublicApiCacheable(url) {
  return (
    url.pathname.startsWith('/v1/products') ||
    url.pathname === '/v1/delivery-rates' ||
    url.pathname === '/v1/campaigns'
  );
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin && !url.pathname.startsWith('/v1/')) {
    // Allow Unsplash / font CDN assets to pass through cleanly without SW blocking
    return;
  }

  // Never cache admin, auth, or private endpoints
  if (url.pathname.startsWith('/v1/admin') || url.pathname.startsWith('/admin') || url.pathname.startsWith('/merchant')) {
    return;
  }

  // Stale-while-revalidate for public read API endpoints (instant catalog on flaky 2G/3G)
  if (isPublicApiCacheable(url)) {
    event.respondWith(
      caches.open(DATA_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        const networkPromise = fetch(req)
          .then((res) => {
            if (res && res.ok) cache.put(req, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || networkPromise;
      })
    );
    return;
  }

  // Stale-while-revalidate for local static images & branding only (let browser fetch latest /_astro/ hashed JS/CSS)
  if (
    url.pathname.startsWith('/images/') ||
    url.pathname.startsWith('/branding/') ||
    url.pathname.startsWith('/hero-tyre')
  ) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        const networkPromise = fetch(req)
          .then((res) => {
            if (res && res.ok) cache.put(req, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || networkPromise;
      })
    );
    return;
  }

  // Network-first with cache fallback for HTML navigations
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req).then((c) => c || caches.match('/')))
    );
  }
});

