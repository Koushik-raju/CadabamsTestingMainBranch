import axios from 'axios';
import type { CreateClientConfig } from '@/sdk/strapi/client.gen';
import { getAccessToken } from '@/lib/cookies';
import { attachRefreshInterceptor } from '@/lib/interceptors';

// Create a standalone axios instance — avoids the circular dependency that
// occurs when importing `client` from client.gen (which itself imports this file).
const instance = axios.create();

// Only attach the refresh interceptor in the browser.
// refreshPatientToken() writes cookies via document.cookie and is client-only.
if (typeof window !== 'undefined') {
  attachRefreshInterceptor(instance);
}

// This is new strapi (Custom service we use for that.)
export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseURL: 'https://console.mindtalkbuddy.com/api/v1',
  auth: async () => (await getAccessToken()) ?? '',
  instance,
});
