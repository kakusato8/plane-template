/**
 * CurioCity Service Worker
 * 高度なキャッシュ戦略とパフォーマンス最適化
 */

const CACHE_VERSION = '1.4';
const CACHE_NAME = `curio-city-v${CACHE_VERSION}`;
const STATIC_CACHE = `curio-city-static-v${CACHE_VERSION}`;
const DYNAMIC_CACHE = `curio-city-dynamic-v${CACHE_VERSION}`;
const IMAGE_CACHE = `curio-city-images-v${CACHE_VERSION}`;
const API_CACHE = `curio-city-api-v${CACHE_VERSION}`;

// パフォーマンス監視
const performanceMetrics = {
  cacheHits: 0,
  cacheMisses: 0,
  networkRequests: 0,
  averageResponseTime: 0,
  totalResponseTime: 0,
  requestCount: 0
};

// キャッシュするリソース
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/data/trivia.json',
  '/data/locations.json',
  '/data/tags.json'
];

// キャッシュサイズ制限と TTL設定
const CACHE_LIMITS = {
  [DYNAMIC_CACHE]: 50,
  [IMAGE_CACHE]: 30,
  [STATIC_CACHE]: 100,
  [API_CACHE]: 20
};

const CACHE_TTL = {
  [STATIC_CACHE]: 7 * 24 * 60 * 60 * 1000, // 7日
  [DYNAMIC_CACHE]: 24 * 60 * 60 * 1000,    // 1日
  [IMAGE_CACHE]: 3 * 24 * 60 * 60 * 1000,  // 3日
  [API_CACHE]: 5 * 60 * 1000               // 5分
};

/**
 * Service Worker インストール
 */
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Failed to cache static assets:', error);
      })
  );
});

/**
 * Service Worker アクティベート
 */
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // 古いキャッシュを削除
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== IMAGE_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // クライアント制御を即座に開始
      self.clients.claim()
    ])
  );
});

/**
 * フェッチイベントハンドラ（パフォーマンス監視付き）
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  const startTime = Date.now();
  
  // Chrome拡張機能などのリクエストは無視
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // パフォーマンス監視ラッパー
  const monitoredResponse = async (handlerPromise) => {
    try {
      const response = await handlerPromise;
      recordPerformanceMetrics(startTime, true);
      return response;
    } catch (error) {
      recordPerformanceMetrics(startTime, false);
      throw error;
    }
  };

  // リクエストタイプによる戦略分岐
  if (isStaticAsset(request)) {
    event.respondWith(monitoredResponse(handleStaticAsset(request)));
  } else if (isImageRequest(request)) {
    event.respondWith(monitoredResponse(handleImageRequest(request)));
  } else if (isAPIRequest(request)) {
    event.respondWith(monitoredResponse(handleAPIRequest(request)));
  } else if (isDataRequest(request)) {
    event.respondWith(monitoredResponse(handleDataRequest(request)));
  } else {
    event.respondWith(monitoredResponse(handleDynamicRequest(request)));
  }
});

/**
 * 静的アセットの判定
 */
function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.includes('/assets/') ||
         url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.json') ||
         url.pathname === '/' ||
         url.pathname.includes('/data/');
}

/**
 * 画像リクエストの判定
 */
function isImageRequest(request) {
  const url = new URL(request.url);
  return request.destination === 'image' ||
         url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ||
         url.hostname.includes('picsum.photos') ||
         url.hostname.includes('via.placeholder.com');
}

/**
 * APIリクエストの判定
 */
function isAPIRequest(request) {
  const url = new URL(request.url);
  return url.pathname.includes('/api/') ||
         url.hostname.includes('api.') ||
         url.hostname.includes('firebase') ||
         url.hostname.includes('googleapis');
}

/**
 * データリクエストの判定
 */
function isDataRequest(request) {
  const url = new URL(request.url);
  return url.pathname.includes('/data/') ||
         url.pathname.endsWith('.json');
}

/**
 * パフォーマンスメトリクスの記録
 */
function recordPerformanceMetrics(startTime, success) {
  const responseTime = Date.now() - startTime;
  performanceMetrics.requestCount++;
  performanceMetrics.totalResponseTime += responseTime;
  performanceMetrics.averageResponseTime = performanceMetrics.totalResponseTime / performanceMetrics.requestCount;
  
  if (success) {
    performanceMetrics.cacheHits++;
  } else {
    performanceMetrics.cacheMisses++;
  }
}

/**
 * 静的アセット処理 (Cache First)
 */
async function handleStaticAsset(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
      await limitCacheSize(STATIC_CACHE);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Static asset request failed:', error);
    
    // オフライン時のフォールバック
    if (request.url.includes('.html') || request.url.endsWith('/')) {
      const cachedResponse = await caches.match('/index.html');
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    throw error;
  }
}

/**
 * 画像処理 (Cache First with Stale While Revalidate)
 */
async function handleImageRequest(request) {
  try {
    const cache = await caches.open(IMAGE_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // バックグラウンドで更新
      fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          cache.put(request, networkResponse.clone());
          limitCacheSize(IMAGE_CACHE);
        }
      }).catch(() => {
        // ネットワークエラーは無視
      });
      
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
      await limitCacheSize(IMAGE_CACHE);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Image request failed:', error);
    
    // SerenaMCP: 美しいグラデーション背景を返す（テキストなし）
    return new Response(
      '<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="fallbackGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#667eea;stop-opacity:1" /><stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" /></linearGradient></defs><rect width="100%" height="100%" fill="url(#fallbackGrad)" /></svg>',
      {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'no-cache'
        }
      }
    );
  }
}

