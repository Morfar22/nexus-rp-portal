// Enhanced Performance optimized service worker with push notifications
const CACHE_NAME = 'app-performance-v2';
const STATIC_CACHE = 'static-cache-v2';
const NOTIFICATION_CACHE = 'chat-notifications-v1';
const DYNAMIC_CACHE = 'dynamic-cache-v1';

// Resources to cache immediately for better LCP
const PRECACHE_RESOURCES = [
  '/',
  '/src/index.css',
  '/src/assets/hero-image.webp',
  '/src/assets/hero-image.jpg', 
  '/src/assets/hero-image.png'
];

// Cache-first strategy for static assets - includes WebP optimization
const CACHE_FIRST_RESOURCES = [
  /\.(?:js|css|woff2?|ttf|eot|webp|avif)$/,
  /\/src\/assets\//,
  /\/public\//,
  /\.(png|jpg|jpeg|gif|svg)$/
];

// Network-first strategy for API calls
const NETWORK_FIRST_RESOURCES = [
  /\/api\//,
  /supabase\.co/,
  /functions\/v1\//,
  /performance-/
];

self.addEventListener('install', (event) => {
  console.log('Performance Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Pre-caching critical resources for LCP optimization');
      return cache.addAll(PRECACHE_RESOURCES);
    })
  );
  
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Performance Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (![CACHE_NAME, STATIC_CACHE, NOTIFICATION_CACHE, DYNAMIC_CACHE].includes(cacheName)) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Handle different caching strategies for performance
  if (CACHE_FIRST_RESOURCES.some(pattern => pattern.test(url.pathname))) {
    // Cache-first for static assets - improves LCP
    event.respondWith(cacheFirst(event.request));
  } else if (NETWORK_FIRST_RESOURCES.some(pattern => pattern.test(url.href))) {
    // Network-first for API calls - ensures fresh data
    event.respondWith(networkFirst(event.request));
  } else {
    // Stale-while-revalidate for other resources - balances speed and freshness
    event.respondWith(staleWhileRevalidate(event.request));
  }
});

// Cache-first strategy - optimizes LCP for static assets
async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Return immediately from cache for best LCP
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cache for future requests
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed for cache-first:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Network-first strategy - ensures fresh API data
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', error);
    const cachedResponse = await cache.match(request);
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

// Stale-while-revalidate strategy - balances performance and freshness
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // Fetch in background to update cache
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => {
    // Ignore network errors for background updates
  });
  
  // Return cached version immediately, or wait for network
  return cachedResponse || fetchPromise;
}

// === PUSH NOTIFICATION FUNCTIONALITY (PRESERVED) ===

self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'New Chat Notification', body: event.data.text() };
    }
  }

  const title = data.title || 'New Chat Notification';
  const options = {
    body: data.body || 'You have a new chat notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'chat-notification',
    renotify: true,
    requireInteraction: true,
    data: data.data || {},
    actions: [
      {
        action: 'view',
        title: 'View Chat'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ],
    vibrate: [200, 100, 200, 100, 200],
    sound: '/notification.mp3'
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'view') {
    // Open the chat page
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes('/staff') && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow('/staff');
        }
      })
    );
  }
});

// Enhanced background sync for performance metrics and offline notifications
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync());
  } else if (event.tag === 'performance-metrics') {
    event.waitUntil(uploadPendingMetrics());
  }
});

async function handleBackgroundSync() {
  console.log('Handling background sync...');
  // Handle any queued notifications or messages
}

async function uploadPendingMetrics() {
  console.log('Uploading pending performance metrics...');
  // Upload any cached performance metrics when connection is restored
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const requests = await cache.keys();
    const metricsRequests = requests.filter(req => req.url.includes('performance-metrics'));
    
    for (const request of metricsRequests) {
      const response = await cache.match(request);
      if (response) {
        // Retry the original request
        await fetch(request);
        await cache.delete(request);
      }
    }
  } catch (error) {
    console.error('Failed to upload pending metrics:', error);
  }
}