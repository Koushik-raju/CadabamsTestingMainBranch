import axios from 'axios';
import type { CreateClientConfig } from '@/sdk/auth-and-crm/client.gen';
import { getToken } from '@/lib/token';
import { attachRefreshInterceptor } from '@/lib/interceptors';

// Create a standalone axios instance — avoids the circular dependency that
// occurs when importing `client` from client.gen (which itself imports this file).
const instance = axios.create();
attachRefreshInterceptor(instance);

// Auth + CRM share the same lambda — unauthenticated auth endpoints ignore the header.
export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseURL:
    'https://asjkuqm3eoea6q7sqkfpuqt2ye0letxc.lambda-url.ap-south-1.on.aws/api/v1',
  auth: () => getToken(),
  instance,
});
