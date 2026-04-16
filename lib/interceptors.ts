import type { AxiosInstance } from 'axios';
import { getAccessToken } from '@/lib/cookies';
import { refreshPatientToken } from './auth';

/** Attaches the access token as a Bearer header on every outgoing request. */
export function attachAuthInterceptor(axiosInstance: AxiosInstance) {
  axiosInstance.interceptors.request.use(async (config) => {
    const token = await getAccessToken();
    if (token) {
      config.headers = config.headers ?? {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  });
}

/** On 401, silently refreshes the token and retries the original request once. */
export function attachRefreshInterceptor(axiosInstance: AxiosInstance) {
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const original = error.config;

      if (error.response?.status === 401 && !original._retry) {
        original._retry = true;

        try {
          const tokenData = await refreshPatientToken();
          original.headers = {
            ...original.headers,
            Authorization: `Bearer ${tokenData.accessToken}`,
          };
          return axiosInstance(original);
        } catch {
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
          return Promise.reject(error);
        }
      }

      return Promise.reject(error);
    }
  );
}
