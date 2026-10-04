// ============================================================
// sw.js — Service Worker for Let For Dead I
// ============================================================
'use strict';

var CACHE_NAME = 'letfordead-v1';
var RUNTIME_CACHE = 'letfordead-runtime-v1';

// Core files
var CORE_ASSETS = [
  './',
  './menu/menu.html',
  './menu/menu.css',
  './menu/menu.js',
  './game.html',
  './game.css',
  './game.js',
  './loading.html',
  './lang.js',
  './save.js',
  './audio.js',
  './music.js',
  './world.js',
  './weapons.js',
  './zombies.js',
  './items.js',
  './ai.js',
  './player.js',
  './help.js',
  './plane.js',
  './missions.js',
  './hud.js',
  './controller.js',
  './pwa.js',
  './manifest.json',
  './image/letfordead.png'
];

// ============================================================
// INSTALL
// ============================================================
self.addEventListener('install', function(event){
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache){
        return Promise.all(
          CORE_ASSETS.map(function(url){
            return cache.add(url).catch(function(err){
              console.warn('[SW] Failed to cache:', url);
            });
          })
        );
      })
      .then(function(){
        return self.skipWaiting();
      })
  );
});

// ============================================================
// ACTIVATE
// ============================================================
self.addEventListener('activate', function(event){
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.map(function(key){
          if(key !== CACHE_NAME && key !== RUNTIME_CACHE){
            console.log('[SW] Deleting old:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(function(){
      return self.clients.claim();
    })
  );
});

// ============================================================
// FETCH
// ============================================================
self.addEventListener('fetch', function(event){
  var req = event.request;

  if(req.method !== 'GET') return;
  if(!req.url.startsWith(self.location.origin)) return;

  // HTML navigation
  if(req.mode === 'navigate'){
    event.respondWith(
      fetch(req)
        .then(function(res){
          var clone = res.clone();
          caches.open(RUNTIME_CACHE).then(function(cache){
            cache.put(req, clone);
          });
          return res;
        })
        .catch(function(){
          return caches.match(req).then(function(cached){
            return cached || caches.match('./menu/menu.html');
          });
        })
    );
    return;
  }

  // Everything else — cache first
  event.respondWith(
    caches.match(req).then(function(cached){
      if(cached) return cached;

      return fetch(req).then(function(res){
        if(!res || res.status !== 200 || res.type === 'opaque') return res;

        var clone = res.clone();
        caches.open(RUNTIME_CACHE).then(function(cache){
          cache.put(req, clone);
        });
        return res;
      }).catch(function(){
        if(req.destination === 'image'){
          return caches.match('./image/letfordead.png');
        }
      });
    })
  );
});

// ============================================================
// MESSAGE
// ============================================================
self.addEventListener('message', function(event){
  if(event.data && event.data.type === 'SKIP_WAITING'){
    self.skipWaiting();
  }
});