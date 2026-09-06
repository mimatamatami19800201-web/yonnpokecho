const CACHE = 'yonnpokecho-v2';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );

  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE)
          .map(key => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const request = event.request;

  /*
   * HTMLは毎回ネットから最新を取得する。
   * 古いindex.htmlをService Workerから返さない。
   */
  if (
    request.method === 'GET' &&
    request.destination === 'document'
  ) {
    event.respondWith(
      fetch(request, {
        cache: 'no-store'
      }).catch(() =>
        caches.match(request)
      )
    );

    return;
  }

  /*
   * その他のファイルは通常のキャッシュを利用。
   */
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) {
        return cached;
      }

      return fetch(request).then(response => {
        if (
          !response ||
          response.status !== 200 ||
          response.type === 'opaque'
        ) {
          return response;
        }

        const copy = response.clone();

        caches.open(CACHE).then(cache => {
          cache.put(request, copy);
        });

        return response;
      });
    })
  );
});
