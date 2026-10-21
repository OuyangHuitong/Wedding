// 备婚工作台 · 离线缓存
// 作用：把你打开的整个 App 存进手机里，之后没网、断线、微信里点开都能直接用
const CACHE = 'wedding-app-v1';
const SHELL = ['./index.html', './'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(SHELL.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  // 只处理本站自己的文件；同步用的 GitHub 接口、图片外链一律直接走网络
  if (u.origin !== location.origin) return;
  e.respondWith(
    fetch(req)
      .then(r => {
        if (r && r.status === 200) {
          const cp = r.clone();
          caches.open(CACHE).then(c => c.put(req, cp));
        }
        return r;
      })
      .catch(() => caches.match(req).then(c => c || caches.match('./index.html')))
  );
});
