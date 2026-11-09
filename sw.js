/* Service Worker - Interprete Ocean Allure: app instalable y offline */
const CACHE = 'ocean-interprete-v1';
const ACTIVOS = [
  './', './index.html', './estilos.css', './manifest.json', './sw.js',
  './src/app.js',
  './src/servicios/sesionTrabajadorServicio.js',
  './src/servicios/uiDinamicaServicio.js',
  './src/vistas/InicioTurnoView.js',
  './src/vistas/MenuOficioView.js',
  './src/vistas/TraductorView.js',
  './assets/logo-ocean-mark-white.svg',
  './assets/logo-ocean-mark.svg',
  './assets/favicon.svg',
  './assets/icon-app-192.png',
  './assets/icon-app-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ACTIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // Solo cachea el propio origen; las llamadas a APIs van siempre a red.
  if (new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const copia = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copia)).catch(() => {});
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
