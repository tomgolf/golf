const CACHE='golf-game-pwa-v36';
const ASSETS=['./','./index.html','./style.css','./styles.css?v=36','./app.js?v=36','./manifest.json','./manifest.webmanifest','./home-course.svg'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  // API responses are never cached: scores must always come from the live database.
  if(url.hostname==='script.google.com'||url.hostname==='script.googleusercontent.com'){
    event.respondWith(fetch(new Request(event.request,{cache:'no-store'})));
    return;
  }
  const isNav=event.request.mode==='navigate';
  if(isNav){
    event.respondWith(fetch(new Request(event.request,{cache:'no-store'})).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put('./index.html',copy));return r;}).catch(()=>caches.match('./index.html')));
  }else{
    event.respondWith(fetch(event.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));}return r;}).catch(()=>caches.match(event.request)));
  }
});
