'use client';

import { useRouter } from 'next/navigation';
import { Calendar, Clock, Video, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { AppointmentDetail } from '@/sdk/auth-and-crm';

interface AppointmentCardProps {
  appointment: AppointmentDetail;
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
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch { return dateStr; }
}

function formatTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return dateStr; }
}

function cleanDoctorName(raw: string): string {
  const name = raw.includes(',') ? raw.split(',').pop()!.trim() : raw.trim();
  return /^Dr\.?\s/i.test(name) ? name : `Dr. ${name}`;
}

export function AppointmentCard({ appointment, isPast }: AppointmentCardProps) {
  const router = useRouter();
  const { id, doctor, doctor_image_url, start_datetime, availability, consultation_type_ids } = appointment;

  const doctorName  = cleanDoctorName(typeof doctor[1] === 'string' ? doctor[1] : 'Doctor');
  const isVirtual   = appointment.virtual_consultation_url !== false;
  const status      = availability || 'booked';
  const initials    = doctorName.replace(/^Dr\.?\s*/i, '').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <button
      type="button"
      onClick={() => router.push(`/appointments/${id}`)}
      className="w-full text-left bg-white rounded-2xl border border-border shadow-sm p-4 flex items-center gap-3 active:scale-[0.98] transition-transform"
    >
      <div className="relative shrink-0">
        <Avatar className="h-12 w-12">
          <AvatarImage src={doctor_image_url || ''} alt={doctorName} />
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        {!isPast && (
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-sm text-foreground truncate">{doctorName}</p>
          <Badge variant="outline" className={`text-[10px] shrink-0 capitalize ${getStatusColor(status)}`}>
            {status}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {typeof consultation_type_ids[1] === 'string' ? consultation_type_ids[1] : ''}
        </p>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {formatDate(start_datetime)}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatTime(start_datetime)}
          </span>
          {isVirtual
            ? <Video className="h-3 w-3 text-primary ml-auto" />
            : <Building2 className="h-3 w-3 text-muted-foreground ml-auto" />}
        </div>
      </div>
    </button>
  );
}
