import axios from 'axios';
import OAuth from 'oauth-1.0a';
import crypto from 'crypto';
import {
  ConsumerKey, ConsumerSecret, AccessToken, TokenSecret,
  HOS_ConsumerKey, HOS_ConsumerSecret, HOS_AccessToken, HOS_TokenSecret,
  BEARER_TOKEN,
} from '@/config/env';

function createOAuthClient(consumerKey: string, consumerSecret: string) {
  return new OAuth({
    consumer: { key: consumerKey, secret: consumerSecret },
    signature_method: 'HMAC-SHA1',
    hash_function(base, key) {
      return crypto.createHmac('sha1', key).update(base).digest('base64');
    },
  });
}

function getOAuthHeaders(
  oauth: OAuth,
  token: OAuth.Token,
  method: string,
  url: string
): Record<string, string> {
  const requestData = { url, method };
  const headers = oauth.toHeader(oauth.authorize(requestData, token));
  return { Authorization: headers.Authorization };
}

// CRM API client (OAuth 1.0)
export const crmClient = axios.create();
crmClient.interceptors.request.use((config) => {
  const oauth = createOAuthClient(ConsumerKey, ConsumerSecret);
  const token: OAuth.Token = { key: AccessToken, secret: TokenSecret };
  const method = (config.method ?? 'GET').toUpperCase();
  const url = (config.baseURL ?? '') + (config.url ?? '');
  const headers = getOAuthHeaders(oauth, token, method, url);
  config.headers.set('Authorization', headers.Authorization);
  return config;
});

// Hospital API client (different OAuth credentials)
export const hosClient = axios.create();
hosClient.interceptors.request.use((config) => {
  const oauth = createOAuthClient(HOS_ConsumerKey, HOS_ConsumerSecret);
  const token: OAuth.Token = { key: HOS_AccessToken, secret: HOS_TokenSecret };
  const method = (config.method ?? 'GET').toUpperCase();
  const url = (config.baseURL ?? '') + (config.url ?? '');
  const headers = getOAuthHeaders(oauth, token, method, url);
  config.headers.set('Authorization', headers.Authorization);
  return config;
});

// Backend API client (Bearer token)
export const backendClient = axios.create({
  headers: { Authorization: `Bearer ${BEARER_TOKEN}` },
});
