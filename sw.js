const CACHE='golf-game-ipad-offline-v21';
const ASSETS=[
  './','./index.html','./styles.css?v=210','./app.js?v=210','./manifest.webmanifest?v=210',
  './home-golf-hero.jpg','./home-course.svg','./tom-jerry-golf-intro.mp4',
  './icons/icon-192.png','./icons/icon-512.png'
];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('golf-game-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET')return;
 const url=new URL(request.url);
 if(url.origin!==self.location.origin)return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  const cached=await cache.match(request,{ignoreSearch:false})||await cache.match(url.pathname,{ignoreSearch:true});
  if(cached)return cached;
  try{const response=await fetch(request);if(response&&response.ok)await cache.put(request,response.clone());return response;}
  catch(error){if(request.mode==='navigate')return (await cache.match('./index.html'))||Response.error();return Response.error();}
 })());
});

self.addEventListener('message',function(event){if(event.data==='SKIP_WAITING'){self.skipWaiting();}});
