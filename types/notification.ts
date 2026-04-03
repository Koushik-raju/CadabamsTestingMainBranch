export interface Notification {
  id: string | number;
  title?: string;
  body?: string;
  read?: boolean;
  timestamp?: string;
  [key: string]: unknown;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}
