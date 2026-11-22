/* AgriVerse AI service worker — offline mode.
   Bump VERSION whenever you want every device to throw away its old cache. */
const VERSION = 'v1';
const SHELL = 'agriverse-shell-' + VERSION;   // our own files
const LIBS  = 'agriverse-libs-' + VERSION;    // Three.js, Leaflet, fonts, background photo
const TILES = 'agriverse-tiles-' + VERSION;   // map tiles the farmer has looked at
const API   = 'agriverse-api-' + VERSION;     // last known /api/state and /api/weather per user
const ALL = [SHELL, LIBS, TILES, API];

const SHELL_FILES = [
  '/', '/index.html', '/style.css', '/lessons.css',
  '/script.js', '/knowledge.js', '/diseases.js', '/investor.js', '/lessons.js',
  '/lang-am.js', '/lang-ti.js', '/lang-ti-content.js', '/lang-om.js', '/i18n.js', '/pwa.js',
  '/manifest.webmanifest',
  '/icons/icon-192.png', '/icons/icon-512.png', '/icons/apple-touch-icon.png', '/icons/favicon-32.png'
];

// Libraries the pages need. Cached on install if online, otherwise on first use.
const LIB_FILES = [
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
];

const LIB_HOSTS = ['cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com', 'commons.wikimedia.org', 'upload.wikimedia.org'];
const TILE_HOSTS = ['tile.openstreetmap.org', 'clarity.maptiles.arcgis.com', 'server.arcgisonline.com'];
const MAX_TILES = 400;
const NETWORK_TIMEOUT = 4000; // ms — on weak rural connections fall back to the saved copy quickly

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const shell = await caches.open(SHELL);
    await shell.addAll(SHELL_FILES.map(u => new Request(u, { cache: 'reload' })));
    const libs = await caches.open(LIBS);
    await Promise.allSettled(LIB_FILES.map(u => libs.add(u)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(n => n.startsWith('agriverse-') && !ALL.includes(n)).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  const d = event.data || {};
  if (d.type === 'CLEAR_API') event.waitUntil(caches.delete(API));   // on log out: don't leave a user's data on a shared phone
  if (d.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;                       // never touch POSTs (buy, offers, profile...)
  const url = new URL(req.url);

  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith('/api/')) {
      if (url.pathname === '/api/state' || url.pathname === '/api/weather') event.respondWith(apiNetworkFirst(req, url));
      return;                                             // other API calls go straight to the network
    }
    if (url.pathname === '/sw.js') return;
    event.respondWith(shellNetworkFirst(req));
    return;
  }

  if (LIB_HOSTS.includes(url.hostname)) { event.respondWith(cacheFirst(req, LIBS)); return; }
  if (TILE_HOSTS.includes(url.hostname)) { event.respondWith(tiles(req)); return; }
});

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(v => { clearTimeout(t); resolve(v); }, e => { clearTimeout(t); reject(e); });
  });
}

// Our own pages & scripts: always the newest when the network is good, saved copy when it is not.
async function shellNetworkFirst(req) {
  const cache = await caches.open(SHELL);
  try {
    const res = await withTimeout(fetch(req), NETWORK_TIMEOUT);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    if (req.mode === 'navigate') {                         // single-page app: any page opens the app
      const index = await cache.match('/index.html') || await cache.match('/');
      if (index) return index;
    }
    return new Response('You are offline and this page was not saved yet.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
}

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
    return res;
  } catch {
    return Response.error();
  }
}

async function tiles(req) {
  const cache = await caches.open(TILES);
  const hit = await cache.match(req);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res && (res.ok || res.type === 'opaque')) {
      cache.put(req, res.clone());
      trim(cache, MAX_TILES);
    }
    return res;
  } catch {
    return Response.error();                                // Leaflet just shows grey for tiles we never saw
  }
}

async function trim(cache, max) {
  const keys = await cache.keys();
  if (keys.length > max) await Promise.all(keys.slice(0, keys.length - max).map(k => cache.delete(k)));
}

// Saved data is keyed by a hash of the login token, so two people sharing one phone never see each other's data.
async function userKey(req, url) {
  const auth = req.headers.get('Authorization') || '';
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(auth));
  const h = Array.from(new Uint8Array(buf)).slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('');
  const k = new URL(self.location.origin + '/__cache' + url.pathname + url.search);
  k.searchParams.set('u', h);                               // (a #fragment would be ignored by the cache, so use a query value)
  return new Request(k.href);
}

async function apiNetworkFirst(req, url) {
  const cache = await caches.open(API);
  const key = await userKey(req, url);
  try {
    const res = await withTimeout(fetch(req), NETWORK_TIMEOUT + 4000);
    if (res.ok) {
      cache.put(key, res.clone());
      return res;
    }
    return res;                                             // 401 etc: pass through so the app can react
  } catch {
    const hit = await cache.match(key);
    if (hit) {
      const headers = new Headers(hit.headers);
      headers.set('X-From-Offline-Cache', '1');
      return new Response(await hit.blob(), { status: 200, headers });
    }
    return new Response(JSON.stringify({ error: 'You are offline and nothing is saved yet.', offline: true }), {
      status: 503, headers: { 'Content-Type': 'application/json' }
    });
  }
}
