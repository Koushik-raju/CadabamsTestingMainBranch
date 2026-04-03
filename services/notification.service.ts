import { crmClient } from '@/lib/api-client';
import { endpoints } from '@/config/api-endpoints';

export const notificationService = {
  async getNotifications(leadId: string | number) {
    const res = await crmClient.get(endpoints.GET_NOTIFICATION_DETAILS, {
      params: { lead_id: leadId },
    });
    return res.data;
  },

  async updateNotificationPreference(data: Record<string, unknown>) {
    const res = await crmClient.put(endpoints.PUT_NOTIFICATION_DETAILS, data);
    return res.data;
  },
};

// ── Local notification storage (push notifications wired in Phase 11) ──

const LOCAL_KEY = 'local_notifications';

export interface LocalNotification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  receivedAt: string;
  action?: string;
  journeyName?: string;
}

export function getStoredNotifications(): LocalNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as LocalNotification[]) : [];
  } catch {
    return [];
  }
}

export function storeNotification(
  notification: Omit<LocalNotification, 'id' | 'read' | 'receivedAt'>
): void {
  if (typeof window === 'undefined') return;
  const existing = getStoredNotifications();
  const next: LocalNotification = {
    ...notification,
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    read: false,
    receivedAt: new Date().toISOString(),
  };
  localStorage.setItem(LOCAL_KEY, JSON.stringify([next, ...existing]));
}

export function markNotificationAsRead(id: string): void {
  if (typeof window === 'undefined') return;
  const updated = getStoredNotifications().map((n) =>
    n.id === id ? { ...n, read: true } : n
  );
  localStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
}

export function clearAllNotifications(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LOCAL_KEY);
}

export function getUnreadCount(): number {
  return getStoredNotifications().filter((n) => !n.read).length;
}
