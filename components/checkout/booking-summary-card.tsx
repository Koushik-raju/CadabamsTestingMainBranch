'use client';

import { User as UserIcon, Video, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { CrmControllerGetDoctorByIdResponse } from '@/sdk/backend-v2';

function displayName(doctor: CrmControllerGetDoctorByIdResponse | null): string {
  if (!doctor) return 'Doctor';
  const raw = (doctor.name || '').trim();
  const name = raw.includes(',') ? raw.split(',').pop()!.trim() : raw;
  return /^Dr\.?\s/i.test(name) ? name : `Dr. ${name}`;
}

function formatDatetime(iso: string | null): string {
  if (!iso) return '';
  try {
    return (
      new Date(iso).toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }) +
      ' at ' +
      new Date(iso).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      })
    );
  } catch {
    return '';
  }
}

export interface BookingSummaryCardProps {
  doctor: CrmControllerGetDoctorByIdResponse | null;
  startDatetime: string | null;
  isOnline: boolean;
}

export function BookingSummaryCard({ doctor, startDatetime, isOnline }: BookingSummaryCardProps) {
  const initials = (doctor?.name || '')
    .replace(/^Dr\.?\s*/i, '')
    .split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Appointment details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14">
            {doctor?.image && (
              <AvatarImage src={doctor.image} alt={displayName(doctor)} />
            )}
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials || <UserIcon className="h-6 w-6" />}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-foreground">
              {displayName(doctor)}
            </p>
            {doctor?.speciality_id?.[1] && (
              <p className="text-sm text-muted-foreground">
                {String(doctor.speciality_id[1])}
              </p>
            )}
          </div>
        </div>

        <Separator />

        <div className="space-y-2.5 text-sm">
          {startDatetime && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date &amp; Time</span>
              <span className="font-medium text-foreground">
                {formatDatetime(startDatetime)}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Mode</span>
            <span className="flex items-center gap-1 font-medium text-foreground">
              {isOnline ? (
                <>
                  <Video className="h-3.5 w-3.5" /> Online
                </>
              ) : (
                <>
                  <Building2 className="h-3.5 w-3.5" /> In-person
                </>
              )}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
