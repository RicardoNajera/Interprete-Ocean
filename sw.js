/* Service Worker - Interprete Ocean Allure: app instalable y offline */
const CACHE = 'ocean-interprete-v5';
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
  './assets/icon-app-512.png', './assets/icon-maskable-192.png', './assets/icon-maskable-512.png', './assets/icon-apple-180.png'
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

  const url = new URL(req.url);
  const esDocumento = req.mode === 'navigate' || /\.(html|js|css|json)$/.test(url.pathname);
  const esForzado = url.searchParams.has('v');

  // Si viene con ?v= (actualización forzada), se ignora la caché por completo.
  if (esForzado) {
    e.respondWith(fetch(req).catch(() => caches.match('./index.html')));
    return;
  }

  // Red primero para HTML/JS/CSS: así una nueva versión se ve al instante.
  if (esDocumento) {
    e.respondWith(
      fetch(req).then((res) => {
        const copia = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copia)).catch(() => {});
        return res;
      }).catch(() => caches.match(req).then((hit) => hit || caches.match('./index.html')))
    );
    return;
  }

  // Recursos estáticos (logos, íconos): caché primero.
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const copia = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copia)).catch(() => {});
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
