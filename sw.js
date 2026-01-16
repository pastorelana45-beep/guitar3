
const CACHE_NAME = 'multistudio-s24-v3';
const CORE_ASSETS = [
  './',
  './index.html',
  './index.tsx',
  './App.tsx',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(
      ks.map(k => k !== CACHE_NAME && caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  
  e.respondWith(
    caches.match(e.request).then(cached => {
      const networked = fetch(e.request)
        .then(res => {
          const cacheCopy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, cacheCopy));
          return res;
        })
        .catch(() => cached);
      return cached || networked;
    })
  );
});
