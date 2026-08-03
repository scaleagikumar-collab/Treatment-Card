/* Treatment Card — service worker
   Purpose: the app must open at 3am with no signal, on a phone that has been
   offline for days. Everything it needs is cached on first visit and served
   from the cache thereafter.

   BUMP THE VERSION whenever you deploy a change, or returning users keep the
   old cached copy. That is the one maintenance rule here. */

var VERSION = "tc-2026-07-28-2";

var SHELL = [
  "./",
  "./app.html",
  "./index.html",
  "./manifest.json",
  "./fonts/jakarta-400.woff2",
  "./fonts/jakarta-500.woff2",
  "./fonts/jakarta-600.woff2",
  "./fonts/jakarta-700.woff2",
  "./fonts/jakarta-800.woff2",
  "./fonts/plex-mono-400.woff2",
  "./fonts/plex-mono-500.woff2",
  "./fonts/plex-mono-600.woff2",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];

/* Atkinson is only fetched if a reader turns on clearer letterforms, so it is
   cached opportunistically rather than up front. */

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(VERSION).then(function (c) {
      /* addAll fails the whole install if any single file 404s. Add them
         individually so one missing font never leaves the app uncached. */
      return Promise.all(
        SHELL.map(function (url) {
          return c.add(url)["catch"](function () {
            return null;
          });
        })
      );
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (k) {
          return k === VERSION ? null : caches["delete"](k);
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;

  var url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return;

  /* HTML: try the network first so a deployed update is picked up straight
     away, but fall back to the cache the moment the network is unavailable. */
  var wantsHtml = req.mode === "navigate" ||
    (req.headers.get("accept") || "").indexOf("text/html") >= 0;

  if (wantsHtml) {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(VERSION).then(function (c) { c.put(req, copy); });
        return res;
      })["catch"](function () {
        return caches.match(req).then(function (hit) {
          return hit || caches.match("./app.html") || caches.match("./index.html");
        });
      })
    );
    return;
  }

  /* Everything else (fonts, icons): cache first — they never change without a
     version bump, and this is what makes a cold offline start instant. */
  e.respondWith(
    caches.match(req).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        if (res && res.status === 200 && res.type === "basic") {
          var copy = res.clone();
          caches.open(VERSION).then(function (c) { c.put(req, copy); });
        }
        return res;
      })["catch"](function () {
        return hit;
      });
    })
  );
});
