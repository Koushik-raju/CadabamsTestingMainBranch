"use client";

import useSWR from "swr";
import { useAuth } from "@/hooks/shared/auth/use-auth";
import type { NotificationSettingsResponseDto } from "@/sdk/backend-v2";
import {
  crmControllerEnableNotifications,
  crmControllerGetNotificationSettings,
} from "@/sdk/backend-v2";

// ─── Local notification storage (push notifications) ─────────────────────────

const LOCAL_KEY = "local_notifications";

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
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as LocalNotification[]) : [];
  } catch {
    return [];
  }
}

export function storeNotification(
  notification: Omit<LocalNotification, "id" | "read" | "receivedAt">,
): void {
  if (typeof window === "undefined") return;
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
  if (typeof window === "undefined") return;
  const updated = getStoredNotifications().map((n) => (n.id === id ? { ...n, read: true } : n));
  localStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
}

export function clearAllNotifications(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LOCAL_KEY);
}

export function getUnreadCount(): number {
  return getStoredNotifications().filter((n) => !n.read).length;
}

// ─── Notification settings hook ──────────────────────────────────────────────

export function useNotificationSettings() {
  const { user } = useAuth();
  const leadId = user?.lead_id ? String(user.lead_id) : null;

  const { data, isLoading, error, mutate } = useSWR(
    leadId ? `/notification-settings/${leadId}` : null,
    async () => {
      const res = await crmControllerGetNotificationSettings({
        query: { leadId: Number(leadId!) },
      });
      return (res.data as NotificationSettingsResponseDto) ?? null;
    },
    { revalidateOnFocus: false },
  );

  async function enableNotifications(params: Record<string, unknown>) {
    await crmControllerEnableNotifications({ body: params as never });
    await mutate();
  }

  return { settings: data ?? null, isLoading, error, enableNotifications };
}
