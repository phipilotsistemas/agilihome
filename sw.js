/* agilihome Service Worker — auto-update */
var CACHE = 'agilihome-v' + Date.now(); // versão única a cada deploy
var URLS = [
  '/agilihome/chat-agilihome.html',
  '/agilihome/manifest.json',
  '/agilihome/icon-192.png',
  '/agilihome/icon-512.png'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(c) { return c.addAll(URLS); })
  );
  self.skipWaiting(); // ativa imediatamente sem esperar fechar
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(ks) {
      return Promise.all(
        ks.filter(function(k) { return k !== CACHE; })
          .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim(); // assume controle de todas as abas
    })
  );
});

/* Network first — sempre busca versão nova, cache só como fallback */
self.addEventListener('fetch', function(e) {
  e.respondWith(
    fetch(e.request).then(function(res) {
      // Atualizar cache com versão nova
      var resClone = res.clone();
      caches.open(CACHE).then(function(c) { c.put(e.request, resClone); });
      return res;
    }).catch(function() {
      return caches.match(e.request);
    })
  );
});

/* Push notifications */
self.addEventListener('push', function(e) {
  var data = {};
  try { data = e.data ? e.data.json() : {}; } catch(err) {}
  e.waitUntil(
    self.registration.showNotification(data.titulo || 'agilihome', {
      body: data.corpo || 'Nova mensagem',
      icon: '/agilihome/icon-192.png',
      badge: '/agilihome/icon-192.png',
      tag: 'agili-msg', renotify: true,
      vibrate: [200, 100, 200],
      data: { url: '/agilihome/chat-agilihome.html' }
    })
  );
});

/* Clique na notificação — abre o app */
self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(cs) {
      for (var i = 0; i < cs.length; i++) {
        if (cs[i].url.indexOf('agilihome') !== -1 && 'focus' in cs[i]) return cs[i].focus();
      }
      if (clients.openWindow) return clients.openWindow('/agilihome/chat-agilihome.html');
    })
  );
});
