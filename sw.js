/* EVA 驾驶员终端 ▸ Service Worker：全量缓存，装完可离线 */
var CACHE = 'eva-terminal-v16';
/* 解析 sharecode：有则拼查询串，无则空串（GitHub Pages 这类无门禁环境） */
var _scm = self.location.search.match(/sharecode=([A-Za-z0-9]+)/);
var SC = _scm ? ('?sharecode=' + _scm[1]) : '';
var ASSETS = ['./index.html' + SC, './manifest.webmanifest' + SC, './icon-192.png' + SC,
              './icon-512.png' + SC, './vendor/gif.js' + SC, './vendor/gif.worker.js' + SC];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') { return; }
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(function (hit) {
      return hit || fetch(e.request).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { try { c.put(e.request, copy); } catch (err) {} });
        return res;
      }).catch(function () { return caches.match('./index.html') || caches.match('./index.html' + SC); });
    })
  );
});
