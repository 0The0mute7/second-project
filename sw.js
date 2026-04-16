const CACHE_NAME = 'beyond40-v1';
const assets = [
  '/',
  'index.html',
  'style.css',
  'utilities.css',
  'js/main.js', // Make sure this matches your actual folder path!
  'beyond40-logo.png' // Changed this to match your <img> tag src
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(assets);
    })
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => {
      return response || fetch(e.request);
    })
  );
});