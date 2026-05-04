/**
 * FILE: app/(public)/auth/signup/country-picker.tsx
 *
 * PURPOSE:
 *   Country picker dialog used in the signup form step. Reads state from
 *   SignupContext (open state, query, filtered/suggested lists) and writes
 *   back the selected country.
 *
 * LOGIC OVERVIEW:
 *   Reads pickerOpen, query, suggested, filtered, country from context.
 *   Renders a Dialog with a search input and a ScrollArea listing Suggested
 *   countries first (when not searching), then all matching countries.
 *   Selecting a country closes the dialog and updates context.country.
 *
 * DEPENDENCIES:
 *   useSignupContext, flag() from ./types
 *   shadcn/ui: Dialog, DialogContent, DialogTitle, ScrollArea
 *   lucide-react: Check, Search
 *
 * LAST UPDATED: 2026-05-04 — initial extraction from page.tsx
 */

"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Search } from "lucide-react";
import { useSignupContext } from "./context";
import { flag } from "./types";

export function CountryPicker() {
  const { pickerOpen, setPickerOpen, query, setQuery, suggested, filtered, country, setCountry } =
    useSignupContext();

  const select = (c: typeof country) => {
    if (!c) return;
    setCountry(c);
    setPickerOpen(false);
    setQuery("");
  };

  return (
    <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
      <DialogContent className="max-w-sm p-0" showCloseButton={false}>
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <DialogTitle className="text-[17px] font-semibold text-gray-900">
            Select Country
          </DialogTitle>
          <button
            onClick={() => setPickerOpen(false)}
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
              className="w-full h-10 pl-9 pr-4 rounded-xl bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-orange-200"
            />
          </div>
        </div>

        <ScrollArea className="h-80">
          {!query && (
            <>
              <p className="px-5 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
                Suggested
              </p>
              {suggested.map((c) => (
                <button
                  key={`s-${c.countryCode}`}
                  onClick={() => select(c)}
                  className="w-full px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-xl leading-none">{flag(c.countryCode)}</span>
                  <span className="flex-1 text-left text-[15px] text-gray-800">{c.name}</span>
                  <span className="text-[14px] text-gray-400">+{c.callingCode}</span>
                  {country?.countryCode === c.countryCode && (
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
              onClick={() => select(c)}
              className="w-full px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
            >
              <span className="text-xl leading-none">{flag(c.countryCode)}</span>
              <span className="flex-1 text-left text-[15px] text-gray-800">{c.name}</span>
              <span className="text-[14px] text-gray-400">+{c.callingCode}</span>
              {country?.countryCode === c.countryCode && (
                <Check className="size-4 text-orange-500" />
              )}
            </button>
          ))}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
