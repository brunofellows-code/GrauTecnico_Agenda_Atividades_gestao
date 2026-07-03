/* ============================================================
   Sistema A · Grau Técnico FSA — Service Worker (PWA)
   Estratégia: NETWORK-FIRST com fallback em cache.
   - Sempre tenta a rede primeiro (deploy novo no Netlify vale
     na hora; nunca serve versão velha tendo internet).
   - Sem rede, serve a última cópia em cache (leitura offline).
   - Só intercepta GET do mesmo domínio; Firebase/CDN passam direto.
   ES5 estrito. Cache versionado: mudar CACHE invalida o antigo.
   ============================================================ */
'use strict';

var CACHE = 'graut-c2-v1';

var SHELL = [
  './theme.css',
  './components.css',
  './ui.js',
  './manifest.json'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(SHELL);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE) { return caches.delete(k); }
        return null;
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') { return; }

  var url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) { return; } /* Firebase/CDN: passthrough */

  e.respondWith(
    fetch(req).then(function (res) {
      if (res && res.status === 200 && res.type === 'basic') {
        var copia = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copia); });
      }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (hit) {
        if (hit) { return hit; }
        return caches.match('./hoje.html');
      });
    })
  );
});
