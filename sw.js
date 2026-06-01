self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('cekih-store').then((cache) => {
      return cache.addAll(['/', '/index.html', '/app.js', '/logo.png', '/0.mp3']);
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});
