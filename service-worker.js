var CACHE_NAME = 'airang-growth-guide-v30-jquery-response';
var APP_SHELL = [
  './index.html',
  './products.html',
  './places.html',
  './manifest.json',
  './assets/css/common.css?v=23',
  './assets/css/places.css?v=24',
  './assets/css/tailwind-places.css?v=22',
  './assets/vendor/leaflet/leaflet.css?v=21',
  './assets/vendor/leaflet/leaflet.js?v=21',
  './assets/vendor/leaflet/images/layers.png',
  './assets/vendor/leaflet/images/layers-2x.png',
  './assets/vendor/leaflet/images/marker-icon.png',
  './assets/vendor/leaflet/images/marker-icon-2x.png',
  './assets/vendor/leaflet/images/marker-shadow.png',
  './assets/js/vendor/jquery-lite.js',
  './assets/js/app.js',
  './assets/js/baby-calc.js',
  './assets/js/guide-render.js',
  './assets/js/storage.js',
  './assets/js/notification.js',
  './assets/js/validate-monthly-guide.js',
  './assets/js/products.js',
  './assets/js/places.js?v=30',
  './assets/data/monthly-guide.json',
  './assets/data/cdc-milestones-ko.json',
  './assets/data/food-warning.json',
  './assets/data/app-config.json',
  './assets/data/kr-official-sources.json',
  './assets/data/kr-feeding-stage-guide.json',
  './assets/data/kr-health-checkup-guide.json',
  './assets/data/kr-food-warning.json',
  './assets/data/kr-sleep-safety-guide.json',
  './assets/data/kr-monthly-overlay.json',
  './assets/data/kr-kdst-policy.json',
  './assets/data/recommended-products.json',
  './assets/data/weaning-prep-checklist.json',
  './assets/data/feeding-guide.json',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
];

self.addEventListener('install', function(event){
  event.waitUntil(caches.open(CACHE_NAME).then(function(cache){ return cache.addAll(APP_SHELL); }));
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  event.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.map(function(key){ if(key !== CACHE_NAME){ return caches.delete(key); } }));
  }));
  self.clients.claim();
});

self.addEventListener('fetch', function(event){
  if(event.request.method !== 'GET'){ return; }

  var url = new URL(event.request.url);
  if(url.origin !== self.location.origin){ return; }

  if(event.request.mode === 'navigate' || url.pathname === '/' || url.pathname.slice(-5) === '.html'){
    event.respondWith(networkFirst(event.request));
    return;
  }

  if(url.pathname.indexOf('/assets/data/') > -1){
    event.respondWith(networkFirst(event.request));
    return;
  }

  event.respondWith(cacheFirst(event.request));
});

function cacheFirst(request){
  return caches.match(request).then(function(cached){
    if(cached){ return cached; }
    return fetch(request).then(function(response){
      var copy = response.clone();
      caches.open(CACHE_NAME).then(function(cache){ cache.put(request, copy); });
      return response;
    });
  });
}

function networkFirst(request){
  return fetch(request).then(function(response){
    var copy = response.clone();
    caches.open(CACHE_NAME).then(function(cache){ cache.put(request, copy); });
    return response;
  }).catch(function(){ return caches.match(request); });
}
