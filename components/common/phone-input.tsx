/**
 * FILE: components/common/phone-input.tsx
 *
 * PURPOSE:
 *   Renders a phone number input field with an interactive country/dialing code selector.
 *   Provides a searchable dialog to select from a list of countries with their calling codes.
 *
 * LOGIC OVERVIEW:
 *   Displays a button (country selector) next to a numeric input field. When clicked, opens
 *   a dialog showing all countries filterable by name, country code, or calling code. Initializes
 *   with India as the default country if none is selected. The component is controlled and
 *   calls onCountryChange when a country is selected and onChange when phone digits are entered.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   value             — Phone number string (digits only), controlled by onChange callback
 *   onChange          — Callback fired with a synthetic event when phone digits are entered
 *   selectedCountry   — Current Country object or null; controls the country selector button
 *   onCountryChange   — Callback fired with selected Country object
 *   countries         — Computed list of all countries with dialing codes (memoized)
 *   filtered          — Countries matching the current search query (memoized)
 *   Country           — TypeScript interface: { name, countryCode, callingCode }
 *   PhoneInput        — Main export; controlled phone input with country selector
 *
 * DEPENDENCIES:
 *   React hooks: useEffect, useId, useMemo, useState
 *   shadcn/ui primitives: Button, Dialog, DialogContent, DialogTitle, Input, Label, ScrollArea
 *   country-codes-list — npm library providing country data
 *   lucide-react icons: Phone, Search, X
 *
 * LAST UPDATED: 2026-04-28 — Neo design system: file header added
 */

"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import countryCodes from "country-codes-list";
import { Phone, Search, X } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";

export interface Country {
  name: string;
  countryCode: string;
  callingCode: string;
}

interface PhoneInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedCountry: Country | null;
  onCountryChange: (country: Country) => void;
}

export function PhoneInput({ value, onChange, selectedCountry, onCountryChange }: PhoneInputProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const countries = useMemo<Country[]>(() => {
    const list = countryCodes.customList(
      "countryCode",
      "{countryNameEn}|{countryCode}|{countryCallingCode}",
    );
    return Object.values(list).map((v) => {
      const [name, code, calling] = (v as string).split("|");
      return { name, countryCode: code, callingCode: calling.replace("+", "") };
    });
  }, []);

  useEffect(() => {
    if (!selectedCountry) {
      const india = countries.find((c) => c.countryCode === "IN");
      if (india) onCountryChange(india);
    }
  }, [countries, selectedCountry, onCountryChange]);

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

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>Phone Number</Label>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(true)}
          className="shrink-0 px-3 h-10"
        >
          {selectedCountry
            ? `${selectedCountry.countryCode} +${selectedCountry.callingCode}`
            : "Select"}
        </Button>
        <div className="relative flex-1">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id={id}
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            value={value}
            onChange={onChange}
            placeholder="Enter phone number"
            className="pl-9 h-10"
          />
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm p-0">
          <DialogTitle className="sr-only">Select Country</DialogTitle>
          <div className="p-3 flex flex-col gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search country..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 pr-9"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
            <ScrollArea className="h-80">
              <div className="divide-y divide-border">
                {filtered.map((c) => (
                  <button
                    key={c.countryCode}
                    onClick={() => {
                      onCountryChange(c);
                      setOpen(false);
                      setQuery("");
                    }}
                    className="w-full py-3 px-4 text-left hover:bg-accent transition-colors flex justify-between text-sm"
                  >
                    <span>
                      {c.name} ({c.countryCode})
                    </span>
                    <span className="text-muted-foreground">+{c.callingCode}</span>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
