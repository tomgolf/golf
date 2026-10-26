const CACHE='live-golf-game-v1-25-left-handicap-colors';
const CORE_ASSETS=[
  './',
  './index.html',
  './styles.css?v=live-golf-game-v1-25-left-handicap-colors',
  './app.js?v=live-golf-game-v1-25-left-handicap-colors',
  './manifest.webmanifest'
];
const API_HOSTS=new Set(['script.google.com','script.googleusercontent.com']);
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE_ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET') return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin) {
    if(API_HOSTS.has(url.hostname)) event.respondWith(fetch(new Request(request,{cache:'no-store'})));
    return;
  }
  if(request.mode==='navigate') {
    event.respondWith(fetch(new Request(request,{cache:'no-store'})).then(response=>{
      if(response&&response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put('./index.html',copy));}
      return response;
    }).catch(()=>caches.match('./index.html')));
    return;
  }
  // Cache-first for versioned static files: fast repeat visits; cache newly used images/video on first fetch.
  event.respondWith(caches.match(request).then(cached=>{
    if(cached) return cached;
    return fetch(request).then(response=>{
      if(response&&response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));}
      return response;
    }).catch(()=>caches.match(request));
  }));
});
