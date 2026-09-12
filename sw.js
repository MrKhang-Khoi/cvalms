/* ==========================================================
 * SERVICE WORKER - LMS PHÒNG MÁY TƯƠNG TÁC (PWA)
 * Quản lý Cache cục bộ để chống giật lag và nạp bài tức thì
 * ========================================================== */

const CACHE_NAME = 'lms-18may-v2.1.0';
const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './js/bundle.js',
  './data/classes.json',
  './data/default-lessons.json'
];

// 1. Install Event: Cache các tài nguyên tĩnh cơ sở
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[PWA SW] Đang lưu cache tĩnh...');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate Event: Xóa các bản cache cũ khi có phiên bản mới
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => {
          console.log('[PWA SW] Xóa cache cũ:', key);
          return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event: Network-First cho dữ liệu động, Cache-First cho tài nguyên tĩnh
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Không cache Firebase Realtime Database và Auth requests
  if (url.hostname.includes('firebaseio.com') || url.hostname.includes('googleapis.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // Cập nhật ngầm dưới nền (Stale-While-Revalidate)
        fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request).then(networkResponse => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
        return networkResponse;
      });
    })
  );
});
