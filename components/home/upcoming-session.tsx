import Image from 'next/image';
import { Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AppointmentDetail } from '@/sdk/auth-and-crm';

interface Props {
  appointments?: AppointmentDetail[];
  onJoin?: () => void;
}

function formatDateTime(startDatetime: string): string {
  try {
    const d = new Date(startDatetime);
    const date = d.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const time = d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return `${date} • ${time}`;
  } catch {
    return '';
  }
}

function getDoctorName(doctor: [number | string, number | string]): string {
  return typeof doctor[1] === 'string' ? doctor[1] : 'Doctor';
}

function getSpecialization(specialityId: [number | string, number | string]): string {
  return typeof specialityId[1] === 'string' ? specialityId[1] : '';
}

export function UpcomingSession({ appointments, onJoin }: Props) {
  const hasAppointments = appointments && appointments.length > 0;

  return (
    <div className="px-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-foreground">
          Upcoming Appointments
        </h2>
        {hasAppointments && appointments.length > 2 && (
          <button className="text-sm font-medium text-primary hover:underline">
            View all →
          </button>
        )}
      </div>

      {!hasAppointments ? (
        <div className="bg-white rounded-xl border border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">
            You have no upcoming appointments
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {appointments.map((apt) => {
            const doctorName = getDoctorName(apt.doctor);
            const specialization = getSpecialization(apt.speciality_id);
            const formattedTime = formatDateTime(apt.start_datetime);
            const profileImage = apt.doctor_image_url || '/doctor_ananya.png';
            const isVirtual = apt.virtual_consultation_url !== false;

            return (
              <div
                key={apt.id}
                className="bg-white rounded-xl border border-border p-4 flex items-center gap-3 shadow-sm"
              >
                <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 relative">
                  <Image
                    src={profileImage}
                    alt={doctorName}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="flex-grow min-w-0">
                  <h4 className="text-sm font-bold text-foreground line-clamp-1">
                    {doctorName}
                  </h4>
                  {specialization && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {specialization}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formattedTime}
                  </p>
                </div>

                {isVirtual && (
                  <Button
                    variant="default"
                    size="sm"
                    className="rounded-full bg-green-500 hover:bg-green-600 text-white shrink-0 gap-1.5 px-3"
                    onClick={onJoin}
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Join</span>
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
