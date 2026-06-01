/* agilihome Service Worker v4 */
var CACHE = 'agilihome-v4'; // versão FIXA — mudar manualmente a cada deploy importante
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
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(ks) {
      return Promise.all(
        ks.filter(function(k) { return k !== CACHE; })
          .map(function(k) { return caches.delete(k); })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

/* Network first — busca sempre versão nova */
self.addEventListener('fetch', function(e) {
  if(e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(function(res) {
      var clone = res.clone();
      caches.open(CACHE).then(function(c) { c.put(e.request, clone); });
      return res;
    }).catch(function() { return caches.match(e.request); })
  );
});

/* Push — recebe mesmo com app fechado */
self.addEventListener('push', function(e) {
  var data = {};
  try { data = e.data ? e.data.json() : {}; } catch(err) {}
  e.waitUntil(
    self.registration.showNotification(data.titulo || 'agilihome Chat', {
      body: data.corpo || 'Nova mensagem',
      icon: '/agilihome/icon-192.png',
      badge: '/agilihome/icon-192.png',
      tag: 'agili-' + (data.canal || 'msg'),
      renotify: true,
      vibrate: [200, 100, 200],
      silent: false,
      data: { url: '/agilihome/chat-agilihome.html', canal: data.canal }
    })
  );
});

/* Clique na notificação */
self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  var url = '/agilihome/chat-agilihome.html';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(cs) {
      for (var i = 0; i < cs.length; i++) {
        if (cs[i].url.indexOf('agilihome') !== -1 && 'focus' in cs[i]) {
          return cs[i].focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
