import Link from 'next/link';
import { CalendarCheck, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { SlotDetailDto } from '@/hooks/appointments/use-appointments-page';

interface Props {
  appointments?: SlotDetailDto[];
  onJoin?: () => void;
}

function getDoctorName(doctor: SlotDetailDto['doctor']): string {
  if (Array.isArray(doctor) && doctor.length >= 2 && typeof doctor[1] === 'string') {
    const raw = doctor[1];
    const name = raw.includes(',') ? raw.split(',').pop()!.trim() : raw.trim();
    return /^Dr\.?\s/i.test(name) ? name : `Dr. ${name}`;
  }
  return 'Doctor';
}

function getSpeciality(specialityId: SlotDetailDto['speciality_id']): string {
  if (Array.isArray(specialityId) && specialityId.length >= 2 && typeof specialityId[1] === 'string') {
    return specialityId[1];
  }
  return '';
}

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    const date = d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' });
    const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${date} • ${time}`;
  } catch { return ''; }
}

export function UpcomingSession({ appointments, onJoin }: Props) {
  if (!appointments || appointments.length === 0) return null;

  return (
    <div className="px-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-foreground">Upcoming</span>
        <Link href="/consult/appointments" className="text-sm font-medium text-primary hover:underline">
          View all →
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {appointments.map((apt) => {
          const doctorName = getDoctorName(apt.doctor);
          const speciality = getSpeciality(apt.speciality_id);
          const isVirtual = !!apt.virtual_consultation_url;

          return (
            <Link
              key={apt.id}
              href={`/consult/appointments/${apt.id}`}
              className="bg-white rounded-xl border border-border p-4 flex items-center gap-3 shadow-sm active:scale-[0.97] transition-transform"
            >
              <div className={cn(
                'relative w-11 h-11 rounded-2xl bg-gradient-to-br flex-shrink-0',
                'flex items-center justify-center overflow-hidden shadow-sm',
                'from-emerald-500 to-teal-600'
              )}>
                <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white/10" />
                <CalendarCheck className="w-5 h-5 text-white" />
              </div>

              <div className="flex-grow min-w-0">
                <h4 className="text-sm font-bold text-foreground line-clamp-1">{doctorName}</h4>
                {speciality && (
                  <p className="text-xs text-muted-foreground line-clamp-1">{speciality}</p>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDateTime(apt.start_datetime)}
                </p>
              </div>

              {isVirtual && (
                <Button
                  variant="default"
                  size="sm"
                  className="rounded-full bg-green-500 hover:bg-green-600 text-white shrink-0 gap-1.5 px-3"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onJoin?.();
                  }}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Join</span>
                </Button>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
