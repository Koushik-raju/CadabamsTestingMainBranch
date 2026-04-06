'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Plus, CalendarX } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BackButton } from '@/components/common/back-button';
import { AppointmentCard } from '@/components/appointment/appointment-card';
import { getAppointments, getAppointmentsPrevious } from '@/sdk/auth-and-crm';
import type { AppointmentDetail } from '@/sdk/auth-and-crm';

export default function AppointmentsPage() {
  const [upcoming, setUpcoming] = useState<AppointmentDetail[]>([]);
  const [past,     setPast]     = useState<AppointmentDetail[]>([]);
  const [loading,  setLoading]  = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [upRes, pastRes] = await Promise.all([
        getAppointments({ query: { start_datetime: new Date().toISOString() } }),
        getAppointmentsPrevious(),
      ]);
      setUpcoming(upRes.data ?? []);
      setPast(pastRes.data ?? []);
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const total = upcoming.length + past.length;

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <BackButton fallback="/home" />
        <h1 className="text-xl font-bold text-foreground">My Appointments</h1>
      </div>

      {loading && (
        <div className="px-4 space-y-3">
          <Skeleton className="h-10 w-full rounded-full" />
          {[0, 1, 2].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
        </div>
      )}

      {!loading && total === 0 && (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center gap-4">
          <CalendarX className="h-16 w-16 text-muted-foreground/50" />
          <div>
            <p className="text-lg font-semibold text-foreground">No appointments yet</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
              Schedule a session with a therapist and take the first step toward feeling better.
            </p>
          </div>
          <Button asChild className="rounded-full px-8 mt-2">
            <Link href="/find-therapist">
              <Plus className="h-4 w-4 mr-1.5" strokeWidth={3} />
              Schedule appointment
            </Link>
          </Button>
        </div>
      )}

      {!loading && total > 0 && (
        <div className="px-4 pb-24">
          <Tabs defaultValue="upcoming">
            <TabsList className="w-full rounded-full mb-4">
              <TabsTrigger value="upcoming" className="flex-1 rounded-full">
                Upcoming ({upcoming.length})
              </TabsTrigger>
              <TabsTrigger value="past" className="flex-1 rounded-full">
                Past ({past.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-3 mt-0">
              {upcoming.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-muted-foreground text-sm">No upcoming appointments</p>
                  <Button asChild variant="outline" className="mt-4 rounded-full">
                    <Link href="/find-therapist">
                      <Plus className="h-4 w-4 mr-1.5" />
                      Book one now
                    </Link>
                  </Button>
                </div>
              ) : (
                upcoming.map(apt => <AppointmentCard key={apt.id} appointment={apt} isPast={false} />)
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-3 mt-0">
              {past.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-10">No past appointments</p>
              ) : (
                past.map(apt => <AppointmentCard key={apt.id} appointment={apt} isPast />)
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}

      {!loading && total > 0 && (
        <div className="fixed bottom-6 right-4">
          <Button asChild size="lg" className="rounded-full shadow-lg gap-2">
            <Link href="/find-therapist">
              <Plus className="h-5 w-5" strokeWidth={3} />
              New
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
