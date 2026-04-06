import Image from 'next/image';
import { Video } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { AppointmentDetail } from '@/sdk/auth-and-crm';

interface Props {
  appointments?: AppointmentDetail[];
  onJoin?: () => void;
}

function formatAppointmentTime(startDatetime: string): string {
  try {
    const d = new Date(startDatetime);
    return `${d.toLocaleDateString('en-IN', { month: 'short', day: '2-digit' })}, ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
  } catch {
    return 'Upcoming';
  }
}

export function UpcomingSession({ appointments, onJoin }: Props) {
  const next = appointments?.[0];
  if (!next) return null;

  const doctorName = typeof next.doctor[1] === 'string' ? next.doctor[1] : 'Your Doctor';
  const profileImage = next.doctor_image_url || '/doctor_ananya.png';
  const formattedTime = formatAppointmentTime(next.start_datetime);
  const isVirtual = next.virtual_consultation_url !== false;

  return (
    <div className="px-4 mb-24">
      <Card>
        <CardContent className="flex items-center gap-4 pt-5">
          <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 relative">
            <Image src={profileImage} alt={doctorName} fill className="object-cover" />
          </div>
          <div className="flex-grow">
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1 block">
              UPCOMING SESSION
            </span>
            <h4 className="text-md font-bold line-clamp-1">{doctorName}</h4>
            <p className="text-muted-foreground text-xs font-medium">{formattedTime}</p>
          </div>
          {isVirtual && (
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full shrink-0"
              onClick={onJoin}
              aria-label="Join session"
            >
              <Video className="w-5 h-5" />
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
