/**
 * FILE: components/home/upcoming-session.tsx
 *
 * PURPOSE:
 *   Shows the next upcoming appointment on the home screen.
 *   Uses a dark hero card (--mt-ink-800 bg) pattern for visual prominence.
 *
 * LOGIC OVERVIEW:
 *   Returns null when no appointments exist.
 *   Each appointment renders as a dark card: calendar glyph tile (green tint),
 *   doctor name + speciality, date/time, and an optional "Join" button for
 *   virtual sessions. The Join button is the mt-primary orange style.
 *   Date is formatted in en-IN locale.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   appointments — SlotDetailDto[] from useHomePage
 *   onJoin       — callback when user taps the Join button
 *
 * DEPENDENCIES:
 *   Button, SlotDetailDto, lucide-react
 *
 * LAST UPDATED: 2026-04-28 — Dark hero card style, mt-primary Join button,
 *   design-system type scale and tint colors
 */

import { CalendarCheck, Video } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { SlotDetailDto } from "@/hooks/appointments/use-appointments-page";

interface Props {
  appointments?: SlotDetailDto[];
  onJoin?: () => void;
}

function getDoctorName(doctor: SlotDetailDto["doctor"]): string {
  if (Array.isArray(doctor) && doctor.length >= 2 && typeof doctor[1] === "string") {
    const raw = doctor[1];
    const name = raw.includes(",") ? raw.split(",").pop()!.trim() : raw.trim();
    return /^Dr\.?\s/i.test(name) ? name : `Dr. ${name}`;
  }
  return "Doctor";
}

function getSpeciality(specialityId: SlotDetailDto["speciality_id"]): string {
  if (
    Array.isArray(specialityId) &&
    specialityId.length >= 2 &&
    typeof specialityId[1] === "string"
  ) {
    return specialityId[1];
  }
  return "";
}

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    const date = d.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });
    const time = d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return `${date} · ${time}`;
  } catch {
    return "";
  }
}

export function UpcomingSession({ appointments, onJoin }: Props) {
  if (!appointments || appointments.length === 0) return null;

  return (
    <div className="px-5 mb-4">
      <div className="flex items-center justify-between mb-3">
        <span className="mt-overline">Upcoming</span>
        <Link
          href="/consult/appointments"
          className="text-[13px] font-semibold text-[#F97316] hover:underline"
        >
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
              className="flex items-center gap-3 p-4 rounded-[20px] active:scale-[0.97] transition-transform duration-[140ms]"
              style={{
                background: "#1C2433",
                boxShadow: "0 8px 24px rgba(15,23,42,0.12)",
              }}
            >
              {/* Green glyph tile — calendar icon */}
              <div
                className="w-11 h-11 rounded-[12px] flex items-center justify-center flex-shrink-0"
                style={{ background: "#E6F4EA" }}
              >
                <CalendarCheck className="w-5 h-5" style={{ color: "#1F8B4C" }} />
              </div>

              <div className="flex-grow min-w-0">
                <h4 className="text-[15px] font-bold text-white line-clamp-1">{doctorName}</h4>
                {speciality && (
                  <p className="text-[12px] text-white/60 line-clamp-1 mt-0.5">{speciality}</p>
                )}
                <p className="text-[12px] text-white/50 mt-1">
                  {formatDateTime(apt.start_datetime)}
                </p>
              </div>

              {isVirtual && (
                <Button
                  variant="mt-primary"
                  size="mt-sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onJoin?.();
                  }}
                >
                  <Video className="w-3.5 h-3.5" />
                  Join
                </Button>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
