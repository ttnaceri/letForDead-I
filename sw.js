// sw.js — Service Worker
const CACHE_NAME = 'lfd-v1';
const ASSETS = [
  './game.html',
  './game.css',
  './audio.js',
  './music.js',
  './world.js',
  './weapons.js',
  './zombies.js',
  './items.js',
  './ai.js',
  './player.js',
  './help.js',
  './hud.js',
  './controller.js',
  './game.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(ASSETS).catch(function(err){
        console.warn('Cache addAll xato:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE_NAME; })
            .map(function(k){ return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e){
  e.respondWith(
    caches.match(e.request).then(function(resp){
      return resp || fetch(e.request).then(function(res){
        // Yangi resurslarni cachega qo'shish
        if(res && res.status === 200 && res.type === 'basic'){
          var clone = res.clone();
          caches.open(CACHE_NAME).then(function(cache){
            cache.put(e.request, clone);
          });
        }
        return res;
      });
    }).catch(function(){
      return caches.match('./game.html');
    })
  );
});