/* ==========================================================
 * SERVICE WORKER - LMS PHÒNG MÁY TƯƠNG TÁC (PWA)
 * Quản lý Cache cục bộ để chống giật lag và nạp bài tức thì
 * ========================================================== */

const CACHE_NAME = 'lms-18may-v2.4.0';
const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './js/bundle.js',
  './data/classes.json',
  './data/default-lessons.json'
];

// 1. Install Event: Nạp tài nguyên và kích hoạt ngay không chờ
self.addEventListener('install', event => {
  console.log('[PWA SW] Cài đặt phiên bản mới:', CACHE_NAME);
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })));
    }).catch(err => console.warn('[PWA SW] Cache addAll warn:', err))
  );
});

// 2. Activate Event: Xóa triệt để TẤT CẢ các bản cache cũ
self.addEventListener('activate', event => {
  console.log('[PWA SW] Kích hoạt và dọn dẹp cache cũ...');
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => {
          console.log('[PWA SW] Đã xóa vĩnh viễn cache lỗi thời:', key);
          return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event: NETWORK-FIRST cho mã nguồn (.js, .css, .html) để chống kẹt cache
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Tuyệt đối không can thiệp Firebase, Auth và API động
  if (url.hostname.includes('firebaseio.com') || url.hostname.includes('googleapis.com') || url.hostname.includes('firebasedatabase.app')) {
    return;
  }

  // Network-First cho tài nguyên code (.js, .css, .html)
  const isCodeAsset = url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname.endsWith('.html') || url.pathname === '/';

  if (isCodeAsset) {
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const resClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
          }
          return networkResponse;
        })
        .catch(() => {
          // Chỉ fallback sang cache khi mất mạng hoàn toàn (Offline)
          return caches.match(event.request);
        })
    );
    return;
  }

  // Cache-First cho hình ảnh, icons, font
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const resClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
        }
        return networkResponse;
      });
    })
  );
});
