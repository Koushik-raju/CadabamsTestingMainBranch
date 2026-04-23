"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Building2,
  Check,
  HelpCircle,
  MapPin,
  Monitor,
  Pill,
  Stethoscope,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import {
  ALL_ISSUES,
  CENTERS_BY_CITY,
  CITIES,
  LANGUAGES_MORE,
  LANGUAGES_TOP,
  PROFESSION_OPTIONS,
  type ProfessionValue,
  useFindTherapist,
} from "./context";

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

interface SheetProps {
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Shared shell
// ---------------------------------------------------------------------------

function SheetShell({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end" onClick={onClose}>
      <div
        className="bg-background w-full rounded-t-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1. DoctorTypeSheet
// ---------------------------------------------------------------------------

const PROFESSION_ICONS: Record<string, React.ElementType> = {
  health_worker: Stethoscope,
  psychiatrist: Pill,
  other: Users,
  not_sure: HelpCircle,
};

export function DoctorTypeSheet({ onClose }: SheetProps) {
  const { profession, setProfession } = useFindTherapist();

  return (
    <SheetShell onClose={onClose}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <h2 className="text-base font-semibold">Select specialist type</h2>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-muted transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Body */}
      <div className="overflow-y-auto flex-1 p-4 space-y-3">
        {/* All option */}
        <button
          onClick={() => {
            setProfession(null);
            onClose();
          }}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${
            profession === null ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
          }`}
        >
          <span className="font-medium">All types</span>
          {profession === null && <Check className="h-4 w-4 text-primary shrink-0" />}
        </button>

        {PROFESSION_OPTIONS.map((opt) => {
          const Icon = PROFESSION_ICONS[opt.value] ?? HelpCircle;
          const isSelected = profession === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => {
                setProfession(opt.value as ProfessionValue);
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors text-left ${
                isSelected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
              }`}
            >
              <Icon
                className={`h-5 w-5 shrink-0 ${
                  isSelected ? "text-primary" : "text-muted-foreground"
                }`}
              />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${isSelected ? "text-primary" : ""}`}>
                  {opt.label}
                </p>
                {opt.desc && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{opt.desc}</p>
                )}
              </div>
              {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
            </button>
          );
        })}
      </div>
    </SheetShell>
  );
}

// ---------------------------------------------------------------------------
// 2. ModeSheet
// ---------------------------------------------------------------------------

export function ModeSheet({ onClose }: SheetProps) {
  const { mode, setMode, city, setCity, center, setCenter } = useFindTherapist();

  return (
    <SheetShell onClose={onClose}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <h2 className="text-base font-semibold">Consultation mode</h2>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-muted transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Body */}
      <div className="overflow-y-auto flex-1 p-4 space-y-3">
        {/* Any mode */}
        <button
          onClick={() => setMode(null)}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${
            mode === null ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
          }`}
        >
          <span className="font-medium">Any mode</span>
          {mode === null && <Check className="h-4 w-4 text-primary shrink-0" />}
        </button>

        {/* Online */}
        <button
          onClick={() => setMode("online")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors text-left ${
            mode === "online" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
          }`}
        >
          <Monitor
            className={`h-5 w-5 shrink-0 ${
              mode === "online" ? "text-primary" : "text-muted-foreground"
            }`}
          />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${mode === "online" ? "text-primary" : ""}`}>
              Online
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Consult from anywhere</p>
          </div>
          {mode === "online" && <Check className="h-4 w-4 text-primary shrink-0" />}
        </button>

        {/* In-person */}
        <button
          onClick={() => setMode("in-person")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors text-left ${
            mode === "in-person" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
          }`}
        >
          <Building2
            className={`h-5 w-5 shrink-0 ${
              mode === "in-person" ? "text-primary" : "text-muted-foreground"
            }`}
          />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${mode === "in-person" ? "text-primary" : ""}`}>
              In-person
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Visit a center near you</p>
          </div>
          {mode === "in-person" && <Check className="h-4 w-4 text-primary shrink-0" />}
        </button>

        {/* Inline city + center picker when in-person is selected */}
        {mode === "in-person" && (
          <div className="mt-1 space-y-3 pl-2 border-l-2 border-primary/30">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 pt-1">
              Select city
            </p>
            {CITIES.map((c) => {
              const isSelectedCity = city?.id === c.id;
              return (
                <div key={c.id}>
                  <button
                    onClick={() => {
                      setCity(c);
                      setCenter(null);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors text-left ${
                      isSelectedCity
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <MapPin
                      className={`h-4 w-4 shrink-0 ${
                        isSelectedCity ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                    <span
                      className={`text-sm font-medium flex-1 ${
                        isSelectedCity ? "text-primary" : ""
                      }`}
                    >
                      {c.name}
                    </span>
                    {isSelectedCity && <Check className="h-4 w-4 text-primary shrink-0" />}
                  </button>

                  {/* Centers for this city */}
                  {isSelectedCity && CENTERS_BY_CITY[c.id] && CENTERS_BY_CITY[c.id].length > 0 && (
                    <div className="mt-2 ml-4 space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Select center
                      </p>
                      {CENTERS_BY_CITY[c.id].map((ct) => {
                        const isSelectedCenter = center?.campus_id === ct.campus_id;
                        return (
                          <button
                            key={ct.campus_id}
                            onClick={() => setCenter(ct)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors text-left ${
                              isSelectedCenter
                                ? "border-primary bg-primary/5"
                                : "border-border hover:bg-muted/50"
                            }`}
                          >
                            <Building2
                              className={`h-4 w-4 shrink-0 ${
                                isSelectedCenter ? "text-primary" : "text-muted-foreground"
                              }`}
                            />
                            <span
                              className={`text-sm flex-1 ${
                                isSelectedCenter ? "text-primary font-medium" : ""
                              }`}
                            >
                              {ct.name}
                            </span>
                            {isSelectedCenter && (
                              <Check className="h-4 w-4 text-primary shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t shrink-0">
        <Button className="w-full" onClick={onClose}>
          Done
        </Button>
      </div>
    </SheetShell>
  );
}

// ---------------------------------------------------------------------------
// 3. LangSheet
// ---------------------------------------------------------------------------

export function LangSheet({ onClose }: SheetProps) {
  const { languages, toggleLang, clearLanguages } = useFindTherapist();
  const allLangs = [...LANGUAGES_TOP, ...LANGUAGES_MORE];

  return (
    <SheetShell onClose={onClose}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <h2 className="text-base font-semibold">Language preference</h2>
        <div className="flex items-center gap-2">
          {languages.length > 0 && (
            <button
              onClick={clearLanguages}
              className="text-sm text-primary font-medium hover:underline"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="overflow-y-auto flex-1 p-4">
        <div className="flex flex-wrap gap-2">
          {allLangs.map((lang) => {
            const isSelected = languages.some((l) => l.id === lang.id);
            return (
              <button
                key={lang.id}
                onClick={() => toggleLang(lang)}
                className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:bg-muted/50"
                }`}
              >
                {lang.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t shrink-0">
        <Button className="w-full" onClick={onClose}>
          Done
        </Button>
      </div>
    </SheetShell>
  );
}

// ---------------------------------------------------------------------------
// 4. ExperiencingSheet
// ---------------------------------------------------------------------------

export function ExperiencingSheet({ onClose }: SheetProps) {
  const { issues, toggleIssue, clearIssues } = useFindTherapist();
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? ALL_ISSUES.filter((issue) => issue.name.toLowerCase().includes(search.trim().toLowerCase()))
    : ALL_ISSUES;

  return (
    <SheetShell onClose={onClose}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <h2 className="text-base font-semibold">What are you experiencing?</h2>
        <div className="flex items-center gap-2">
          {issues.length > 0 && (
            <button
              onClick={clearIssues}
              className="text-sm text-primary font-medium hover:underline"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-2 border-b shrink-0">
        <Input
          placeholder="Search concerns..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9"
        />
      </div>

      {/* Body */}
      <div className="overflow-y-auto flex-1 p-4">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No results for &ldquo;{search}&rdquo;
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {filtered.map((issue) => {
              const isSelected = issues.some((i) => i.id === issue.id);
              return (
                <button
                  key={issue.id}
                  onClick={() => toggleIssue(issue)}
                  className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:bg-muted/50"
                  }`}
                >
                  {issue.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t shrink-0">
        <Button className="w-full" onClick={onClose}>
          Done
        </Button>
      </div>
    </SheetShell>
  );
}

// ---------------------------------------------------------------------------
// 5. LocationSheet
// ---------------------------------------------------------------------------

export function LocationSheet({ onClose }: SheetProps) {
  const { city, setCity, center, setCenter } = useFindTherapist();

  return (
    <SheetShell onClose={onClose}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <h2 className="text-base font-semibold">Select location</h2>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-muted transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Body */}
      <div className="overflow-y-auto flex-1 p-4 space-y-3">
        {/* Any location */}
        <button
          onClick={() => {
            setCity(null);
            setCenter(null);
          }}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${
            city === null ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
          }`}
        >
          <span className="font-medium">Any location</span>
          {city === null && <Check className="h-4 w-4 text-primary shrink-0" />}
        </button>

        {CITIES.map((c) => {
          const isSelectedCity = city?.id === c.id;
          return (
            <div key={c.id}>
              <button
                onClick={() => {
                  setCity(c);
                  setCenter(null);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors text-left ${
                  isSelectedCity ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                }`}
              >
                <MapPin
                  className={`h-5 w-5 shrink-0 ${
                    isSelectedCity ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                <span
                  className={`text-sm font-medium flex-1 ${isSelectedCity ? "text-primary" : ""}`}
                >
                  {c.name}
                </span>
                {isSelectedCity && <Check className="h-4 w-4 text-primary shrink-0" />}
              </button>

              {/* Centers for selected city */}
              {isSelectedCity && CENTERS_BY_CITY[c.id] && CENTERS_BY_CITY[c.id].length > 0 && (
                <div className="mt-2 ml-6 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2">
                    Select center
                  </p>
                  {CENTERS_BY_CITY[c.id].map((ct) => {
                    const isSelectedCenter = center?.campus_id === ct.campus_id;
                    return (
                      <button
                        key={ct.campus_id}
                        onClick={() => setCenter(ct)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors text-left ${
                          isSelectedCenter
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted/50"
                        }`}
                      >
                        <Building2
                          className={`h-4 w-4 shrink-0 ${
                            isSelectedCenter ? "text-primary" : "text-muted-foreground"
                          }`}
                        />
                        <span
                          className={`text-sm flex-1 ${
                            isSelectedCenter ? "text-primary font-medium" : ""
                          }`}
                        >
                          {ct.name}
                        </span>
                        {isSelectedCenter && <Check className="h-4 w-4 text-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t shrink-0">
        <Button className="w-full" onClick={onClose}>
          Done
        </Button>
      </div>
    </SheetShell>
  );
}
