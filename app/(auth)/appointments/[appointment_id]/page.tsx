'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import {
  ChevronLeft,
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
  putAppointmentsCancelBySlotId,
} from '@/sdk/auth-and-crm';
import type { AppointmentDetail } from '@/sdk/auth-and-crm';

// ── helpers ────────────────────────────────────────────────────────────────────

function cleanDoctorName(raw: string): string {
  const name = raw.includes(',') ? raw.split(',').pop()!.trim() : raw.trim();
  return /^Dr\.?\s/i.test(name) ? name : `Dr. ${name}`;
}

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    const isToday = new Date().toDateString() === d.toDateString();
    const date = isToday ? 'Today' : d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${date}, ${time}`;
  } catch { return iso; }
}

// ── PrepareItem ────────────────────────────────────────────────────────────────

function PrepareItem({
  icon, title, subtitle, onClick,
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
      className="w-full flex items-center gap-3 py-3.5 border-b border-border last:border-0 text-left"
    >
      <div className="h-9 w-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0 text-primary">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <ChevronLeft className="h-4 w-4 text-muted-foreground rotate-180 shrink-0" />
    </button>
  );
}

// ── DetailContent ─────────────────────────────────────────────────────────────

function DetailContent() {
  const router = useRouter();
  const { appointment_id } = useParams<{ appointment_id: string }>();

  const [apt,       setApt]       = useState<AppointmentDetail | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [notFound,  setNotFound]  = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const id = Number(appointment_id);
    Promise.all([
      getAppointments({ query: { start_datetime: new Date(0).toISOString() } }),
      getAppointmentsPrevious(),
    ]).then(([upRes, pastRes]) => {
      const all = [...(upRes.data ?? []), ...(pastRes.data ?? [])];
      const found = all.find(a => a.id === id);
      if (found) setApt(found);
      else setNotFound(true);
    }).catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [appointment_id]);

  const handleCancel = async () => {
    if (!apt) return;
    setCancelling(true);
    try {
      await putAppointmentsCancelBySlotId({ path: { slotId: apt.id } });
      router.replace('/appointments');
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
        <Button variant="outline" onClick={() => router.back()}>Go back</Button>
      </div>
    );
  }

  const doctorName  = cleanDoctorName(typeof apt.doctor[1] === 'string' ? apt.doctor[1] : 'Doctor');
  const speciality  = typeof apt.speciality_id[1] === 'string' ? apt.speciality_id[1] : '';
  const isVirtual   = apt.virtual_consultation_url !== false;
  const isCancelled = apt.availability?.toLowerCase() === 'cancelled';
  const isCompleted = apt.availability?.toLowerCase() === 'completed';
  const isPast      = isCancelled || isCompleted;
  const initials    = doctorName.replace(/^Dr\.?\s*/i, '').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-6 pb-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-base font-semibold">Session Details</h1>
        <button
          type="button"
          className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 px-4 pb-32 space-y-5">
        {/* Doctor profile */}
        <div className="flex flex-col items-center pt-2 pb-4 gap-2">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarImage src={apt.doctor_image_url || ''} alt={doctorName} className="object-cover" />
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-white" />
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{doctorName}</p>
            {speciality && <p className="text-sm text-muted-foreground">{speciality}</p>}
          </div>
        </div>

        {/* Date & Type */}
        <div className="flex gap-3">
          <div className="flex-1 bg-muted/50 rounded-2xl p-4">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Date &amp; Time</p>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-primary shrink-0" />
              <p className="text-sm font-semibold text-foreground">{formatDateTime(apt.start_datetime)}</p>
            </div>
          </div>
          <div className="flex-1 bg-muted/50 rounded-2xl p-4">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Type</p>
            <div className="flex items-center gap-1.5">
              {isVirtual
                ? <Video className="h-4 w-4 text-primary shrink-0" />
                : <Building2 className="h-4 w-4 text-primary shrink-0" />}
              <p className="text-sm font-semibold text-foreground">{isVirtual ? 'Video Call' : 'In-person'}</p>
            </div>
          </div>
        </div>

        {/* Join button */}
        {isVirtual && !isPast && (
          <div className="space-y-2">
            <Button
              className="w-full h-13 rounded-full text-base font-semibold gap-2"
              onClick={() => {
                if (typeof apt.virtual_consultation_url === 'string') {
                  window.open(apt.virtual_consultation_url, '_blank');
                }
              }}
            >
              <Video className="h-5 w-5" />
              Join Session
            </Button>
            <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5 shrink-0" />
              You can join 10 minutes before start time
            </p>
          </div>
        )}

        {/* Prepare for session */}
        {!isPast && (
          <div>
            <h2 className="text-base font-bold text-foreground mb-1">Prepare for Session</h2>
            <div className="bg-white rounded-2xl border border-border px-4">
              <PrepareItem
                icon={<ClipboardList className="h-4 w-4" />}
                title="Pre-session Check-in"
                subtitle="Complete a quick check-in before your session"
                onClick={() => router.push('/assessment')}
              />
              <PrepareItem
                icon={<BookOpen className="h-4 w-4" />}
                title="Share Journal"
                subtitle={`Select entries to share with ${doctorName}`}
                onClick={() => router.push('/self-journaling')}
              />
              <PrepareItem
                icon={<FileText className="h-4 w-4" />}
                title="Previous Notes"
                subtitle="Review notes from last session"
                onClick={() => router.push('/appointments')}
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom actions */}
      {!isPast && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-3 flex gap-3">
          <Button
            variant="outline"
            className="flex-1 rounded-full gap-2"
            onClick={() => router.push(`/booking/${typeof apt.doctor[0] === 'number' ? apt.doctor[0] : apt.doctor[0]}`)}
          >
            <RefreshCw className="h-4 w-4" />
            Reschedule
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="flex-1 rounded-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                disabled={cancelling}
              >
                {cancelling
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <XCircle className="h-4 w-4" />}
                Cancel
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel appointment?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will cancel your session with {doctorName}. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep it</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCancel}
                  className="bg-destructive text-white hover:bg-destructive/90"
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
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <DetailContent />
    </Suspense>
  );
}
