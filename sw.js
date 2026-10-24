/* Материнский коллапс — service worker: офлайн-кэш. Версия кэша меняется при каждой сборке. */
var CACHE = 'mc-159f9a37c8';
var ASSETS = ['./', './index.html'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('mc-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    /* только своя страница: другие страницы сайта (другие приложения) не трогаем */
    var scope = new URL(self.registration.scope).pathname;
    if (url.pathname !== scope && url.pathname !== scope + 'index.html') return;
    /* сначала кэш (мгновенно и без сети), в фоне — обновление */
    e.respondWith(caches.open(CACHE).then(function (c) {
      return c.match('./index.html').then(function (hit) {
        var net = fetch(req).then(function (r) { if (r && r.ok) c.put('./index.html', r.clone()); return r; }).catch(function () { return null; });
        return hit || net.then(function (r) { return r || c.match('./'); });
      });
    }));
    return;
  }
  e.respondWith(caches.match(req).then(function (hit) { return hit || fetch(req); }));
});
