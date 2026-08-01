// Minimal service worker — required for the browser to allow "Install App"
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  // Pass-through: no offline caching, just makes the app installable
  event.respondWith(fetch(event.request))
})