/**
 * FILE: components/shared/navigation/page-header.tsx
 *
 * PURPOSE:
 *   Reusable page-level header with a back button, title, optional subtitle,
 *   an optional right-side action slot, an optional built-in search bar row,
 *   an optional generic sticky sub-header slot, and page-body children.
 *
 * LOGIC OVERVIEW:
 *   Renders up to three sticky zones then the scrollable page content:
 *   1. Main bar (sticky, top = safe-area-inset-top): BackButton | title+subtitle | right slot + menu.
 *   2. Search row (sticky, top = safe-area-inset-top + main-bar height): rendered when any search prop
 *      is provided. Exposes onSearchChange, onSearchInput, onSearchClear, and onSearchSubmit so the
 *      caller controls all search behaviour without managing the SearchBar node themselves.
 *   3. Sub-header (sticky, top = safe-area-inset-top + main-bar + search-row height): arbitrary
 *      ReactNode for tabs, filters, or anything else that needs to stick below both bars.
 *   4. children — normal (non-sticky) page body.
 *   Heights are measured via ResizeObserver refs so offsets always track real rendered sizes
 *   regardless of title/subtitle length, font scaling, or search-row content.
 *   Pass sticky={false} to opt all bars out of sticky positioning.
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
 *   sticky            — whether all bars stick to the top on scroll (default: true)
 *   className         — extra classes on the main bar wrapper
 *   children          — non-sticky page body rendered below all sticky bars
 *   sidebarOpen       — local state controlling Sidebar visibility
 *
 * DEPENDENCIES:
 *   BackButton — components/shared/navigation/back-button.tsx
 *   SearchBar  — components/shared/search-bar.tsx
 *   Sidebar    — components/shared/navigation/sidebar.tsx
 *
 * LAST UPDATED: 2026-05-07 — replaced raw subHeader search pattern with typed search props;
 *               all sticky offsets driven by ResizeObserver, no hardcoded px values
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

  // ── Search bar (rendered in a sticky row below the main bar) ──────────────
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

  // ── Generic sticky sub-header (below search row when both are present) ────
  /** Arbitrary ReactNode (tabs, filters, etc.) sticky below the search row. */
  subHeader?: ReactNode;

  /** Stick all bars to the top on scroll. Defaults to true. */
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

  const mainBarRef = useRef<HTMLDivElement>(null);
  const searchRowRef = useRef<HTMLDivElement>(null);
  const [mainBarHeight, setMainBarHeight] = useState(0);
  const [searchRowHeight, setSearchRowHeight] = useState(0);

  const hasSearch = searchValue !== undefined;
  const hasSubHeader = subHeader !== undefined;

  // Track real rendered heights so sticky offsets are always correct — title and
  // subtitle can wrap to multiple lines; search row content can vary too.
  useEffect(() => {
    const el = mainBarRef.current;
    if (!el || (!hasSearch && !hasSubHeader)) return;
    const observer = new ResizeObserver(([entry]) => setMainBarHeight(entry.contentRect.height));
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasSearch, hasSubHeader]);

  useEffect(() => {
    const el = searchRowRef.current;
    if (!el || !hasSubHeader) return;
    const observer = new ResizeObserver(([entry]) => setSearchRowHeight(entry.contentRect.height));
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasSubHeader]);

  function handleSearchChange(value: string) {
    onSearchChange?.(value);
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") onSearchSubmit?.(searchValue ?? "");
  }

  return (
    <>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div
        ref={mainBarRef}
        className={cn(
          "flex items-center gap-2 px-5 pt-2 pb-1 bg-background",
          sticky && "sticky top-[env(safe-area-inset-top)] z-10",
          className,
        )}
      >
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

      {/* Search row — sticky directly below the main bar. Offset is the measured main bar height. */}
      {hasSearch && (
        <div
          ref={searchRowRef}
          className={cn("bg-background px-4 py-2", sticky && "sticky z-9")}
          style={
            sticky ? { top: `calc(env(safe-area-inset-top) + ${mainBarHeight}px)` } : undefined
          }
        >
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

      {/* Sub-header — sticky below both the main bar and the search row. */}
      {hasSubHeader && (
        <div
          className={cn("bg-background", sticky && "sticky z-8")}
          style={
            sticky
              ? {
                  top: `calc(env(safe-area-inset-top) + ${mainBarHeight}px + ${searchRowHeight}px)`,
                }
              : undefined
          }
        >
          {subHeader}
        </div>
      )}

      {children}
    </>
  );
}
