importScripts('/uv/uv.sw.js');

const sw = new UVServiceWorker();

self.addEventListener('install', event => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => event.respondWith(sw.fetch(event)));
