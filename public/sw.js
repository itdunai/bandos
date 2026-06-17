const CACHE = "bandos-v2";
const OFFLINE_URLS = ["/", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(OFFLINE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isPlayRoute = /\/play(\/|$)/.test(url.pathname);

  if (request.mode === "navigate" && isPlayRoute) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => {
            if (cached) return cached;
            return new Response(
              "<!DOCTYPE html><html lang='ru'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>BandOS — офлайн</title><style>body{font-family:system-ui,sans-serif;background:#0d0d0f;color:#f0f0f4;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px;text-align:center}p{color:#9090a8;max-width:320px;line-height:1.5}</style></head><body><div><h1>Нет сети</h1><p>Откройте раздел «Офлайн-сет-листы» в режиме «Играем» — если вы уже сохраняли сет-лист ранее.</p></div></body></html>",
              {
                status: 200,
                headers: { "Content-Type": "text/html; charset=utf-8" },
              }
            );
          })
        )
    );
    return;
  }

  if (OFFLINE_URLS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
  }
});
