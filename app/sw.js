// Service worker: offline operation (the last forecast is kept in the app's localStorage).
// After changing app files, bump CACHE_VERSION and the ?v= values (here and in index.html).
importScripts('config.js');
const CACHE_VERSION = 'fpv-wind-1';
const SCOPE = self.registration.scope;                       // directory the worker controls, always with a trailing slash
const SCOPE_PATH = new URL(SCOPE).pathname;
const API_URL = new URL(self.FPV_WIND_CONFIG.apiUrl, SCOPE);
const ASSETS = ['./', 'config.js', 'app.css?v=1', 'app.js?v=1', 'manifest.json', 'icons/icon-192.png'].map((p) => new URL(p, SCOPE).href);
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE_VERSION).then((c) => c.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== CACHE_VERSION).map((x) => caches.delete(x)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || !u.pathname.startsWith(SCOPE_PATH) || (u.origin === API_URL.origin && u.pathname.startsWith(API_URL.pathname))) return;
  // network first (fresh version), offline: cached copy
  e.respondWith(fetch(e.request).then((r) => {
    if (r.ok) { const k = r.clone(); caches.open(CACHE_VERSION).then((c) => c.put(e.request, k)); }
    return r;
  }).catch(() => caches.match(e.request).then((r) => r || caches.match(SCOPE))));
});
