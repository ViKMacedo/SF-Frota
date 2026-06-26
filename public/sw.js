const CACHE_NAME = "sf-frota-v1";
const STATIC_ASSETS = ["/", "/login", "/offline"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Nunca intercepta APIs
  if (url.pathname.startsWith("/api/")) return;

  // Nunca intercepta recursos externos
  if (url.origin !== self.location.origin) return;

  // Assets estáticos do Next.js (_next/static) — Cache First
  // São imutáveis (têm hash no nome), pode cachear forever
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        });
      }),
    );
    return;
  }

  // Páginas de navegação — Network First com fallback para cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (request.mode === "navigate" && response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));

          // Quando navegar para /login, avisa para limpar sessão
          if (url.pathname === "/login") {
            self.clients.matchAll({ type: "window" }).then((clients) => {
              clients.forEach((client) =>
                client.postMessage({ type: "CLEAR_SESSION" }),
              );
            });
          }
        }
        return response;
      })
      .catch(() => {
        return caches
          .match(request)
          .then((cached) => cached ?? caches.match("/offline"));
      }),
  );
});
