/**
 * FILE: components/find-therapist/doctor-card.tsx
 *
 * PURPOSE:
 *   Therapist trust card per the MindTalk design system — circular avatar with orange
 *   gradient fallback, name, credentials/speciality, specialty chips, star rating, and
 *   an mt-primary "Book now" CTA.
 *
 * LOGIC OVERVIEW:
 *   1. processDoctorImage() normalises the raw image field (data URI, JPEG/PNG base64,
 *      URL, or relative path) into a usable src string.
 *   2. displayName() strips Odoo's "Company, DR NAME" format and ensures "Dr." prefix.
 *   3. Avatar is 64×64px circular (rounded-full) with orange gradient fallback — matches
 *      the design system therapist trust card pattern.
 *   4. Tags show the first 2 illness_treated entries as --mt-tint-peach chips; excess shown as "+N".
 *   5. Star rating with yellow star. Fee shown if present.
 *   6. "Book now" is mt-primary variant (orange pill, glow shadow).
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
 * LAST UPDATED: 2026-04-28 — Design system migration: circular avatar, orange gradient
 *   fallback, mt-primary Book now button, --mt-tint-peach specialty chips
 */
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DoctorListing } from "@/data/doctors";
import { Star } from "lucide-react";

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
  const raw = full.includes(",") ? full.split(",").pop()!.trim() : full;
  if (!raw) return "Doctor";
  return /^Dr\.?\s/i.test(raw) ? raw : `Dr. ${raw}`;
}

export function DoctorCard({ doctor, onBook }: DoctorCardProps) {
  const imgSrc = processDoctorImage(doctor.image);
  const name = displayName(doctor.name);
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
    <div
      className="bg-white rounded-[20px] p-4 mb-3 border shadow-sm"
      style={{ boxShadow: "0 2px 6px rgba(15,23,42,0.05),0 6px_16px rgba(15,23,42,0.04)" }}
    >
      <div className="flex gap-3">
        {/* Circular avatar — orange gradient fallback per design system therapist card */}
        <Avatar
          className="h-16 w-16 rounded-full shrink-0"
          style={{ boxShadow: "0 0 0 3px #fff, 0 4px 10px rgba(15,23,42,0.12)" }}
        >
          <AvatarImage src={imgSrc ?? undefined} alt={name} className="object-cover rounded-full" />
          <AvatarFallback
            className="rounded-full font-black text-white text-lg"
            style={{ background: "linear-gradient(135deg, #FBB7BC, #F97316)" }}
          >
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-[#0E1726] text-[15px]">{name}</p>
          <p className="text-[12px] text-[#6B7280] mt-0.5">{speciality}</p>

          {/* Specialty chips — --mt-tint-peach per design system */}
          {visibleTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {visibleTags.map((tag: unknown, i: number) => (
                <span
                  key={i}
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                  style={{ background: "#FFE9D9", color: "#C9531A" }}
                >
                  {tag as string}
                </span>
              ))}
              {extraTags > 0 && (
                <span
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                  style={{ background: "#F4F2EE", color: "#6B7280" }}
                >
                  +{extraTags}
                </span>
              )}
            </div>
          )}

          {/* Star rating */}
          <div className="flex items-center gap-1 mt-2">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-[12px] font-bold text-[#0E1726] mt-numeric">
              {String(rating)}
            </span>
          </div>
        </div>
      </div>

      {/* CTA row */}
      <div
        className="flex items-center justify-between mt-4 pt-4"
        style={{ borderTop: "1px solid #ECE6DE" }}
      >
        <p className="text-[12px] text-[#6B7280]">Tap to see availability</p>
        <Button variant="mt-primary" size="mt-sm" onClick={() => onBook(doctor)}>
          Book now
        </Button>
      </div>
    </div>
  );
}
