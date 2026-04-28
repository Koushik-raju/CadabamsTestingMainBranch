/**
 * FILE: components/layout/bottom-navigation.tsx
 *
 * PURPOSE:
 *   Floating pill bottom tab bar matching the MindTalk design system's MTTabBar pattern.
 *   Five tabs: Home · Explore · AI · Appts · Profile.
 *
 * LOGIC OVERVIEW:
 *   1. Renders a white pill card fixed to bottom-3, floating 12px off each side edge.
 *   2. The centre "AI" tab (isSpecial) is a raised orange circle (-mt-5, shadow-glow)
 *      with the sparkle brand mark — it sits above the bar plane.
 *   3. All other tabs show a line icon + label; active = orange icon + orange label.
 *   4. Active state is derived from pathname: exact match OR pathname starts with tab.path.
 *   5. Safe-area bottom offset is applied to the wrapper so it clears the home indicator
 *      on iOS (Capacitor shell) without hiding the nav under the system UI.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   BottomNavigation — default and named export
 *   SparkleIcon      — inline SVG brand sparkle (4-pointed star) for the AI tab
 *
 * DEPENDENCIES:
 *   usePathname (next/navigation), cn utility, navigationMenuItems (config/navigation)
 *
 * LAST UPDATED: 2026-04-28 — Complete redesign to MTTabBar floating pill per design system migration
 */

"use client";

import { type NavItem, navigationMenuItems } from "@/config/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

/* Brand sparkle — 4-pointed star used on the AI tab and AI surfaces */
function SparkleIcon({ size = 24, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden>
      <path d="M12 2l1.6 4.4L18 8l-4.4 1.6L12 14l-1.6-4.4L6 8l4.4-1.6z" />
      <path d="M19 14l.8 2.2 2.2.8-2.2.8L19 20l-.8-2.2L16 17l2.2-.8z" />
    </svg>
  );
}

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    /* Outer wrapper handles safe-area bottom offset */
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center"
      style={{ paddingBottom: "max(var(--safe-area-inset-bottom), 8px)" }}
    >
      {/* Floating pill card */}
      <nav
        className={cn(
          "mx-3 w-full max-w-md",
          "flex items-center justify-between",
          "bg-white rounded-[28px]",
          "px-3.5 py-3",
          "shadow-[0_8px_24px_rgba(15,23,42,0.08),0_2px_6px_rgba(15,23,42,0.04)]",
        )}
      >
        {navigationMenuItems.map((item: NavItem) => {
          const active = pathname === item.path || pathname.startsWith(item.path + "/");

          /* Centre AI tab — raised orange circle with sparkle */
          if (item.isSpecial) {
            return (
              <Link
                key={item.key}
                href={item.path}
                className={cn(
                  "flex flex-col items-center gap-1 -mt-5",
                  "w-14 h-14 rounded-full",
                  "bg-[#F97316] shadow-[0_12px_24px_rgba(249,115,22,0.32)]",
                  "items-center justify-center",
                  "transition-transform duration-[140ms] active:scale-95",
                )}
                style={{ display: "flex" }}
                aria-label="AI chat"
              >
                <SparkleIcon size={26} color="#fff" />
              </Link>
            );
          }

          const iconColor = active ? "#F97316" : "#6B7280";

          return (
            <Link
              key={item.key}
              href={item.path}
              className={cn(
                "flex flex-col items-center gap-[3px] flex-1 py-1",
                "transition-colors duration-[140ms]",
              )}
              aria-current={active ? "page" : undefined}
            >
              <item.icon
                className="h-[22px] w-[22px] transition-colors duration-[140ms]"
                style={{ color: iconColor, strokeWidth: active ? 2.5 : 1.8 }}
              />
              <span className="text-[11px] font-semibold leading-none" style={{ color: iconColor }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
