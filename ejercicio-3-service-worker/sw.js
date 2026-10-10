// Ejercicio 3: ciclo de vida del Service Worker (sin caché todavía)
const SW_VERSION = "v1";

// 1) INSTALL: se dispara una vez por versión del script.
self.addEventListener("install", (event) => {
  console.log(`[SW ${SW_VERSION}] install`);
  self.skipWaiting(); // no esperar a que se cierren las pestañas viejas
});

// 2) ACTIVATE: el SW toma el control; ideal para limpiar recursos antiguos.
self.addEventListener("activate", (event) => {
  console.log(`[SW ${SW_VERSION}] activate`);
  event.waitUntil(self.clients.claim()); // controlar páginas abiertas de inmediato
});

// 3) FETCH: intercepta cada petición de las páginas bajo su scope.
self.addEventListener("fetch", (event) => {
  console.log(`[SW ${SW_VERSION}] fetch:`, event.request.method, event.request.url);
  // Sin respondWith(): el navegador resuelve la petición normalmente por red.
});
