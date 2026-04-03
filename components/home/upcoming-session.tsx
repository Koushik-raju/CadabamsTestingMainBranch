import Image from 'next/image';
import { Video } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Appointment } from '@/types';

interface Props {
  appointments?: Appointment[];
  onJoin?: () => void;
}

export function UpcomingSession({ appointments, onJoin }: Props) {
  const next = appointments?.[0];
  if (!next) return null;

  const doctor = next.doctor as { professional_name?: string; profile_image?: string } | undefined;
  const doctorName = doctor?.professional_name ?? (next.doctor_name as string | undefined) ?? 'Your Doctor';
  const profileImage = doctor?.profile_image ?? '/doctor_ananya.png';
  const dateStr = (next.appointment_date as string) ?? (next.date as string);
  const timeStr = (next.appointment_time as string) ?? (next.time as string) ?? '';
  const formattedTime = dateStr
    ? `${new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', day: '2-digit' })}, ${timeStr}`
    : 'Upcoming';

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
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full shrink-0"
            onClick={onJoin}
            aria-label="Join session"
          >
            <Video className="w-5 h-5" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
