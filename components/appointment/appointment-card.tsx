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
import type { AppointmentDetail } from '@/sdk/auth-and-crm';

interface AppointmentCardProps {
  appointment: AppointmentDetail;
  onCancel?: (id: number) => void;
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

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export function AppointmentCard({ appointment, onCancel, isPast }: AppointmentCardProps) {
  const { id, doctor, doctor_image_url, start_datetime, availability, consultation_type_ids } = appointment;

  // doctor is [id, name] tuple
  const doctorName = typeof doctor[1] === 'string' ? doctor[1] : 'Doctor';
  const doctorImage = doctor_image_url || '';
  const speciality = typeof consultation_type_ids[1] === 'string' ? consultation_type_ids[1] : '';
  const status = availability || 'booked';
  const isVirtual = appointment.virtual_consultation_url !== false;

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
                <span>{formatDate(start_datetime)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span>{formatTime(start_datetime)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {isVirtual ? (
                  <Video className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <Building2 className="h-3.5 w-3.5 shrink-0" />
                )}
                <span>{isVirtual ? 'Online' : 'In-person'}</span>
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
