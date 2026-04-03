'use client';

import { Star, Video, Building2, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export interface DoctorCardProps {
  doctor: Record<string, unknown>;
  mode?: string;
  centerName?: string;
  onBook: (doctor: Record<string, unknown>) => void;
}

function processDoctorImage(imageData: unknown): string | null {
  if (!imageData) return null;
  try {
    const cleaned =
      typeof imageData === 'string'
        ? imageData.replace(/^["']|["']$/g, '').replace(/\\n|\n|\r/g, '')
        : null;
    if (cleaned) {
      if (cleaned.startsWith('data:image')) return cleaned;
      if (cleaned.startsWith('/9j/')) return `data:image/jpeg;base64,${cleaned}`;
      if (cleaned.startsWith('iVBOR')) return `data:image/png;base64,${cleaned}`;
      if (cleaned.startsWith('http') || cleaned.startsWith('/')) return cleaned;
    }
  } catch {
    // ignore
  }
  return null;
}

function displayName(name: unknown): string {
  const raw = (String(name || '')).trim();
  if (!raw) return 'Doctor';
  return /^Dr\.?\s/i.test(raw) ? raw : `Dr. ${raw}`;
}

export function DoctorCard({ doctor, mode, centerName, onBook }: DoctorCardProps) {
  const imgSrc = processDoctorImage(doctor.image ?? doctor.profile_image);
  const name = displayName(doctor.name ?? doctor.professional_name);
  const speciality =
    (Array.isArray(doctor.speciality_id) ? doctor.speciality_id[1] : doctor.speciality_id) ||
    (doctor.speciality as string) ||
    'Specialist';
  const rating = (doctor.rating ?? doctor.star_rating ?? '4.9') as string | number;
  const sessionFee = (doctor.consultation_fee ?? doctor.session_fee ?? doctor.fee) as
    | number
    | string
    | undefined;
  const tags = ((doctor.illness_treated as unknown[]) || [])
    .slice(0, 3)
    .map((t) => (Array.isArray(t) ? (t[0] as string) : String(t)));
  const langList = ((doctor.language_preference as unknown[]) || [])
    .map((l) => (Array.isArray(l) ? (l[1] as string) : String(l)))
    .filter(Boolean)
    .slice(0, 3);

  const initials = name
    .replace(/^Dr\.?\s*/i, '')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <Card className="border-border shadow-sm">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className="relative flex-shrink-0">
            <Avatar className="h-14 w-14">
              <AvatarImage src={imgSrc ?? undefined} alt={name} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {initials || <User className="h-6 w-6" />}
              </AvatarFallback>
            </Avatar>
            <span className="absolute -bottom-1 -right-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-foreground text-background text-[10px] font-medium">
              <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
              {rating}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground">{name}</p>
            <p className="text-xs text-muted-foreground">{speciality}</p>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {tags.map((t, i) => (
                  <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0.5 h-auto">
                    {t}
                  </Badge>
                ))}
              </div>
            )}

            {langList.length > 0 && (
              <p className="text-[10px] text-muted-foreground mt-1">
                Languages: {langList.join(', ')}
              </p>
            )}

            <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
              {mode === 'online' ? (
                <span className="flex items-center gap-0.5">
                  <Video className="h-3 w-3" /> Online
                </span>
              ) : (
                centerName && (
                  <span className="flex items-center gap-0.5">
                    <Building2 className="h-3 w-3" /> {centerName}
                  </span>
                )
              )}
            </div>

            {sessionFee != null && sessionFee !== '' && (
              <p className="text-xs font-semibold text-foreground mt-1">
                ₹{sessionFee} / session
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-4 pt-3 border-t border-border">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => onBook(doctor)}
          >
            View Profile
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-foreground text-background hover:bg-foreground/90"
            onClick={() => onBook(doctor)}
          >
            Book Appointment
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
