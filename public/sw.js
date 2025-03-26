const CACHE_NAME = 'yamkar-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/maskable-192x192.png',
  '/icons/maskable-512x512.png',
  '/screenshots/home.png',
  '/icons/attendance.png',
  '/icons/reports.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Force the service worker to take control immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ])
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Background sync event
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-attendance') {
    event.waitUntil(syncAttendance());
  }
});

// Periodic sync event
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-sync') {
    event.waitUntil(performDailySync());
  }
});

// File handling
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/handle-file')) {
    event.respondWith(handleFile(event.request));
  }
});

// Protocol handling
self.addEventListener('fetch', (event) => {
  if (event.request.url.startsWith('web+yamkar://')) {
    event.respondWith(handleProtocol(event.request));
  }
});

// Share target handling
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/share-target')) {
    event.respondWith(handleShare(event.request));
  }
});

// Helper functions
async function syncAttendance() {
  try {
    const db = await openIndexedDB();
    const pendingAttendance = await db.getAll('pendingAttendance');
    
    for (const attendance of pendingAttendance) {
      await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(attendance),
      });
      await db.delete('pendingAttendance', attendance.id);
    }
  } catch (error) {
    console.error('Error syncing attendance:', error);
  }
}

async function performDailySync() {
  try {
    // Sync any pending data
    await syncAttendance();
    
    // Check for updates
    const response = await fetch('/api/check-updates');
    const updates = await response.json();
    
    if (updates.available) {
      // Notify user about updates
      self.registration.showNotification('Yamkar Update Available', {
        body: 'A new version of Yamkar is available. Please refresh to update.',
        icon: '/icons/icon-192x192.png',
      });
    }
  } catch (error) {
    console.error('Error performing daily sync:', error);
  }
}

async function handleFile(request) {
  const url = new URL(request.url);
  const fileType = url.searchParams.get('type');
  const fileData = await request.blob();
  
  // Handle different file types
  switch (fileType) {
    case 'application/pdf':
      return handlePDF(fileData);
    case 'image/*':
      return handleImage(fileData);
    case 'text/plain':
      return handleText(fileData);
    default:
      return new Response('Unsupported file type', { status: 400 });
  }
}

async function handleProtocol(request) {
  const url = new URL(request.url);
  const data = url.searchParams.get('url');
  
  // Handle the protocol-specific data
  return new Response('Protocol handled', { status: 200 });
}

async function handleShare(request) {
  const url = new URL(request.url);
  const title = url.searchParams.get('title');
  const text = url.searchParams.get('text');
  const sharedUrl = url.searchParams.get('url');
  
  // Handle the shared content
  return new Response('Share handled', { status: 200 });
}

// IndexedDB setup
async function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('yamkar-db', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object stores
      if (!db.objectStoreNames.contains('pendingAttendance')) {
        db.createObjectStore('pendingAttendance', { keyPath: 'id' });
      }
    };
  });
} 