// Service worker minimale per la PWA BASE (vista PR).
// Scopo: rendere l'app installabile e velocizzarne l'avvio mettendo in cache
// il "guscio" (index.html + icone). NON tocca le chiamate al backend Apps
// Script (sono POST cross-origin): quelle passano sempre dalla rete.
const CACHE = 'base-pr-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  // Ignora tutto ciò che non è un GET dalla stessa origine: così le chiamate
  // POST al backend Apps Script (altra origine) non vengono mai intercettate.
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  // Network-first: prova la rete (per avere sempre l'ultima versione), e se
  // offline ripiega sulla copia in cache; per la navigazione torna index.html.
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
  );
});
