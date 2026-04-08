import type { AxiosInstance } from 'axios';
import { refreshPatientToken } from './auth';

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
          return axiosInstance(original); // retry with new token
        } catch {
          // Refresh failed — send user to login
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }
      }

      return Promise.reject(error);
    }
  );
}
