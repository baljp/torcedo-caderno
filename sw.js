// Service worker: guarda o jogo no aparelho para funcionar sem internet.
const CACHE = 'torcedo-7bfe006c5b'; // trocado automaticamente a cada build (tools/build.sh)
const CORE = ['./', './index.html', './manifest.json', './l.js', './img/galaxia.jpg', './img/fig/torcedo.png', './img/fig/dino.png', './img/fig/amigos.png', './img/fig/quadro-torcedo.jpg', './img/fig/quadro-dino.jpg', './img/icon-192.png', './img/icon-512.png'];

async function stash(urls) {
  const c = await caches.open(CACHE);
  await Promise.all(urls.map(async u => {
    try { if (await c.match(u)) return; const res = await fetch(u); if (res.ok) await c.put(u, res); } catch (err) { }
  }));
}
self.addEventListener('message', e => {
  if (e.data === 'skip') self.skipWaiting();
  // a página manda a lista do que carregou: guarda o que ainda não está no cache (para abrir sem internet)
  if (e.data && Array.isArray(e.data.cache)) e.waitUntil(stash(e.data.cache.slice(0, 300)));
});
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
