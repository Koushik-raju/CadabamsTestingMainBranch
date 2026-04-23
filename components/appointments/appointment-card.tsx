"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { SlotDetailDto } from "@/hooks/appointments/use-appointments-page";
import { Building2, Calendar, Clock, Video } from "lucide-react";
import { useRouter } from "next/navigation";

interface AppointmentCardProps {
  appointment: SlotDetailDto;
  isPast?: boolean;
}

function getStatusColor(status: string): string {
  switch (status?.toLowerCase()) {
    case "confirmed":
    case "booked":
      return "bg-green-100 text-green-700 border-green-200";
    case "cancelled":
      return "bg-destructive/10 text-destructive border-destructive/20";
    case "completed":
      return "bg-muted text-muted-foreground border-border";
    default:
      return "bg-primary/10 text-primary border-primary/20";
  }
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function getDoctorName(doctor: SlotDetailDto["doctor"]): string {
  if (Array.isArray(doctor) && doctor.length >= 2 && typeof doctor[1] === "string") {
    const raw = doctor[1];
    const name = raw.includes(",") ? raw.split(",").pop()!.trim() : raw.trim();
    return /^Dr\.?\s/i.test(name) ? name : `Dr. ${name}`;
  }
  return "Doctor";
}

function getConsultationType(ids: SlotDetailDto["consultation_type_ids"]): string {
  if (Array.isArray(ids) && ids.length >= 2 && typeof ids[1] === "string") return ids[1];
  return "";
}

function getInitials(name: string): string {
  return name
    .replace(/^Dr\.?\s*/i, "")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AppointmentCard({ appointment, isPast }: AppointmentCardProps) {
  const router = useRouter();
  const doctorName = getDoctorName(appointment.doctor);
  const initials = getInitials(doctorName);
  const isVirtual = !!appointment.virtual_consultation_url;
  const status = appointment.availability || "booked";

  return (
    <button
      type="button"
      onClick={() => router.push(`/consult/appointments/${appointment.id}`)}
      className="w-full text-left bg-white rounded-2xl border border-border shadow-sm p-4 flex items-center gap-3 active:scale-[0.98] transition-transform"
    >
      <div className="relative shrink-0">
        <Avatar className="h-12 w-12">
          <AvatarFallback
            className={`text-sm font-semibold ${isPast ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}
          >
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
          <Badge
            variant="outline"
            className={`text-[10px] shrink-0 capitalize ${getStatusColor(status)}`}
          >
            {status}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {getConsultationType(appointment.consultation_type_ids)}
        </p>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {formatDate(appointment.start_datetime)}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatTime(appointment.start_datetime)}
          </span>
          {isVirtual ? (
            <Video className="h-3 w-3 text-primary ml-auto" />
          ) : (
            <Building2 className="h-3 w-3 text-muted-foreground ml-auto" />
          )}
        </div>
      </div>
    </button>
  );
}
