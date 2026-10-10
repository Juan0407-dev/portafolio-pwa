// Ejercicio 4: Cache API + estrategia Cache-First
const CACHE_NAME = "cuaderno-shell-v2";
const APP_SHELL = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/app.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

// INSTALL: abre la caché y guarda los recursos estáticos del App Shell.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Guardando App Shell en caché");
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

// ACTIVATE: elimina cachés de versiones anteriores.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// FETCH: Cache-First -> primero caché, si no existe consulta la red.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        console.log("[SW] Desde caché:", event.request.url);
        return cached;
      }
      console.log("[SW] Desde red:", event.request.url);
      return fetch(event.request);
    })
  );
});
