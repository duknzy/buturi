// ⚡ 軽量 Service Worker（PWAインストール要件対応）
const CACHE_NAME = 'flora-pwa-v1';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    // FirebaseやAPIへの通信を邪魔しないよう、通常のネットワーク通信を優先
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});