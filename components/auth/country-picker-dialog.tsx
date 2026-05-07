/**
 * FILE: components/auth/country-picker-dialog.tsx
 *
 * PURPOSE:
 *   Modal dialog for selecting a phone country code. Shows a SUGGESTED section
 *   (India + USA) and a searchable full country list.
 *
 * LOGIC OVERVIEW:
 *   Receives the full country list, current selection, open state, and callbacks
 *   from the parent. Filters the list locally against the search query. Selecting
 *   a country fires onSelect and closes the dialog.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   CountryPickerDialogProps — prop interface
 *   open            — controlled open state
 *   onOpenChange    — dialog open/close handler
 *   countries       — full Country[] list from parent (memoised there)
 *   suggested       — pre-filtered Country[] for the SUGGESTED section
 *   selected        — currently active Country | null
 *   onSelect        — called with the chosen Country; parent closes dialog
 *
 * DEPENDENCIES:
 *   shadcn/ui  — Dialog, DialogContent, DialogTitle, ScrollArea
 *   lucide-react — Check, Search
 *
 * LAST UPDATED: 2026-05-07 — extracted from login/page.tsx
 */

import { Check, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface Country {
  name: string;
  countryCode: string;
  callingCode: string;
}

/* Convert ISO-2 country code (e.g. "US") to its Unicode flag emoji. */
export function flag(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(0x1f1e6 - 65 + c.charCodeAt(0)));
}

interface CountryPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  countries: Country[];
  suggested: Country[];
  selected: Country | null;
  onSelect: (c: Country) => void;
}

export function CountryPickerDialog({
  open,
  onOpenChange,
  countries,
  suggested,
  selected,
  onSelect,
}: CountryPickerDialogProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      countries.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.countryCode.toLowerCase().includes(query.toLowerCase()) ||
          c.callingCode.includes(query),
      ),
    [countries, query],
  );

  const handleSelect = (c: Country) => {
    onSelect(c);
    onOpenChange(false);
    setQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0" showCloseButton={false}>
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <DialogTitle className="text-[17px] font-semibold text-gray-900">
            Select Country
          </DialogTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search country or code"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-xl bg-white text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-orange-200"
            />
          </div>
        </div>

        <ScrollArea className="h-80">
          {/* Suggested section — only visible when not searching */}
          {!query && (
            <>
              <p className="px-5 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
                Suggested
              </p>
              {suggested.map((c) => (
                <button
                  key={`suggested-${c.countryCode}`}
                  onClick={() => handleSelect(c)}
                  className="w-full px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-xl leading-none">{flag(c.countryCode)}</span>
                  <span className="flex-1 text-left text-[15px] text-gray-800">{c.name}</span>
                  <span className="text-[14px] text-gray-400">+{c.callingCode}</span>
                  {selected?.countryCode === c.countryCode && (
                    <Check className="size-4 text-orange-500" />
                  )}
                </button>
              ))}
              <p className="px-5 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-widest mt-1">
                All Countries
              </p>
            </>
          )}
          {filtered.map((c) => (
            <button
              key={c.countryCode}
              onClick={() => handleSelect(c)}
              className="w-full px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
            >
              <span className="text-xl leading-none">{flag(c.countryCode)}</span>
              <span className="flex-1 text-left text-[15px] text-gray-800">{c.name}</span>
              <span className="text-[14px] text-gray-400">+{c.callingCode}</span>
              {selected?.countryCode === c.countryCode && (
                <Check className="size-4 text-orange-500" />
              )}
            </button>
          ))}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
