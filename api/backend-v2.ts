import axios from "axios";
import type { CreateClientConfig } from "@/sdk/backend-v2/client.gen";
import { attachAuthInterceptor, attachRefreshInterceptor } from "@/lib/interceptors";

const instance = axios.create();

if (typeof window !== "undefined") {
  attachAuthInterceptor(instance);
  attachRefreshInterceptor(instance);
}

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
  axios: instance,   // key must be `axios`, not `instance`
});
