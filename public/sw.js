// Service Worker for Excalidraw Project Manager
// Version 1.0.0

const CACHE_NAME = 'excalidraw-pm-v1'
const STATIC_CACHE_NAME = 'excalidraw-pm-static-v1'
const DYNAMIC_CACHE_NAME = 'excalidraw-pm-dynamic-v1'

// Critical resources to cache for offline functionality
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/placeholder-logo.png',
  '/placeholder.png',
  '/robots.txt',
  '/export-import',
  '/features'
]

// Network-first strategy URLs (API calls, dynamic content)
const NETWORK_FIRST = [
  '/api/',
  '/_next/webpack-hmr',
  '/_next/static/webpack/'
]

// Cache-first strategy URLs (static assets)
const CACHE_FIRST = [
  '/_next/static/',
  '/static/',
  '.css',
  '.js',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.ico',
  '.webp',
  '.*'
]

// Stale-while-revalidate strategy URLs
const STALE_WHILE_REVALIDATE = [
  '/export-import',
  '/features',
  '/_next/data/'
]

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')
  
  event.waitUntil(
    (async () => {
      try {
        // Open static cache and add essential assets
        const staticCache = await caches.open(STATIC_CACHE_NAME)
        await staticCache.addAll(STATIC_ASSETS)
        
        // Pre-cache critical Next.js assets
        const dynamicCache = await caches.open(DYNAMIC_CACHE_NAME)
        
        // Cache the main app shell
        try {
          await dynamicCache.add('/_next/static/chunks/webpack.js')
          await dynamicCache.add('/_next/static/chunks/main.js')
          await dynamicCache.add('/_next/static/chunks/pages/_app.js')
        } catch (error) {
          console.log('[SW] Some Next.js assets not available during install:', error.message)
        }
        
        console.log('[SW] Service worker installed successfully')
        self.skipWaiting()
      } catch (error) {
        console.error('[SW] Service worker installation failed:', error)
      }
    })()
  )
})

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')
  
  event.waitUntil(
    (async () => {
      try {
        // Clean up old caches
        const cacheNames = await caches.keys()
        const oldCaches = cacheNames.filter(cacheName => 
          (cacheName.startsWith('excalidraw-pm-') && 
           cacheName !== STATIC_CACHE_NAME && 
           cacheName !== DYNAMIC_CACHE_NAME)
        )
        
        await Promise.all(
          oldCaches.map(cacheName => {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          })
        )
        
        // Take control of all pages
        await self.clients.claim()
        console.log('[SW] Service worker activated successfully')
      } catch (error) {
        console.error('[SW] Service worker activation failed:', error)
      }
    })()
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }
  
  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return
  }
  
  // Skip hot reload requests in development
  if (url.pathname.includes('_next/webpack-hmr') || 
      url.pathname.includes('_next/static/webpack/')) {
    return
  }
  
  event.respondWith(handleRequest(request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const pathname = url.pathname
  
  try {
    // Network-first strategy for API calls and dynamic content
    if (NETWORK_FIRST.some(pattern => pathname.includes(pattern))) {
      return await networkFirst(request)
    }
    
    // Cache-first strategy for static assets
    if (CACHE_FIRST.some(pattern => pathname.includes(pattern) || pathname.endsWith(pattern))) {
      return await cacheFirst(request)
    }
    
    // Stale-while-revalidate for pages
    if (STALE_WHILE_REVALIDATE.some(pattern => pathname.includes(pattern)) ||
        pathname.match(/^\/[a-zA-Z0-9-]+$/)) { // Project pages
      return await staleWhileRevalidate(request)
    }
    
    // Default: Network-first with offline fallback
    return await networkFirstWithOfflineFallback(request)
    
  } catch (error) {
    console.error('[SW] Error handling request:', error)
    return await getOfflinePage()
  }
}

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    const cachedResponse = await caches.match(request)
    return cachedResponse || new Response('Offline', { status: 503 })
  }
}

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request)
  
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('[SW] Network failed for:', request.url)
    return new Response('Asset not available offline', { status: 503 })
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME)
  const cachedResponse = await cache.match(request)
  
  // Fetch in background and update cache
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  }).catch(error => {
    console.log('[SW] Background fetch failed for:', request.url)
  })
  
  // Return cached version immediately if available
  return cachedResponse || await fetchPromise
}

async function networkFirstWithOfflineFallback(request) {
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    const cachedResponse = await caches.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return await getOfflinePage()
    }
    
    return new Response('Offline', { status: 503 })
  }
}

async function getOfflinePage() {
  try {
    // Try to get the main page from cache
    const cachedMainPage = await caches.match('/')
    if (cachedMainPage) {
      return cachedMainPage
    }
    
    // Fallback offline page
    return new Response(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Offline - Excalidraw Project Manager</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: #f8fafc;
              color: #1e293b;
            }
            .container {
              text-align: center;
              max-width: 400px;
              padding: 2rem;
            }
            h1 {
              font-size: 2rem;
              margin-bottom: 1rem;
              color: #ef4444;
            }
            p {
              margin-bottom: 1.5rem;
              line-height: 1.6;
            }
            button {
              background: #3b82f6;
              color: white;
              border: none;
              padding: 0.75rem 1.5rem;
              border-radius: 0.5rem;
              cursor: pointer;
              font-size: 1rem;
            }
            button:hover {
              background: #2563eb;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>You're Offline</h1>
            <p>
              You're currently offline, but you can still use Excalidraw Project Manager 
              with your cached projects and continue drawing!
            </p>
            <button onclick="window.location.reload()">Try Again</button>
          </div>
        </body>
      </html>
    `, {
      headers: {
        'Content-Type': 'text/html',
      },
    })
  } catch (error) {
    return new Response('Offline', { status: 503 })
  }
}

// Handle background sync for when connection is restored
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag)
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  try {
    // Sync any pending data when connection is restored
    console.log('[SW] Performing background sync...')
    
    // You can add logic here to sync project data that was modified offline
    // For now, we'll just update the cache with fresh content
    const cache = await caches.open(DYNAMIC_CACHE_NAME)
    
    // Refresh critical pages
    const urlsToRefresh = ['/', '/export-import', '/features']
    
    for (const url of urlsToRefresh) {
      try {
        const response = await fetch(url)
        if (response.ok) {
          await cache.put(url, response.clone())
        }
      } catch (error) {
        console.log(`[SW] Failed to refresh ${url}:`, error.message)
      }
    }
    
    console.log('[SW] Background sync completed')
  } catch (error) {
    console.error('[SW] Background sync failed:', error)
  }
}

// Handle push notifications (if needed in the future)
self.addEventListener('push', (event) => {
  if (!event.data) return
  
  const data = event.data.json()
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/placeholder-logo.png',
      badge: '/placeholder-logo.png',
      tag: 'excalidraw-notification'
    })
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  event.waitUntil(
    clients.openWindow('/')
  )
})

console.log('[SW] Service worker script loaded')
