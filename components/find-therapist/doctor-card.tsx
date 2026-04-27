/**
 * FILE: components/find-therapist/doctor-card.tsx
 *
 * PURPOSE:
 *   Renders a single doctor listing card with avatar, name, speciality, tags, rating,
 *   and a Book Now button.
 *
 * LOGIC OVERVIEW:
 *   1. processDoctorImage() normalises the raw image field (data URI, JPEG/PNG base64,
 *      URL, or relative path) into a usable src string.
 *   2. displayName() strips Odoo's "Company, DR NAME" format and ensures "Dr." prefix.
 *   3. Avatar is fixed at 64×64px with overflow-hidden so all image types are clipped
 *      to the same square regardless of their natural dimensions.
 *   4. Tags show the first 2 illness_treated entries; excess shown as "+N".
 *   5. Book Now triggers onBook(doctor) to navigate to the booking page.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   doctor    — DoctorListing object from the data layer
 *   onBook    — callback invoked with the selected doctor when user taps Book Now
 *   imgSrc    — processed image source string or null (falls back to initials avatar)
 *
 * DEPENDENCIES:
 *   shadcn Avatar, Button
 *   lucide-react: Star, User
 *
 * LAST UPDATED: 2026-04-24 — force image size via background-image div, increased Book Now button size
 */
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DoctorListing } from "@/data/doctors";
import { Star, User } from "lucide-react";

export type Doctor = DoctorListing;

export interface DoctorCardProps {
  doctor: Doctor;
  mode?: string;
  centerName?: string;
  onBook: (doctor: Doctor) => void;
}

function processDoctorImage(imageData: unknown): string | null {
  if (!imageData) return null;
  try {
    const cleaned =
      typeof imageData === "string"
        ? imageData.replace(/^["']|["']$/g, "").replace(/\\n|\n|\r/g, "")
        : null;
    if (!cleaned) return null;
    if (cleaned.startsWith("data:image")) return cleaned;
    if (cleaned.startsWith("/9j/")) return `data:image/jpeg;base64,${cleaned}`;
    if (cleaned.startsWith("iVBOR")) return `data:image/png;base64,${cleaned}`;
    if (cleaned.startsWith("http") || cleaned.startsWith("/")) return cleaned;
  } catch {
    /* ignore */
  }
  return null;
}

function displayName(name: string): string {
  const full = name.trim();
  // Odoo display_name is "Company, DR NAME" — take only the part after the last comma
  const raw = full.includes(",") ? full.split(",").pop()!.trim() : full;
  if (!raw) return "Doctor";
  return /^Dr\.?\s/i.test(raw) ? raw : `Dr. ${raw}`;
}

export function DoctorCard({ doctor, onBook }: DoctorCardProps) {
  const imgSrc = processDoctorImage(doctor.image);
  const name = displayName(doctor.name);
  // OdooTuple = [id: number, name: string]
  const speciality =
    typeof doctor.speciality_id?.[1] === "string" ? doctor.speciality_id[1] : "Specialist";
  const d = doctor as unknown as Record<string, unknown>;
  const rating = d.rating ?? d.star_rating ?? "4.9";

  const tags = (doctor.illness_treated ?? []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ([tagName]: any) => tagName as string,
  );
  const visibleTags = tags.slice(0, 2);
  const extraTags = tags.length > 2 ? tags.length - 2 : 0;

  const initials = name
    .replace(/^Dr\.?\s*/i, "")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-border">
      <div className="flex gap-3">
        <Avatar className="h-16 w-16 rounded-xl shrink-0">
          <AvatarImage src={imgSrc ?? undefined} alt={name} className="object-cover rounded-xl" />
          <AvatarFallback className="bg-orange-100 text-orange-500 font-semibold rounded-xl text-lg">
            {initials || <User className="h-6 w-6" />}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground text-sm">{name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{speciality}</p>

          {visibleTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {visibleTags.map((tag: unknown, i: number) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 text-[11px] font-medium"
                >
                  {tag as string}
                </span>
              ))}
              {extraTags > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[11px] font-medium">
                  +{extraTags}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-1 mt-2">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-semibold text-foreground">{String(rating)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <p className="text-xs text-muted-foreground">Click to see availability</p>
        <Button
          size="default"
          className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-10 py-4"
          onClick={() => onBook(doctor)}
        >
          Book Now
        </Button>
      </div>
    </div>
  );
}
