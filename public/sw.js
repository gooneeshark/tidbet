// Service Worker for Audio Caching
const CACHE_NAME = 'goo-gemnee-audio-v1';
const AUDIO_CACHE_NAME = 'goo-gemnee-audio-files-v1';

// URLs to cache - specifically targeting elfsightcdn.com audio files
const CACHE_URLS = [
  '/',
  '/index.html'
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CACHE_URLS))
  );
});

// Fetch event - intercept audio requests and cache them
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Cache audio files from elfsightcdn.com
  if (url.hostname.includes('elfsightcdn.com') && 
      (url.pathname.includes('.mp3') || 
       url.pathname.includes('.wav') || 
       url.pathname.includes('.ogg') || 
       url.pathname.includes('.m4a') ||
       request.headers.get('accept')?.includes('audio'))) {
    
    event.respondWith(
      caches.open(AUDIO_CACHE_NAME)
        .then((cache) => {
          // Try to get from cache first
          return cache.match(request)
            .then((response) => {
              if (response) {
                // Return cached version
                return response;
              }
              
              // If not in cache, fetch and cache it
              return fetch(request)
                .then((response) => {
                  // Only cache successful responses
                  if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                  }
                  
                  // Clone the response since we need to use it twice
                  const responseToCache = response.clone();
                  
                  cache.put(request, responseToCache);
                  
                  return response;
                })
                .catch(() => {
                  // If fetch fails, try to return a cached version even if expired
                  return cache.match(request);
                });
            });
        })
    );
  }
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== AUDIO_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Message event - handle cache management from main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_AUDIO') {
    const audioUrl = event.data.url;
    
    caches.open(AUDIO_CACHE_NAME)
      .then((cache) => {
        return cache.add(audioUrl);
      })
      .then(() => {
        event.ports[0].postMessage({ success: true, url: audioUrl });
      })
      .catch((error) => {
        event.ports[0].postMessage({ success: false, error: error.message });
      });
  }
  
  if (event.data && event.data.type === 'GET_CACHED_AUDIO') {
    const audioUrl = event.data.url;
    
    caches.open(AUDIO_CACHE_NAME)
      .then((cache) => {
        return cache.match(audioUrl);
      })
      .then((response) => {
        if (response) {
          response.arrayBuffer().then((buffer) => {
            event.ports[0].postMessage({ 
              success: true, 
              url: audioUrl, 
              data: buffer 
            });
          });
        } else {
          event.ports[0].postMessage({ success: false, url: audioUrl });
        }
      })
      .catch((error) => {
        event.ports[0].postMessage({ success: false, error: error.message });
      });
  }
  
  if (event.data && event.data.type === 'CLEAR_AUDIO_CACHE') {
    caches.delete(AUDIO_CACHE_NAME)
      .then(() => {
        event.ports[0].postMessage({ success: true });
      })
      .catch((error) => {
        event.ports[0].postMessage({ success: false, error: error.message });
      });
  }
});
