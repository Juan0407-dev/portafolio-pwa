// Ejercicio 5: Cache-First + fallback "Modo Sin Conexión"
const CACHE_NAME = "cuaderno-shell-v3";
const OFFLINE_URL = "./offline.html";
const APP_SHELL = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/app.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./offline.html"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(async (cached) => {
      if (cached) return cached; // 1) caché

      try {
        return await fetch(event.request); // 2) red
      } catch (error) {
        // 3) Falló la red y no está en caché
        if (event.request.mode === "navigate") {
          return caches.match(OFFLINE_URL); // página completa -> vista offline
        }
        return new Response("Recurso no disponible sin conexión", {
          status: 503,
          statusText: "Service Unavailable",
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }
    })
  );
});
