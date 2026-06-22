/* DAWF Hub — service worker (offline-first shell, network-first for everything else) */
const CACHE = "dawf-shell-v7.0.0";
const SHELL = [
  "./",
  "./index.html",
  "./clean.html", "./etl.html", "./pivot.html", "./dashboard.html",
  "./sql.html", "./analyst.html", "./forecast.html", "./viz.html",
  "./report.html", "./governance.html", "./brand.html",
  "./learn.html", "./settings.html",
  "./css/style.css",
  "./js/core.js", "./js/ui.js",
  "./manifest.json"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  // network-first for CDN libs, cache-first for own shell
  const isShell = SHELL.some(s => req.url.endsWith(s.replace("./", "")) || req.url.endsWith(s));
  if (isShell) {
    e.respondWith(caches.match(req).then(r => r || fetch(req)));
  } else {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(req))
    );
  }
});
