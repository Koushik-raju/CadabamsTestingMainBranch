/**
 * FILE: components/find-therapist/list-view.tsx
 *
 * PURPOSE:
 *   Renders the therapist listing view with inline filters and a doctor card list.
 *   Users can filter by specialist type (top pills), mode, language, issue, and location.
 *
 * LOGIC OVERVIEW:
 *   1. Specialist type pills (All / Psychologist / Psychiatrist / Other / Not sure) sit above
 *      all other filter chips and directly set the profession filter without a bottom sheet.
 *   2. Remaining filters (mode, language, experiencing, location) open bottom sheets on tap.
 *   3. A "Clear" button appears at the right of the filter bar whenever any filter is active.
 *   4. The doctor list is derived via useMemo applying all active filters against DOCTORS.
 *   5. An orange banner at the top offers the guided wizard flow.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   ListView        — default export; renders the full list UI
 *   filtered        — memoised array of doctors matching current filter state
 *   hasActiveFilters — true when any filter is set; controls Clear button visibility
 *
 * DEPENDENCIES:
 *   useFindTherapist() — profession, mode, languages, issues, city, setProfession,
 *                        clearFilters, handleBook, startWizard
 *   PROFESSION_OPTIONS — specialist type options from context
 *   DOCTORS            — static doctor data
 *
 * LAST UPDATED: 2026-04-28 — replace hardcoded #f6f4f2 with var(--mt-cream-bg) token
 */
"use client";

