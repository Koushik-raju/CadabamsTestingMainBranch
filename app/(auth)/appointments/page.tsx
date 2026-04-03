'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, CalendarX } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BackButton } from '@/components/common/back-button';
import { AppointmentCard } from '@/components/appointment/appointment-card';
import { useAppointments } from '@/hooks/use-appointments';
import { useAuth } from '@/hooks/use-auth';
import { appointmentService } from '@/services/appointment.service';

function isUpcoming(apt: Record<string, unknown>): boolean {
  const dateStr = (apt.appointment_date ?? apt.date) as string | undefined;
  if (!dateStr) return true;
  try {
    return new Date(dateStr) >= new Date();
  } catch {
    return true;
  }
}

export default function AppointmentsPage() {
  const { user } = useAuth();
  const { data, isLoading, mutate } = useAppointments();
  const [cancelling, setCancelling] = useState<string | number | null>(null);

  const appointments: Record<string, unknown>[] = Array.isArray(data)
    ? data
    : Array.isArray((data as Record<string, unknown>)?.data)
    ? ((data as Record<string, unknown>).data as Record<string, unknown>[])
    : [];

  const upcoming = appointments.filter((a) => isUpcoming(a));
  const past = appointments.filter((a) => !isUpcoming(a));

  const handleCancel = useCallback(
    async (id: string | number) => {
      if (!user?.lead_id) return;
      setCancelling(id);
      try {
        await appointmentService.cancelAppointment({
          appointment_id: id,
          lead_id: user.lead_id,
        });
        await mutate();
      } catch (err) {
        console.error('Failed to cancel appointment:', err);
      } finally {
        setCancelling(null);
      }
    },
    [user, mutate]
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <BackButton fallback="/" />
        <h1 className="text-xl font-bold text-foreground">My Appointments</h1>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="px-4 space-y-3">
          <Skeleton className="h-10 w-full rounded-full" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-xl" />
          ))}
        </div>
      )}

      {/* Loaded state */}
      {!isLoading && (
        <>
          {appointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center gap-4">
              <CalendarX className="h-16 w-16 text-muted-foreground/50" />
              <div>
                <p className="text-lg font-semibold text-foreground">
                  No appointments yet
                </p>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                  You have no therapist appointments. Schedule one and take the
                  first step toward feeling better.
                </p>
              </div>
              <Button asChild className="rounded-full px-8 mt-2">
                <Link href="/find-therapist">
                  <Plus className="h-4 w-4 mr-1.5" strokeWidth={3} />
                  Schedule appointment
                </Link>
              </Button>
            </div>
          ) : (
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
                      <p className="text-muted-foreground text-sm">
                        No upcoming appointments
                      </p>
                      <Button asChild variant="outline" className="mt-4 rounded-full">
                        <Link href="/find-therapist">
                          <Plus className="h-4 w-4 mr-1.5" />
                          Book one now
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    upcoming.map((apt) => (
                      <AppointmentCard
                        key={String(apt.id)}
                        appointment={apt}
                        onCancel={cancelling ? undefined : handleCancel}
                        isPast={false}
                      />
                    ))
                  )}
                </TabsContent>

                <TabsContent value="past" className="space-y-3 mt-0">
                  {past.length === 0 ? (
                    <p className="text-center text-muted-foreground text-sm py-10">
                      No past appointments
                    </p>
                  ) : (
                    past.map((apt) => (
                      <AppointmentCard
                        key={String(apt.id)}
                        appointment={apt}
                        isPast={true}
                      />
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </>
      )}

      {/* FAB to book new */}
      {!isLoading && appointments.length > 0 && (
        <div className="fixed bottom-6 right-4">
          <Button asChild size="lg" className="rounded-full shadow-lg gap-2">
            <Link href="/find-therapist">
              <Plus className="h-5 w-5" strokeWidth={3} />
              New appointment
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
