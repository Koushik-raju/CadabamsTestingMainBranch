/**
 * FILE: components/shared/navigation/sidebar.tsx
 *
 * PURPOSE:
 *   Slide-in navigation drawer shared across all pages. Provides quick access
 *   to the five primary destinations: Home, Profile, Chat, Journeys, and Appointments.
 *
 * LOGIC OVERVIEW:
 *   1. Renders a shadcn Sheet (left side) — open/close driven by the `open` prop;
 *      onOpenChange calls `onClose` when Radix signals closure (overlay click, Esc).
 *   2. Active route is detected via usePathname — exact match for /home, prefix
 *      match for all other routes so nested pages (e.g. /chat/thread/...) stay highlighted.
 *   3. User name and avatar are sourced from useAuth, mirroring the HomeHeader pattern.
 *   4. Tapping a nav item calls router.push then onClose so the drawer closes before
 *      the new page mounts.
 *   5. shadcn primitives used throughout: Sheet/SheetContent/SheetHeader/SheetFooter,
 *      Avatar/AvatarImage/AvatarFallback, Button, Separator. GlyphTile for icon tiles
 *      per the non-breakable project rule (never inline gradient/tinted icon divs).
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   open      — controls whether the drawer is visible
 *   onClose   — called when the overlay, Esc, or close button dismisses the sheet
 *   NAV_ITEMS — static list of { label, icon, href } tuples for the five nav links
 *
 * DEPENDENCIES:
 *   useAuth()      — user.name, user.profile_image
 *   useRouter()    — navigation on item tap
 *   usePathname()  — active route detection
 *   Sheet, Button, Avatar, Separator — shadcn/ui primitives
 *   GlyphTile      — project canonical icon-tile component
 *
 * LAST UPDATED: 2026-05-06 — SheetHeader/Footer padding accounts for safe-area insets so content clears the fixed overlays
 */

"use client";

import { Calendar, Home, Map, MessageCircle, User, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { GlyphTile } from "@/components/shared/glyph-tile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent
        side="left"
        showCloseButton={false}
        className="flex w-70 flex-col gap-0 p-0 sm:max-w-70"
      >
        <SheetTitle className="sr-only">Navigation menu</SheetTitle>

        {/* ── Header: avatar + name + close button ── */}
        <SheetHeader className="flex-row items-center justify-between px-5 pb-6 pt-[calc(env(safe-area-inset-top)+24px)]">
          <div className="flex items-center gap-3">
            <Avatar size="lg" className="border-2 border-[#F97316]/30">
              {profileImage && profileImage !== "/profile.png" ? (
                <AvatarImage src={profileImage} alt={firstName} />
              ) : (
                <AvatarFallback
                  className="text-base font-black text-white"
                  style={{ background: "linear-gradient(135deg, #FBB7BC, #F97316)" }}
                >
                  {firstName[0]}
                </AvatarFallback>
              )}
            </Avatar>

            <div className="min-w-0">
              <p className="text-[12px] font-medium text-muted-foreground">Welcome back,</p>
              <p className="truncate text-[16px] font-bold leading-tight text-foreground">
                {firstName}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close menu"
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </SheetHeader>

        <Separator className="mx-5" />

        {/* ── Nav items ── */}
        <nav className="flex flex-1 flex-col gap-1 px-3 pt-4">
          {NAV_ITEMS.map(({ label, icon: Icon, href }) => {
            const active = isActive(href);
            return (
              <Button
                key={href}
                variant="ghost"
                onClick={() => navigate(href)}
                className={cn(
                  "h-auto w-full justify-start gap-3 rounded-[14px] px-3 py-3 transition-all duration-140 active:scale-[0.98]",
                  active && "bg-[#F97316]/10 hover:bg-[#F97316]/10",
                )}
              >
                {/* GlyphTile required — never inline gradient/tinted icon divs */}
                <GlyphTile icon={Icon} tint={active ? "orange" : "peach"} size="sm" />

                <span
                  className={cn(
                    "flex-1 text-left text-[15px] font-semibold",
                    active ? "text-[#F97316]" : "text-foreground",
                  )}
                >
                  {label}
                </span>

                {active && <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#F97316]" />}
              </Button>
            );
          })}
        </nav>

        {/* ── Footer branding ── */}
        <SheetFooter className="px-5 pb-[calc(env(safe-area-inset-bottom)+40px)]">
          <p className="text-center text-[11px] font-medium text-muted-foreground">
            Cadabam&apos;s Mental Health
          </p>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
