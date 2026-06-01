var CACHE = 'agilihome-v3';
var URLS = [
  '/agilihome/chat-agilihome.html',
  '/agilihome/manifest.json',
  '/agilihome/icon-192.png',
  '/agilihome/icon-512.png'
];

/* ── INSTALL ── */
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(c) { return c.addAll(URLS); })
  );
  self.skipWaiting();
});

/* ── ACTIVATE ── */
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(ks) {
      return Promise.all(
        ks.filter(function(k) { return k !== CACHE; })
          .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

/* ── FETCH — network first, cache fallback ── */
self.addEventListener('fetch', function(e) {
  e.respondWith(
    fetch(e.request).catch(function() { return caches.match(e.request); })
  );
});

/* ── PUSH — recebe notificação mesmo com app fechado ── */
self.addEventListener('push', function(e) {
  var data = {};
  try { data = e.data ? e.data.json() : {}; } catch(err) {}

  var titulo = data.titulo || 'agilihome';
  var corpo  = data.corpo  || 'Nova mensagem';
  var icon   = '/agilihome/icon-192.png';
  var badge  = '/agilihome/icon-192.png';

  e.waitUntil(
    self.registration.showNotification(titulo, {
      body: corpo,
      icon: icon,
      badge: badge,
      tag: 'agili-msg',
      renotify: true,
      vibrate: [200, 100, 200],
      data: { url: '/agilihome/chat-agilihome.html' }
    })
  );
});

/* ── NOTIFICATION CLICK — abre o app ── */
self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url)
    ? e.notification.data.url
    : '/agilihome/chat-agilihome.html';
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
