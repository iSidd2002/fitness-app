const CACHE_NAME = 'incelfit-v2'
// Only cache truly static, auth-agnostic assets — NOT auth-protected pages
const STATIC_ASSETS = ['/manifest.json']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Network-first for API and auth routes — never cache these
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/login') || url.pathname.startsWith('/signup')) {
    event.respondWith(fetch(request))
    return
  }

  // Cache-first for static assets (images, fonts, icons)
  if (request.destination === 'image' || request.destination === 'font' || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((res) => {
        const clone = res.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        return res
      }))
    )
    return
  }

  // Network-first for everything else, fallback to cache
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok && request.method === 'GET') {
          const clone = res.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return res
      })
      .catch(() => {
        // For navigation requests don't serve a potentially stale page from cache —
        // let middleware redirect to /login when network is restored
        if (request.mode === 'navigate') {
          return new Response('', { status: 503, statusText: 'Offline' })
        }
        return caches.match(request)
      })
  )
})
