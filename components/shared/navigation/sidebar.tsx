/**
 * FILE: components/shared/navigation/sidebar.tsx
 *
 * PURPOSE:
 *   Slide-in navigation drawer shared across all pages. Provides quick access
 *   to the five primary destinations: Home, Profile, Chat, Journeys, and Appointments.
 *
 * LOGIC OVERVIEW:
 *   1. Renders a fixed overlay backdrop (dismisses on tap) and a 280px panel that
 *      slides in from the left using CSS translate.
 *   2. Active route is detected via usePathname — exact match for /home, prefix
 *      match for all other routes so nested pages (e.g. /chat/thread/...) stay highlighted.
 *   3. User name and avatar are sourced from useAuth, mirroring the HomeHeader pattern.
 *   4. Tapping a nav item calls router.push then onClose so the drawer closes before
 *      the new page mounts.
 *   5. Backdrop and panel transitions use duration-300 so open/close feel snappy on
 *      the Capacitor WebView without janking layout.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   open      — controls whether the drawer is visible
 *   onClose   — called when the backdrop or close button is tapped
 *   NAV_ITEMS — static list of { label, icon, href } tuples for the five nav links
 *
 * DEPENDENCIES:
 *   useAuth()      — user.name, user.profile_image
 *   useRouter()    — navigation on item tap
 *   usePathname()  — active route detection
 *
 * LAST UPDATED: 2026-05-04 — initial implementation
 */

"use client";

import { Calendar, Home, Map, MessageCircle, User, X } from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Home", icon: Home, href: "/home" },
  { label: "Profile", icon: User, href: "/profile" },
  { label: "Chat", icon: MessageCircle, href: "/chat" },
  { label: "Journeys", icon: Map, href: "/journeys" },
  { label: "Appointments", icon: Calendar, href: "/consult/appointments" },
] as const;

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  const firstName = ((user?.name as string | undefined) ?? "There").split(" ")[0];
  const profileImage = user?.profile_image as string | undefined;

  const navigate = (href: string) => {
    router.push(href);
    onClose();
  };

  /* Route is active for /home only on exact match; for all others a prefix match
   * keeps nested pages (e.g. /chat/thread/xxx) highlighted. */
  const isActive = (href: string) =>
    href === "/home" ? pathname === "/home" : pathname.startsWith(href);

  return (
    <>
      {/* Backdrop — pointer-events toggled so it doesn't block interaction when closed */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={cn(
          "fixed left-0 top-0 bottom-0 z-50 w-[280px] flex flex-col bg-background transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* ── Header: avatar + name + close button ── */}
        <div className="flex items-center justify-between px-5 pt-12 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#F97316]/30 flex-shrink-0">
              {profileImage && profileImage !== "/profile.png" ? (
                <Image
                  src={profileImage}
                  alt={firstName}
                  width={40}
                  height={40}
                  className="object-cover h-full w-full"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #FBB7BC, #F97316)" }}
                >
                  <span className="text-base font-black text-white select-none">
                    {firstName[0]}
                  </span>
                </div>
              )}
            </div>

            <div className="min-w-0">
              <p className="text-[12px] font-medium" style={{ color: "#6B7280" }}>
                Welcome back,
              </p>
              <p
                className="text-[16px] font-bold leading-tight truncate"
                style={{ color: "#0E1726" }}
              >
                {firstName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-[#F0ECE8] active:scale-95 transition-transform duration-[140ms] flex-shrink-0"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" style={{ color: "#6B7280" }} />
          </button>
        </div>

        <div className="h-px mx-5 bg-[#E8E3DC]" />

        {/* ── Nav items ── */}
        <nav className="flex flex-col gap-1 px-3 pt-4 flex-1">
          {NAV_ITEMS.map(({ label, icon: Icon, href }) => {
            const active = isActive(href);
            return (
              <button
                key={href}
                onClick={() => navigate(href)}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-[14px] w-full text-left transition-all duration-[140ms] active:scale-[0.98]",
                  active ? "bg-[#F97316]/10" : "hover:bg-[#F0ECE8]",
                )}
              >
                {/* Icon tile — gradient when active, neutral when idle */}
                <div
                  className={cn(
                    "w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0",
                    active && "shadow-[0_2px_8px_rgba(249,115,22,0.25)]",
                  )}
                  style={
                    active
                      ? { background: "linear-gradient(135deg, #FBB7BC, #F97316)" }
                      : { background: "#E8E3DC" }
                  }
                >
                  <Icon className="w-4 h-4" style={{ color: active ? "#fff" : "#6B7280" }} />
                </div>

                <span
                  className="text-[15px] font-semibold flex-1"
                  style={{ color: active ? "#F97316" : "#0E1726" }}
                >
                  {label}
                </span>

                {active && (
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: "#F97316" }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* ── Footer branding ── */}
        <div className="px-5 pb-10">
          <p className="text-[11px] font-medium text-center" style={{ color: "#9AA0AB" }}>
            Cadabam&apos;s Mental Health
          </p>
        </div>
      </div>
    </>
  );
}
