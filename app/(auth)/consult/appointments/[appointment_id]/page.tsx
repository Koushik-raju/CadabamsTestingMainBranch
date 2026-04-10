'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ChevronRight,
  MoreHorizontal,
  Calendar,
  Video,
  Building2,
  Loader2,
  AlertCircle,
  ClipboardList,
  BookOpen,
  FileText,
  RefreshCw,
  XCircle,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BackButton } from '@/components/shared/navigation/back-button';
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
import {
  getAppointments,
  getAppointmentsPrevious,
  getAppointmentsMediums,
  putAppointmentsCancelBySlotId,
} from '@/sdk/auth-and-crm';
import type { AppointmentDetail } from '@/sdk/auth-and-crm';

// ── helpers ────────────────────────────────────────────────────────────────────

function cleanDoctorName(raw: string): string {
  const name = raw.includes(',') ? raw.split(',').pop()!.trim() : raw.trim();
  return /^Dr\.?\s/i.test(name) ? name : `Dr. ${name}`;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const isToday = new Date().toDateString() === d.toDateString();
    if (isToday) return 'Today';
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return '';
  }
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
}

// ── PrepareItem ────────────────────────────────────────────────────────────────

function PrepareItem({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-4 py-4 border-b border-border/60 last:border-0 text-left"
    >
      <div className="h-11 w-11 rounded-full bg-orange-50 flex items-center justify-center shrink-0 text-primary">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-foreground leading-snug">
          {title}
        </p>
        <p className="text-sm text-muted-foreground leading-snug mt-0.5">
          {subtitle}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </button>
  );
}

// ── DetailContent ─────────────────────────────────────────────────────────────

