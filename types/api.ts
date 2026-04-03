export interface ApiResponse<T = unknown> {
  data: T;
  status?: number;
  message?: string;
}

export interface PaginatedResponse<T = unknown> {
  data: T[];
  total?: number;
  page?: number;
  limit?: number;
}

export interface OAuthConfig {
  consumerKey: string;
  consumerSecret: string;
  accessToken: string;
  tokenSecret: string;
}
