/**
 * FILE: components/shared/navigation/page-header.tsx
 *
 * PURPOSE:
 *   Reusable page-level header with a back button, title, optional subtitle,
 *   an optional right-side action slot, and an optional children slot rendered
 *   below the title row inside the same sticky container.
 *
 * LOGIC OVERVIEW:
 *   Renders a top bar (sticky by default): BackButton | title+subtitle | optional right slot.
 *   children (if any) are rendered below the title row but still inside the sticky wrapper,
 *   so they stick together as one unit — no separate sticky offsets needed for sub-bars.
 *   Pass sticky={false} to opt out, or override with className if needed.
 *   Back behaviour is delegated entirely to BackButton — pass fallback, hardBack,
 *   or onBack and BackButton resolves the priority internally.
 *   A menu (hamburger) button on the right opens the shared Sidebar drawer.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   title       — main heading text (required)
 *   subtitle    — secondary line below the title (optional)
 *   fallback    — router path BackButton uses when history is empty (default: "/home")
 *   hardBack    — if set, back button always replaces to this path, ignoring history
 *   onBack      — fully custom handler; takes priority over hardBack and fallback
 *   right       — ReactNode rendered flush-right (optional, e.g. filter button)
 *   children    — rendered below the title row, inside the sticky wrapper
 *   sticky      — whether the header sticks to the top on scroll (default: true)
 *   className   — extra classes on the outer wrapper
 *   sidebarOpen — local state controlling Sidebar visibility
 *
 * DEPENDENCIES:
 *   BackButton — components/shared/navigation/back-button.tsx
 *   Sidebar    — components/shared/navigation/sidebar.tsx
 *
 * LAST UPDATED: 2026-05-07 — add children slot inside sticky wrapper so sub-bars (StatsBar, CooldownBanner) can attach without needing separate sticky offsets
 */

"use client";

import { Menu } from "lucide-react";
import { ReactNode, useState } from "react";
import { BackButton } from "@/components/shared/navigation/back-button";
import { Sidebar } from "@/components/shared/navigation/sidebar";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  fallback?: string;
  /** Always navigate to this path on back, bypassing browser history entirely. */
  hardBack?: string;
  onBack?: () => void;
  right?: ReactNode;
  /** Rendered below the title row, inside the sticky wrapper. */
  children?: ReactNode;
  /** Stick the header to the top of the scroll container. Defaults to true. */
  sticky?: boolean;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  fallback = "/home",
  hardBack,
  onBack,
  right,
  children,
  sticky = true,
  className,
}: PageHeaderProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div
        className={cn(
          "bg-background",
          sticky && "sticky top-[env(safe-area-inset-top)] z-10",
          className,
        )}
      >
        <div className="flex items-center gap-2 px-5 pt-2 pb-1">
          <BackButton fallback={fallback} hardBack={hardBack} onClick={onBack} />

          <div className="flex-1 min-w-0">
            <h1 className="text-[18px] font-bold leading-tight" style={{ color: "#0E1726" }}>
              {title}
            </h1>
            {subtitle && (
              <p className="text-[12px] mt-0.5" style={{ color: "#6B7280" }}>
                {subtitle}
              </p>
            )}
          </div>

          <div className="flex-shrink-0 flex items-center gap-1">
            {right}
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#F0ECE8] transition-colors duration-[140ms] active:scale-95"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" style={{ color: "#6B7280" }} />
            </button>
          </div>
        </div>

        {children}
      </div>
    </>
  );
}
