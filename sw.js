const CACHE_NAME = "sam-pet-v27";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./products.csv"
];

// Cài đặt: cache các file tĩnh
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Kích hoạt: xóa cache cũ
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first cho assets tĩnh, network-first cho API
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Luôn dùng network cho Google Apps Script (không cache API)
  if (url.hostname === "script.google.com") {
    e.respondWith(fetch(e.request).catch(() => new Response(
      JSON.stringify({ status: "error", message: "Offline" }),
      { headers: { "Content-Type": "application/json" } }
    )));
    return;
  }

  // Cache-first cho mọi thứ còn lại
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((res) => {
        // Cache response mới nếu là GET thành công
        if (e.request.method === "GET" && res.status === 200) {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, resClone));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