/**
 * APIリクエスト処理 (Network First with TTL)
 */
async function handleAPIRequest(request) {
  const cache = await caches.open(API_CACHE);
  
  // キャッシュから取得してTTLチェック
  const cachedResponse = await cache.match(request);
  if (cachedResponse && !isCacheExpired(cachedResponse, CACHE_TTL[API_CACHE])) {
    // バックグラウンドで更新
    fetch(request).then((networkResponse) => {
      if (networkResponse && networkResponse.status === 200) {
        cache.put(request, addTimestamp(networkResponse.clone()));
        limitCacheSize(API_CACHE);
      }
    }).catch(() => {});
    
    return cachedResponse;
  }
  
  try {
    performanceMetrics.networkRequests++;
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, addTimestamp(networkResponse.clone()));
      await limitCacheSize(API_CACHE);
    }
    return networkResponse;
  } catch (error) {
    console.error('API request failed, trying cache:', error);
    
    // 期限切れでもキャッシュがあれば返す
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

/**
 * データリクエスト処理 (Network First)
 */
async function handleDataRequest(request) {
  try {
    performanceMetrics.networkRequests++;
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, addTimestamp(networkResponse.clone()));
      await limitCacheSize(DYNAMIC_CACHE);
    }
    return networkResponse;
  } catch (error) {
    console.error('Data request failed, trying cache:', error);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

/**
 * 動的リクエスト処理 (Network First)
 */
async function handleDynamicRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      await limitCacheSize(DYNAMIC_CACHE);
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // HTMLリクエストの場合はindex.htmlを返す
    if (request.headers.get('Accept')?.includes('text/html')) {
      const indexCache = await caches.match('/index.html');
      if (indexCache) {
        return indexCache;
      }
    }
    
    throw error;
  }
}

/**
 * レスポンスにタイムスタンプを追加
 */
function addTimestamp(response) {
  const headers = new Headers(response.headers);
  headers.set('sw-cached-at', Date.now().toString());
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

/**
 * キャッシュの有効期限チェック
 */
function isCacheExpired(response, ttl) {
  const cachedAt = response.headers.get('sw-cached-at');
  if (!cachedAt) return false;
  
  const cacheAge = Date.now() - parseInt(cachedAt);
  return cacheAge > ttl;
}

/**
 * キャッシュサイズ制限（TTL考慮）
 */
async function limitCacheSize(cacheName) {
  const limit = CACHE_LIMITS[cacheName];
  const ttl = CACHE_TTL[cacheName];
  if (!limit) return;

  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  // 期限切れのエントリを削除
  if (ttl) {
    const expiredKeys = [];
    for (const key of keys) {
      const response = await cache.match(key);
      if (response && isCacheExpired(response, ttl)) {
        expiredKeys.push(key);
      }
    }
    
    await Promise.all(expiredKeys.map(key => cache.delete(key)));
    if (expiredKeys.length > 0) {
      console.log(`Cache ${cacheName} expired cleanup: removed ${expiredKeys.length} entries`);
    }
  }
  
  // 残りのエントリが制限を超えていたら古いものから削除
  const remainingKeys = await cache.keys();
  if (remainingKeys.length > limit) {
    const entriesToDelete = remainingKeys.slice(0, remainingKeys.length - limit);
    await Promise.all(entriesToDelete.map(key => cache.delete(key)));
    console.log(`Cache ${cacheName} size cleanup: removed ${entriesToDelete.length} entries`);
  }
}

/**
 * メッセージハンドラ
 */
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_CACHE_STATS':
      getCacheStats().then((stats) => {
        event.ports[0].postMessage(stats);
      });
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
      
    case 'PRELOAD_ROUTES':
      if (payload && payload.routes) {
        preloadRoutes(payload.routes);
      }
      break;
      
    case 'GET_PERFORMANCE_METRICS':
      event.ports[0].postMessage({
        ...performanceMetrics,
        cacheHitRate: performanceMetrics.requestCount > 0 
          ? (performanceMetrics.cacheHits / performanceMetrics.requestCount * 100).toFixed(2) + '%'
          : '0%'
      });
      break;
      
    case 'RESET_PERFORMANCE_METRICS':
      Object.assign(performanceMetrics, {
        cacheHits: 0,
        cacheMisses: 0,
        networkRequests: 0,
        averageResponseTime: 0,
        totalResponseTime: 0,
        requestCount: 0
      });
      event.ports[0].postMessage({ success: true });
      break;
  }
});

/**
 * キャッシュ統計取得
 */
async function getCacheStats() {
  const cacheNames = await caches.keys();
  const stats = {};
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    stats[cacheName] = keys.length;
  }
  
  return stats;
}

/**
 * 全キャッシュクリア
 */
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
  console.log('All caches cleared');
}

/**
 * ルートプリロード
 */
async function preloadRoutes(routes) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  for (const route of routes) {
    try {
      const response = await fetch(route);
      if (response && response.status === 200) {
        await cache.put(route, response);
      }
    } catch (error) {
      console.warn(`Failed to preload route: ${route}`, error);
    }
  }
}

/**
 * エラーハンドリング
 */
self.addEventListener('error', (error) => {
  console.error('Service Worker error:', error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker unhandled rejection:', event.reason);
});

console.log('CurioCity Service Worker loaded successfully');