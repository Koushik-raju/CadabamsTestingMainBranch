import axios from 'axios';
import type { CreateClientConfig } from '@/sdk/strapi/client.gen';
import { getAccessToken } from '@/lib/cookies';
import { attachRefreshInterceptor } from '@/lib/interceptors';

// Create a standalone axios instance — avoids the circular dependency that
// occurs when importing `client` from client.gen (which itself imports this file).
const instance = axios.create();

instance.interceptors.request.use((config) => {
  console.log('[Strapi] REQUEST', config.method?.toUpperCase(), config.url, {
    headers: config.headers,
    params: config.params,
    data: config.data,
  });
  return config;
});

instance.interceptors.response.use(
  (response) => {
    console.log('[Strapi] RESPONSE', response.status, response.config.url, {
      headers: response.headers,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error(
      '[Strapi] ERROR',
      error?.response?.status,
      error?.config?.url,
      {
        requestHeaders: error?.config?.headers,
        responseHeaders: error?.response?.headers,
        data: error?.response?.data,
        message: error?.message,
      }
    );
    return Promise.reject(error);
  }
);

// Only attach the refresh interceptor in the browser.
// refreshPatientToken() writes cookies via document.cookie and is client-only.
if (typeof window !== 'undefined') {
  attachRefreshInterceptor(instance);
}

// This is new strapi (Custom service we use for that.)
export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseURL: 'https://console.mindtalkbuddy.com',
  auth: async () => (await getAccessToken()) ?? '',
  instance,
});
