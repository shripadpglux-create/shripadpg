// SripadPG PWA Service Worker v3.0 - Network-First for Navigation
const CACHE_NAME = "sripadpg-cache-v3";
const PRECACHE_ASSETS = [
  "/manifest.json",
  "/pwa-192x192.png",
  "/pwa-512x512.png",
  "/apple-touch-icon.png",
  "/favicon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("[SW] Deleting stale cache:", cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // 1. Skip backend API requests completely (Network Only)
  if (url.pathname.startsWith("/api/")) return;

  // 2. Navigation / HTML Document requests MUST use NETWORK-FIRST
  // This guarantees users always see the latest updated screen on initial launch (no stale flash)
  const isNavigation = event.request.mode === "navigate" || 
                       (event.request.headers.get("accept") && event.request.headers.get("accept").includes("text/html"));

  if (isNavigation) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // If offline / network fails, fallback to cached HTML
          const cached = await caches.match(event.request);
          if (cached) return cached;
          const fallback = await caches.match("/");
          if (fallback) return fallback;
          return new Response("Offline - Please check your internet connection.", {
            status: 503,
            headers: { "Content-Type": "text/plain" }
          });
        })
    );
    return;
  }

  // 3. Static Assets (Images, Icons, Fonts, Bundles)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => null);

      return cachedResponse || fetchPromise;
    })
  );
});
