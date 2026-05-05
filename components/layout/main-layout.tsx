/**
 * FILE: components/layout/main-layout.tsx
 *
 * PURPOSE:
 *   Root layout shell for all authenticated screens. Provides the cream canvas
 *   background and mounts the floating bottom tab bar.
 *
 * LOGIC OVERVIEW:
 *   Wraps children in a full-screen flex column on the --mt-cream-bg canvas.
 *   Bottom padding (pb-28) accounts for the floating pill nav height + safe-area.
 *   Safe-area top is handled at the auth layout level but forwarded here as well.
 *   hideNav prop lets individual screens suppress the bottom bar (e.g. onboarding,
 *   full-screen video, keyboard-heavy flows).
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   children — screen content
 *   hideNav  — when true, bottom nav is not rendered
 *
 * DEPENDENCIES:
 *   BottomNavigation — floating pill tab bar
 *
 * LAST UPDATED: 2026-04-28 — Increased pb for floating nav, set cream canvas bg
 */

"use client";

import { BottomNavigation } from "./bottom-navigation";

interface MainLayoutProps {
  children: React.ReactNode;
  hideNav?: boolean;
}

export function MainLayout({ children, hideNav = false }: MainLayoutProps) {
  return (
    <div
      className="flex flex-col min-h-screen bg-background"
      style={{ paddingTop: "var(--safe-area-inset-top)" }}
    >
      {/* pb-28 gives clearance for the floating pill nav (≈72px) + safe-area */}
      <main className={`flex-1 overflow-y-auto ${hideNav ? "" : "pb-28"}`}>{children}</main>
      {!hideNav && <BottomNavigation />}
    </div>
  );
}
