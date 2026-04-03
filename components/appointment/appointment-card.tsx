'use client';

import { Calendar, Clock, Video, Building2, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

interface AppointmentCardProps {
  appointment: Record<string, unknown>;
  onCancel?: (id: string | number) => void;
  isPast?: boolean;
}

function getStatusColor(status: string): string {
  switch (status?.toLowerCase()) {
    case 'confirmed':
    case 'booked':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'cancelled':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    case 'completed':
      return 'bg-muted text-muted-foreground border-border';
    default:
      return 'bg-primary/10 text-primary border-primary/20';
  }
}

function formatDate(dateStr: unknown): string {
  if (!dateStr || typeof dateStr !== 'string') return 'Date TBD';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(dateStr);
  }
}

function formatTime(timeStr: unknown): string {
  if (!timeStr || typeof timeStr !== 'string') return '';
  return timeStr;
}

export function AppointmentCard({ appointment, onCancel, isPast }: AppointmentCardProps) {
  const id = appointment.id as string | number;
  const doctorRaw = appointment.doctor as Record<string, unknown> | undefined;
  const doctorName =
    (doctorRaw?.professional_name as string) ||
    (appointment.doctor_name as string) ||
    'Doctor';
  const doctorImage =
    (doctorRaw?.profile_image as string) ||
    (appointment.doctor_image as string) ||
    '';
  const date = (appointment.appointment_date as string) || (appointment.date as string);
  const time = (appointment.appointment_time as string) || (appointment.time as string);
  const mode = (appointment.mode as string) || 'online';
  const status = (appointment.status as string) || 'booked';
  const speciality =
    (doctorRaw?.speciality as string) ||
    (appointment.speciality as string) ||
    '';

  const initials = doctorName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <Card className="border-border shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12 flex-shrink-0">
            <AvatarImage src={doctorImage} alt={doctorName} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">
                  {/^Dr\.?\s/i.test(doctorName) ? doctorName : `Dr. ${doctorName}`}
                </p>
                {speciality && (
                  <p className="text-xs text-muted-foreground">{speciality}</p>
                )}
              </div>
              <Badge
                variant="outline"
                className={`text-[10px] shrink-0 capitalize ${getStatusColor(status)}`}
              >
                {status}
              </Badge>
            </div>

            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span>{formatDate(date)}</span>
              </div>
              {time && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  <span>{formatTime(time)}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {mode === 'online' ? (
                  <Video className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <Building2 className="h-3.5 w-3.5 shrink-0" />
                )}
                <span className="capitalize">{mode === 'online' ? 'Online' : 'In-person'}</span>
              </div>
            </div>
          </div>
        </div>

        {!isPast && onCancel && status !== 'cancelled' && status !== 'completed' && (
          <div className="mt-3 pt-3 border-t border-border">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 w-full"
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel appointment
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel appointment?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will cancel your appointment with{' '}
                    {/^Dr\.?\s/i.test(doctorName) ? doctorName : `Dr. ${doctorName}`}.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep it</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onCancel(id)}
                    className="bg-destructive text-white hover:bg-destructive/90"
                  >
                    Yes, cancel
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
