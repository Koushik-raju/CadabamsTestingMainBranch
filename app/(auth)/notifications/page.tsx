'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Trash2, ChevronRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
} from '@/components/ui/alert-dialog';
import {
  getStoredNotifications,
  markNotificationAsRead,
  clearAllNotifications,
  type LocalNotification,
} from '@/services/notification.service';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="home-header-gradient px-4 pt-12 pb-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => router.back()}
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Notifications</h1>
          </div>
          {notifications.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" aria-label="Clear all">
                  <Trash2 className="w-5 h-5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all notifications?</AlertDialogTitle>
                  <AlertDialogDescription>This will remove all notifications from this device.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAll}>Clear all</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col gap-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))
        ) : notifications.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground py-20">
            <Bell className="w-12 h-12 opacity-30" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          notifications.map((n) => (
            <Card
              key={n.id}
              className={`cursor-pointer transition-all active:scale-[0.98] ${
                !n.read ? 'border-l-4 border-l-primary' : ''
              }`}
              onClick={() => handleClick(n)}
              role="article"
              aria-label={n.title}
            >
              <CardHeader className="pb-1 pt-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{n.title ?? 'Notification'}</span>
                    {n.journeyName && (
                      <Badge variant="secondary" className="text-[10px]">Journey</Badge>
                    )}
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    {formatDate(n.receivedAt)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-0 pb-4 flex items-center justify-between">
                <p className="text-muted-foreground text-sm">{n.body ?? 'No content'}</p>
                {n.action && <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
