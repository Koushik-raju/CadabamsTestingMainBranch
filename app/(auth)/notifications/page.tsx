/**
 * FILE: app/(auth)/notifications/page.tsx
 *
 * PURPOSE:
 *   Lists local push notifications stored on device, split into unread and read
 *   sections. Provides a "Clear all" action to wipe the notification store.
 *
 * LOGIC OVERVIEW:
 *   1. Reads notifications from getStoredNotifications() on mount.
 *   2. Clicking a notification marks it as read and navigates to its action URL.
 *   3. "Clear all" triggers an AlertDialog then clears the store.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   notifications — LocalNotification[] from local storage
 *   unread / read — filtered slices of notifications list
 *
 * DEPENDENCIES:
 *   getStoredNotifications, markNotificationAsRead, clearAllNotifications
 *     — from use-notifications
 *   PageHeader — shared navigation header
 *
 * LAST UPDATED: 2026-04-28 — Neo design system: shadow scale, color tokens, border radius
 */
"use client";

import {
  Bell,
  CalendarCheck,
  ChevronRight,
  Megaphone,
  Route,
  Stethoscope,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/navigation/page-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  clearAllNotifications,
  getStoredNotifications,
  type LocalNotification,
  markNotificationAsRead,
} from "@/hooks/notifications/use-notifications";
import { cn } from "@/lib/utils";

function formatTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return diffMins <= 1 ? "Just now" : `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function getNotifConfig(n: LocalNotification): {
  gradient: string;
  Icon: React.ElementType;
} {
  const text = `${n.title ?? ""} ${n.body ?? ""} ${n.action ?? ""}`.toLowerCase();

  if (n.journeyName || text.includes("journey"))
    return { gradient: "from-violet-500 to-purple-600", Icon: Route };
  if (text.includes("appointment") || text.includes("session") || text.includes("book"))
    return { gradient: "from-emerald-500 to-teal-600", Icon: CalendarCheck };
  if (text.includes("doctor") || text.includes("consult") || text.includes("prescription"))
    return { gradient: "from-sky-500 to-blue-600", Icon: Stethoscope };
  return { gradient: "from-orange-400 to-amber-500", Icon: Megaphone };
}

function NotificationRow({
  n,
  onClick,
  isLast,
}: {
  n: LocalNotification;
  onClick: () => void;
  isLast: boolean;
}) {
  const { gradient, Icon } = getNotifConfig(n);

  return (
    <div>
      <div
        className={cn(
          "flex items-start gap-3 py-3 px-1 cursor-pointer transition-colors rounded-3xl",
          !n.read && "bg-primary/5",
        )}
        onClick={onClick}
        role="button"
        tabIndex={0}
        aria-label={n.title ?? "Notification"}
        onKeyDown={(e) => e.key === "Enter" && onClick()}
      >
        {/* Colored icon avatar */}
        <div
          className={cn(
            "relative w-11 h-11 rounded-2xl bg-gradient-to-br flex-shrink-0 flex items-center justify-center overflow-hidden shadow-[var(--sh-1)]",
            gradient,
          )}
        >
          <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white/10" />
          <Icon className="w-5 h-5 text-white" aria-hidden="true" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p
              className={cn(
                "text-sm leading-snug truncate",
                n.read ? "text-muted-foreground font-normal" : "text-foreground font-medium",
              )}
            >
              {n.title ?? "Notification"}
            </p>
            {!n.read && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" aria-label="Unread" />
            )}
          </div>
          {n.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>}
          {n.journeyName && (
            <p className="text-[10px] text-violet-600 font-medium mt-0.5">{n.journeyName}</p>
          )}
        </div>

        {/* Time + chevron */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="text-[10px] text-muted-foreground">{formatTime(n.receivedAt)}</span>
          {n.action && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
        </div>
      </div>
      {!isLast && <Separator />}
    </div>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<LocalNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    setNotifications(getStoredNotifications());
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const handleClick = (n: LocalNotification) => {
    markNotificationAsRead(n.id);
    setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    if (n.action) router.push(n.action);
  };

  const handleClearAll = () => {
    clearAllNotifications();
    setNotifications([]);
  };

  const unread = notifications.filter((n) => !n.read);
  const read = notifications.filter((n) => n.read);

  return (
    <main className="min-h-screen bg-background pb-24">
      <PageHeader
        title="Notifications"
        subtitle={unread.length > 0 ? `${unread.length} unread` : undefined}
        fallback="/home"
        right={
          notifications.length > 0 ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5 rounded-xl"
                  aria-label="Clear all notifications"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear all
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all notifications?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove all notifications from this device.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAll}>Clear all</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : undefined
        }
      />

      <div className="px-4 space-y-5">
        {loading ? (
          <Card>
            <CardContent className="py-0 px-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-3">
                  <Skeleton className="w-11 h-11 rounded-2xl flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-2/3 rounded" />
                    <Skeleton className="h-3 w-5/6 rounded" />
                  </div>
                  <Skeleton className="w-8 h-3 rounded" />
                </div>
              ))}
            </CardContent>
          </Card>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Bell className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">You're all caught up</p>
              <p className="text-sm text-muted-foreground mt-1">No notifications right now.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Unread section */}
            {unread.length > 0 && (
              <section>
                <h2 className="text-base font-bold text-foreground mb-3">New</h2>
                <Card>
                  <CardContent className="py-0 px-3">
                    {unread.map((n, i) => (
                      <div
                        key={n.id}
                        style={{ contentVisibility: "auto", containIntrinsicSize: "0 88px" }}
                      >
                        <NotificationRow
                          n={n}
                          onClick={() => handleClick(n)}
                          isLast={i === unread.length - 1}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </section>
            )}

            {/* Read section */}
            {read.length > 0 && (
              <section>
                <h2 className="text-base font-bold text-foreground mb-3">Earlier</h2>
                <Card>
                  <CardContent className="py-0 px-3">
                    {read.map((n, i) => (
                      <div
                        key={n.id}
                        style={{ contentVisibility: "auto", containIntrinsicSize: "0 88px" }}
                      >
                        <NotificationRow
                          n={n}
                          onClick={() => handleClick(n)}
                          isLast={i === read.length - 1}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
