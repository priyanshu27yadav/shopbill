import axios, { AxiosResponse } from 'axios';

export const API_BASE_URL = '/api';

interface CacheEntry {
  data: any;
  status: number;
  statusText: string;
  headers: any;
  timestamp: number;
}

const apiCache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<AxiosResponse>>();

// Default TTL for cached GET requests (60 seconds)
const DEFAULT_CACHE_TTL = 60 * 1000;

// Endpoints that shouldn't be cached (real-time lookups)
const NO_CACHE_ENDPOINTS = ['/customers/lookup', '/sales-returns/search-invoice', '/health'];

export const clearApiCache = (pattern?: string) => {
  if (!pattern) {
    apiCache.clear();
    return;
  }
  for (const key of apiCache.keys()) {
    if (key.includes(pattern)) {
      apiCache.delete(key);
    }
  }
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('shopbill_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const currentShopId = localStorage.getItem('shopbill_active_shop_id');
  if (currentShopId) {
    config.headers['X-Shop-Id'] = currentShopId;
  }

  return config;
});

// Intercept adapter or wrapper for GET requests with high-speed in-memory cache
const originalGet = apiClient.get;
apiClient.get = function <T = any, R = AxiosResponse<T>, D = any>(
  url: string,
  config?: any
): Promise<R> {
  const shopId = localStorage.getItem('shopbill_active_shop_id') || '0';
  const queryStr = config?.params ? JSON.stringify(config.params) : '';
  const cacheKey = `${shopId}:${url}:${queryStr}`;

  const shouldSkipCache = NO_CACHE_ENDPOINTS.some((ep) => url.includes(ep));

  if (!shouldSkipCache) {
    const cached = apiCache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < DEFAULT_CACHE_TTL) {
      // Background revalidation if older than 15s
      if (now - cached.timestamp > 15 * 1000 && !inFlightRequests.has(cacheKey)) {
        const backgroundPromise = originalGet
          .call(apiClient, url, config)
          .then((res: any) => {
            apiCache.set(cacheKey, {
              data: res.data,
              status: res.status,
              statusText: res.statusText,
              headers: res.headers,
              timestamp: Date.now(),
            });
            return res;
          })
          .catch(() => {})
          .finally(() => {
            inFlightRequests.delete(cacheKey);
          });
        inFlightRequests.set(cacheKey, backgroundPromise as any);
      }

      // Return synthetic cached response immediately (0ms!)
      return Promise.resolve({
        data: cached.data,
        status: cached.status,
        statusText: cached.statusText,
        headers: cached.headers,
        config: config as any,
      } as unknown as R);
    }

    // Dedup in-flight concurrent requests to the exact same URL
    if (inFlightRequests.has(cacheKey)) {
      return inFlightRequests.get(cacheKey) as unknown as Promise<R>;
    }
  }

  const promise = originalGet
    .call(apiClient, url, config)
    .then((res: any) => {
      if (!shouldSkipCache && res.status >= 200 && res.status < 300) {
        apiCache.set(cacheKey, {
          data: res.data,
          status: res.status,
          statusText: res.statusText,
          headers: res.headers,
          timestamp: Date.now(),
        });
      }
      return res;
    })
    .finally(() => {
      inFlightRequests.delete(cacheKey);
    });

  if (!shouldSkipCache) {
    inFlightRequests.set(cacheKey, promise);
  }

  return promise;
};

// Automatic cache invalidation on mutations
const mutationMethods = ['post', 'put', 'patch', 'delete'] as const;
mutationMethods.forEach((method) => {
  const orig = (apiClient as any)[method];
  (apiClient as any)[method] = function (url: string, ...args: any[]) {
    // Invalidate caches based on mutation url
    if (url.includes('/invoices') || url.includes('/sales-returns')) {
      clearApiCache('/invoices');
      clearApiCache('/sales-returns');
      clearApiCache('/dashboard');
      clearApiCache('/products');
      clearApiCache('/customers');
      clearApiCache('/reports');
    } else if (url.includes('/products')) {
      clearApiCache('/products');
      clearApiCache('/dashboard');
    } else if (url.includes('/categories')) {
      clearApiCache('/categories');
      clearApiCache('/products');
    } else if (url.includes('/customers')) {
      clearApiCache('/customers');
      clearApiCache('/dashboard');
    } else if (url.includes('/settings') || url.includes('/shop')) {
      clearApiCache('/settings');
      clearApiCache('/shop');
    }

    return orig.apply(apiClient, [url, ...args]);
  };
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        localStorage.removeItem('shopbill_token');
        localStorage.removeItem('shopbill_user');
        clearApiCache();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
