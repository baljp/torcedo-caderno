// Service worker: guarda o jogo no aparelho para funcionar sem internet.
const CACHE = 'torcedo-eeb17b47f4'; // trocado automaticamente a cada build (tools/build.sh)
const CORE = ['./', './index.html', './manifest.json', './l.js', './img/torcedo.jpg', './img/dino.jpg', './img/praia.jpg', './img/esmeralda.jpg', './img/arvore.jpg', './img/galaxia.jpg', './img/amigos.jpg', './img/icon-192.png', './img/icon-512.png'];

self.addEventListener('message', e => { if (e.data === 'skip') self.skipWaiting(); });
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// arquivos do jogo: rede primeiro (para pegar atualizações), cache se estiver sem internet.
// bibliotecas (three.js, cannon-es, fontes): cache primeiro.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  const lib = /cdn\.jsdelivr\.net|fonts\.(googleapis|gstatic)\.com/.test(url.hostname);
  if (lib) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); return res; })));
  } else if (url.origin === location.origin) {
    const fresh = e.request.mode === 'navigate' ? fetch(e.request.url, { cache: 'no-cache' }) : fetch(e.request, { cache: 'no-cache' });
    e.respondWith(fresh.then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); return res; }).catch(() => caches.match(e.request)));
  }
});
