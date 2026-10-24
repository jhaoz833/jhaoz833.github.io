/* 浮岛 Service Worker：静态资源缓存优先，页面网络优先 + 离线回退 */
const VERSION = "fudao-v2";
const CORE = ["/", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // giscus / GitHub API 不缓存

  // 页面导航：网络优先，失败回退缓存（离线开壳）
  if (req.mode === "navigate") {
    event.respondWith(
      // no-store：避免浏览器 HTTP 缓存把旧 HTML 交给新构建（旧 chunk 已不存在会白屏）
      fetch(req, { cache: "no-store" })
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match("/")))
    );
    return;
  }

  // 静态资源：缓存优先（含音乐，离线可听）
  if (/^\/(_next\/static|images|music|videos|icons)\//.test(url.pathname) || url.pathname === "/icon.svg") {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copy));
            return res;
          })
      )
    );
  }
});