function DetailContent() {
  const router = useRouter();
  const { appointment_id } = useParams<{ appointment_id: string }>();

  const [apt, setApt] = useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [mediumId, setMediumId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    const id = Number(appointment_id);
    Promise.all([
      getAppointments({ query: { start_datetime: new Date(0).toISOString() } }),
      getAppointmentsPrevious(),
      getAppointmentsMediums(),
    ])
      .then(([upRes, pastRes, mediumsRes]) => {
        const all = [...(upRes.data ?? []), ...(pastRes.data ?? [])];
        const found = all.find((a) => a.id === id);
        if (found) setApt(found);
        else setNotFound(true);
        const mediums = mediumsRes.data ?? [];
        const online =
          mediums.find((m) => m.name.toLowerCase().includes('online')) ??
          mediums[0];
        if (online) setMediumId(online.id);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [appointment_id]);

  const handleCancel = async () => {
    if (!apt || !cancelReason.trim() || mediumId === null) return;

    setCancelling(true);
    try {
      const { data, error } = await putAppointmentsCancelBySlotId({
        path: { slotId: apt.id },
        body: { medium_id: mediumId, cancel_reason: cancelReason.trim() },
      });
      console.log({ error, data });
      router.push('/consult/appointments');
    } catch (err) {
      console.error(err);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !apt) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-destructive">Appointment not found.</p>
        <Button variant="outline" onClick={() => router.back()}>
          Go back
        </Button>
      </div>
    );
  }

  const doctorName = cleanDoctorName(
    typeof apt.doctor[1] === 'string' ? apt.doctor[1] : 'Doctor'
  );
  const speciality =
    typeof apt.speciality_id[1] === 'string' ? apt.speciality_id[1] : '';
  const isVirtual = apt.virtual_consultation_url !== false;
  const isCancelled = apt.availability?.toLowerCase() === 'cancelled';
  const isCompleted = apt.availability?.toLowerCase() === 'completed';
  const isPast = isCancelled || isCompleted;
  const initials = doctorName
    .replace(/^Dr\.?\s*/i, '')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-6 pb-2">
        <BackButton fallback="/consult/appointments" />
        <h1 className="text-[17px] font-bold">Session Details</h1>
        <button
          type="button"
          className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
        >
          <MoreHorizontal className="h-6 w-6" />
        </button>
      </div>

      <div className="flex-1 px-5 pb-28 space-y-6 overflow-y-auto">
        {/* Doctor profile */}
        <div className="flex flex-col items-center pt-4 pb-2 gap-3">
          <div className="relative">
            <Avatar className="h-24 w-24 border-2 border-border">
              <AvatarImage
                src={apt.doctor_image_url || ''}
                alt={doctorName}
                className="object-cover"
              />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="absolute bottom-1.5 right-1.5 h-4 w-4 rounded-full bg-green-500 border-2 border-white" />
          </div>
          <div className="text-center">
            <p className="text-[22px] font-bold text-foreground leading-tight">
              {doctorName}
            </p>
            {speciality && (
              <p className="text-[15px] text-muted-foreground mt-0.5">
                {speciality}
              </p>
            )}
          </div>
        </div>

        {/* Date & Type — single card, two columns */}
        <div className="bg-[#f5f5f5] rounded-2xl flex overflow-hidden">
          <div className="flex-1 p-4">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
              Date &amp; Time
            </p>
            <div className="flex items-start gap-2">
              <Calendar className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-[15px] font-bold text-foreground leading-snug">
                  {formatDate(apt.start_datetime)},
                </p>
                <p className="text-[15px] font-bold text-foreground leading-snug">
                  {formatTime(apt.start_datetime)}
                </p>
              </div>
            </div>
          </div>
          <div className="w-px bg-border/50 my-3" />
          <div className="flex-1 p-4">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
              Type
            </p>
            <div className="flex items-center gap-2">
              {isVirtual ? (
                <Video className="h-5 w-5 text-primary shrink-0" />
              ) : (
                <Building2 className="h-5 w-5 text-primary shrink-0" />
              )}
              <p className="text-[15px] font-bold text-foreground">
                {isVirtual ? 'Video Call' : 'In-person'}
              </p>
            </div>
          </div>
        </div>

        {/* Join button */}
        {isVirtual && !isPast && (
          <div className="space-y-2.5">
            <button
              type="button"
              className="w-full h-14 rounded-full bg-primary text-white text-[17px] font-bold flex items-center justify-center gap-2.5 active:opacity-90 transition-opacity"
              onClick={() => {
                if (typeof apt.virtual_consultation_url === 'string') {
                  window.open(apt.virtual_consultation_url, '_blank');
                }
              }}
            >
              <Video className="h-5 w-5" />
              Join Session
            </button>
            <p className="flex items-center justify-center gap-1.5 text-[13px] text-muted-foreground">
              <Info className="h-4 w-4 shrink-0" />
              You can join 10 minutes before start time
            </p>
          </div>
        )}

        {/* Prepare for Session */}
        {!isPast && (
          <div>
            <h2 className="text-[19px] font-bold text-foreground mb-3">
              Prepare for Session
            </h2>
            <div className="bg-white rounded-2xl border border-border px-4">
              <PrepareItem
                icon={<ClipboardList className="h-5 w-5" />}
                title="Pre-session Check-in"
                subtitle="Complete a quick check-in before your session"
                onClick={() => router.push('/assessment')}
              />
              <PrepareItem
                icon={<BookOpen className="h-5 w-5" />}
                title="Share Journal"
                subtitle={`Select entries to share with ${doctorName}`}
                onClick={() => router.push('/self-journaling')}
              />
              <PrepareItem
                icon={<FileText className="h-5 w-5" />}
                title="Previous Notes"
                subtitle="Review notes from last session"
                onClick={() => router.push('/consult/appointments')}
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom actions */}
      {!isPast && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border px-5 py-4 flex gap-3 items-center">
          <button
            type="button"
            className="flex-1 h-12 flex items-center justify-center gap-2 text-[15px] font-semibold text-foreground hover:bg-muted rounded-full transition-colors"
            onClick={() => router.push(`/consult/booking/${apt.doctor[0]}`)}
          >
            <RefreshCw className="h-4.5 w-4.5" />
            Reschedule
          </button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                disabled={cancelling}
                className="flex-1 h-12 flex items-center justify-center gap-2 text-[15px] font-semibold text-destructive border border-destructive/40 rounded-full hover:bg-destructive/5 transition-colors disabled:opacity-60"
              >
                {cancelling ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4.5 w-4.5" />
                )}
                Cancel
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel appointment?</AlertDialogTitle>
                <AlertDialogDescription>
                  Please provide a reason to cancel your session with{' '}
                  {doctorName}.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="space-y-3 py-1">
                <div className="space-y-1.5">
                  <p className="text-sm font-medium">
                    Reason for cancellation{' '}
                    <span className="text-destructive">*</span>
                  </p>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Tell us more about why you're cancelling…"
                    rows={3}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel
                  onClick={() => {
                    setCancelReason('');
                  }}
                >
                  Keep it
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCancel}
                  disabled={!cancelReason.trim()}
                  className="bg-destructive text-white hover:bg-destructive/90 disabled:opacity-50"
                >
                  Yes, cancel
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}

export default function AppointmentDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <DetailContent />
    </Suspense>
  );
}
