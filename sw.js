// ⚡ 軽量 Service Worker（PWAインストール要件対応）
const CACHE_NAME = 'flora-pwa-v2'; // ← バージョンを上げて古いキャッシュを破棄

// 最低限、オフライン時に救いたい主要ページだけ事前キャッシュ
const PRECACHE_URLS = [
    './',
    './index.html',
    './refbook.html',
    './insights.html',
    './ai-settings.html',
    './style.css',
    './mobile-nav.js',
    './manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // 個々のURLが404等でもinstall全体を失敗させない
            return Promise.all(
                PRECACHE_URLS.map((url) =>
                    cache.add(url).catch((err) => {
                        console.warn('[SW] precache failed:', url, err);
                    })
                )
            );
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            )
        ).then(() => clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    // GET以外（POST等、Firebase/API呼び出し含む）はSWを介さずそのまま素通し
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                // 成功したレスポンスはキャッシュを更新しておく（オフライン精度向上）
                const clone = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                return networkResponse;
            })
            .catch(async () => {
                const cached = await caches.match(event.request);
                if (cached) {
                    return cached;
                }
                // キャッシュにも無い場合は必ずResponseを返す（undefinedを渡さない）
                return new Response('オフラインのため読み込めませんでした。', {
                    status: 503,
                    statusText: 'Service Unavailable',
                    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
                });
            })
    );
});