import { ArrowRight, ChevronDown, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { DoctorCard } from "@/components/find-therapist/doctor-card";
import { BackButton } from "@/components/shared/navigation/back-button";
import { Input } from "@/components/ui/input";
import { DOCTORS } from "@/data/doctors";
import { PROFESSION_OPTIONS, useFindTherapist } from "./context";
import { ExperiencingSheet, LangSheet, LocationSheet, ModeSheet } from "./filter-sheets";

export function ListView() {
  const {
    profession,
    mode,
    languages,
    issues,
    city,
    handleBook,
    startWizard,
    setProfession,
    clearFilters,
  } = useFindTherapist();

  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showMode, setShowMode] = useState(false);
  const [showLang, setShowLang] = useState(false);
  const [showExperiencing, setShowExperiencing] = useState(false);
  const [showLocation, setShowLocation] = useState(false);

  // ── Derived chip labels ──────────────────────────────────────────────────────

  const modeLabel = useMemo(() => {
    if (mode === null) return "Any mode";
    if (mode === "online") return "Online";
    if (mode === "in-person") return "In-person";
    return "Any mode";
  }, [mode]);

  const langLabel = useMemo(() => {
    if (languages.length === 0) return "Language";
    if (languages.length === 1) return languages[0].name;
    return `Language (${languages.length})`;
  }, [languages]);

  const experiencingLabel = useMemo(() => {
    if (issues.length === 0) return "Experiencing";
    if (issues.length === 1) return issues[0].name;
    return `Experiencing (${issues.length})`;
  }, [issues]);

  const locationLabel = useMemo(() => {
    if (!city) return "Location";
    return city.name;
  }, [city]);

  // ── Filtered doctors ─────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let results = [...DOCTORS];

    // profession: 1=psychiatrist, 2=psychologist, 'other'=not 1 or 2, 'not_sure'=no filter
    if (profession !== null && profession !== "not_sure") {
      if (profession === "other") {
        results = results.filter(
          (d) =>
            Array.isArray(d.speciality_id) && d.speciality_id[0] !== 1 && d.speciality_id[0] !== 2,
        );
      } else {
        results = results.filter(
          (d) => Array.isArray(d.speciality_id) && d.speciality_id[0] === profession,
        );
      }
    }

    // issues: illness_treated = [name, id] — match by id (index 1)
    if (issues.length > 0) {
      const ids = new Set(issues.map((i) => i.id));
      results = results.filter((d) =>
        d.illness_treated?.some(([, id]: [unknown, unknown]) => ids.has(id as number)),
      );
    }

    // languages: language_preference = [name, id] — match by name
    if (languages.length > 0) {
      const names = new Set(languages.map((l) => l.name.toLowerCase()));
      results = results.filter((d) =>
        d.language_preference?.some(([name]: [unknown, ...unknown[]]) =>
          names.has((name as string).toLowerCase()),
        ),
      );
    }

    // city: city = [name, id] — match by keyword (city.keyword); cast needed as SDK type omits city
    if (city) {
      results = results.filter((d) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (d as any).city?.some(([name]: [string]) => name.toLowerCase().includes(city.keyword)),
      );
    }

    // search
    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter((d) => d.name.toLowerCase().includes(q));
    }

    return results;
  }, [profession, issues, languages, city, search]);

  // Whether any filter is active — used to show the Clear button
  const hasActiveFilters =
    profession !== null ||
    issues.length > 0 ||
    mode !== null ||
    city !== null ||
    languages.length > 0;

  // ── Chip helper ──────────────────────────────────────────────────────────────

  function chipClass(active: boolean) {
    return [
      "flex items-center gap-1 px-3 py-2 rounded-full border text-sm font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors",
      active
        ? "border-primary bg-primary/10 text-primary"
        : "border-border bg-card text-foreground",
    ].join(" ");
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[var(--mt-cream-bg)] flex flex-col">
      {/* Header */}
      <div className="px-5 pt-6 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BackButton fallback="/home" />
          <h1 className="text-2xl font-bold text-foreground leading-tight">Find your therapist</h1>
        </div>
        <button
          onClick={() => setShowSearch((v) => !v)}
          className="p-2 rounded-full hover:bg-black/5 transition-colors"
          aria-label="Toggle search"
        >
          <Search className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Search input */}
      {showSearch && (
        <div className="px-5 pb-3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name…"
            className="bg-card"
          />
        </div>
      )}

      {/* Scrollable content */}
      <div className="px-5 pb-24 space-y-5 flex-1">
        {/* Orange banner */}
        <div className="bg-orange-500 rounded-2xl p-4 flex items-center justify-between gap-3">
          <p className="text-white font-semibold text-sm leading-snug flex-1">
            Not sure who to choose?
          </p>
          <button
            onClick={startWizard}
            className="flex items-center gap-1.5 bg-white text-orange-500 text-sm font-semibold px-3 py-2 rounded-full shrink-0"
          >
            Find my match
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Specialist type pills — tap to filter by profession without a bottom sheet */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5">
          <button
            onClick={() => setProfession(null)}
            className={[
              "px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap shrink-0 transition-colors",
              profession === null
                ? "bg-foreground text-background"
                : "border border-border bg-card text-foreground",
            ].join(" ")}
          >
            All
          </button>
          {PROFESSION_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setProfession(opt.value)}
              className={[
                "px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap shrink-0 transition-colors",
                profession === opt.value
                  ? "bg-foreground text-background"
                  : "border border-border bg-card text-foreground",
              ].join(" ")}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Filter chip bar */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5">
          {/* Clear all — only visible when at least one filter is active */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="shrink-0 text-sm font-medium text-destructive px-3 py-1.5 rounded-full border border-destructive/30 whitespace-nowrap"
            >
              Clear
            </button>
          )}

          {/* Location */}
          <button className={chipClass(city !== null)} onClick={() => setShowLocation(true)}>
            {locationLabel}
            <ChevronDown className="w-3.5 h-3.5 opacity-70" />
          </button>

          {/* Consultation mode */}
          <button className={chipClass(mode !== null)} onClick={() => setShowMode(true)}>
            {modeLabel}
            <ChevronDown className="w-3.5 h-3.5 opacity-70" />
          </button>

          {/* Language */}
          <button className={chipClass(languages.length > 0)} onClick={() => setShowLang(true)}>
            {langLabel}
            <ChevronDown className="w-3.5 h-3.5 opacity-70" />
          </button>

          {/* Experiencing */}
          <button
            className={chipClass(issues.length > 0)}
            onClick={() => setShowExperiencing(true)}
          >
            {experiencingLabel}
            <ChevronDown className="w-3.5 h-3.5 opacity-70" />
          </button>
        </div>

        {/* Count heading */}
        <p className="text-sm font-medium text-muted-foreground">
          {filtered.length} specialist{filtered.length !== 1 ? "s" : ""} available
        </p>

        {/* Doctor list */}
        <div className="space-y-4">
          {filtered.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} onBook={handleBook} />
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-10 text-sm">
              No specialists match your filters.
            </p>
          )}
        </div>
      </div>

      {/* Filter sheets */}
      {showLocation && <LocationSheet onClose={() => setShowLocation(false)} />}
      {showMode && <ModeSheet onClose={() => setShowMode(false)} />}
      {showLang && <LangSheet onClose={() => setShowLang(false)} />}
      {showExperiencing && <ExperiencingSheet onClose={() => setShowExperiencing(false)} />}
    </div>
  );
}
