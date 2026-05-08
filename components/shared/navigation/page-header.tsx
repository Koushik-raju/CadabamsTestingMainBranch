/**
 * FILE: components/shared/navigation/page-header.tsx
 *
 * PURPOSE:
 *   Reusable page-level header with a back button, title, optional subtitle,
 *   an optional right-side action slot, an optional built-in search bar row,
 *   an optional generic sticky sub-header slot, and page-body children.
 *
 * LOGIC OVERVIEW:
 *   The entire header stack (main bar + optional search row + optional sub-header)
 *   lives inside a single sticky wrapper pinned to `top: env(safe-area-inset-top)`.
 *   Because everything is in the same wrapper, the inner rows are normal block
 *   flow — they stack naturally without any per-row offset math. `children` is
 *   wrapped in its own sticky container pinned at `top = safe-area-inset-top +
 *   measured header height`, so it sticks flush below the header with no gap
 *   and no overlap. One ResizeObserver on the header wrapper tracks the height,
 *   so children's offset always matches whatever rows are rendered (search row,
 *   sub-header, multi-line title, etc.). Pass `sticky={false}` to render the
 *   stack inline (children also drops its sticky positioning in that mode).
 *
 *   Layout inside the wrapper:
 *   1. Main bar: BackButton | title+subtitle | right slot + menu.
 *   2. Search row: rendered only when a search prop is provided. Exposes
 *      onSearchChange, onSearchInput, onSearchClear, and onSearchSubmit so the
 *      caller controls all search behaviour without managing the SearchBar node.
 *   3. Sub-header: arbitrary ReactNode for tabs, filters, etc.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   title             — main heading text (required)
 *   subtitle          — secondary line below the title (optional)
 *   fallback          — router path BackButton uses when history is empty (default: "/home")
 *   hardBack          — if set, back button always replaces to this path, ignoring history
 *   onBack            — fully custom handler; takes priority over hardBack and fallback
 *   right             — ReactNode rendered flush-right in the main bar (optional)
 *   searchValue       — controlled value for the built-in search bar (presence enables the row)
 *   searchPlaceholder — placeholder text for the search input (default: "Search…")
 *   onSearchChange    — called with the new string on every keystroke
 *   onSearchInput     — called with the raw ChangeEvent for callers needing the full event
 *   onSearchClear     — called when the user taps the dismiss (×) button
 *   onSearchSubmit    — called when the user submits via keyboard Enter
 *   subHeader         — arbitrary ReactNode in the sticky bar below the search row (optional)
 *   sticky            — whether the header stack sticks to the top on scroll (default: true)
 *   className         — extra classes on the main-bar inner row
 *   children          — page body rendered below the sticky header stack
 *   sidebarOpen       — local state controlling Sidebar visibility
 *
 * DEPENDENCIES:
 *   BackButton — components/shared/navigation/back-button.tsx
 *   SearchBar  — components/shared/search-bar.tsx
 *   Sidebar    — components/shared/navigation/sidebar.tsx
 *
 * LAST UPDATED: 2026-05-08 — collapsed three independently-sticky bars into a single sticky
 *               header wrapper, then made children sticky at the measured header height so the
 *               body sticks flush below the header with no gap and no overlap; one ResizeObserver
 */

"use client";

import { Menu } from "lucide-react";
import React, { ChangeEvent, ReactNode, useEffect, useRef, useState } from "react";
import { BackButton } from "@/components/shared/navigation/back-button";
import { Sidebar } from "@/components/shared/navigation/sidebar";
import { SearchBar } from "@/components/shared/search-bar";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  fallback?: string;
  /** Always navigate to this path on back, bypassing browser history entirely. */
  hardBack?: string;
  onBack?: () => void;
  right?: ReactNode;

  // ── Search bar (rendered in a row below the main bar) ─────────────────────
  /** Controlled value. Providing this prop enables the built-in search row. */
  searchValue?: string;
  /** Placeholder text for the search input. */
  searchPlaceholder?: string;
  /** Called with the new string on every keystroke. */
  onSearchChange?: (value: string) => void;
  /** Called with the raw input ChangeEvent for callers that need the full event. */
  onSearchInput?: (e: ChangeEvent<HTMLInputElement>) => void;
  /** Called when the user taps the dismiss (×) button. */
  onSearchClear?: () => void;
  /** Called when the user submits via keyboard Enter. */
  onSearchSubmit?: (value: string) => void;

  // ── Generic sub-header (below search row when both are present) ───────────
  /** Arbitrary ReactNode (tabs, filters, etc.) rendered below the search row. */
  subHeader?: ReactNode;

  /** Stick the header stack to the top on scroll. Defaults to true. */
  sticky?: boolean;
  className?: string;
  children?: ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  fallback = "/home",
  hardBack,
  onBack,
  right,
  searchValue,
  searchPlaceholder,
  onSearchChange,
  onSearchInput,
  onSearchClear,
  onSearchSubmit,
  subHeader,
  sticky = true,
  className,
  children,
}: PageHeaderProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  const hasSearch = searchValue !== undefined;
  const hasSubHeader = subHeader !== undefined;

  /* Measure the entire sticky header stack with one ResizeObserver so the
     children container can stick flush below it. Only one observation is
     needed because the main bar + search row + sub-header all live in the
     same wrapper now. */
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setHeaderHeight(entry.contentRect.height));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function handleSearchChange(value: string) {
    onSearchChange?.(value);
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") onSearchSubmit?.(searchValue ?? "");
  }

  return (
    <>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Single sticky wrapper for the entire header stack. Inner rows are
          normal block flow inside it — no per-row offset math needed. */}
      <div
        ref={headerRef}
        className={cn("bg-background", sticky && "sticky top-[env(safe-area-inset-top)] z-10")}
      >
        <div className={cn("flex items-center gap-2 px-5 pt-2 pb-1", className)}>
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

        {hasSearch && (
          <div className="px-4 py-2">
            <SearchBar
              value={searchValue}
              placeholder={searchPlaceholder}
              onChange={handleSearchChange}
              onClear={onSearchClear}
              onKeyDown={handleSearchKeyDown}
              onInput={onSearchInput}
            />
          </div>
        )}

        {hasSubHeader && <div>{subHeader}</div>}
      </div>

      {/* Children stick flush directly below the header. Offset = the measured
          header-stack height, so there is no gap and no overlap regardless of
          which optional rows (search / sub-header) are rendered. */}
      <div
        className={cn(sticky && "sticky z-9 bg-background")}
        style={sticky ? { top: `calc(env(safe-area-inset-top) + ${headerHeight}px)` } : undefined}
      >
        {children}
      </div>
    </>
  );
}
