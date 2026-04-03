import { crmClient, hosClient, backendClient } from './api-client';

export const crmFetcher = (url: string) =>
  crmClient.get(url).then((r) => r.data);

export const hosFetcher = (url: string) =>
  hosClient.get(url).then((r) => r.data);

export const backendFetcher = (url: string) =>
  backendClient.get(url).then((r) => r.data);
