'use client';

import { useState, useMemo } from 'react';
import { Search, ChevronDown, ArrowRight } from 'lucide-react';
import { BackButton } from '@/components/shared/navigation/back-button';
import { Input } from '@/components/ui/input';
import { DoctorCard } from '@/components/find-therapist/doctor-card';
import { DOCTORS } from '@/data/doctors';
import { useFindTherapist, PROFESSION_OPTIONS } from './context';
import {
  DoctorTypeSheet,
  ModeSheet,
  LangSheet,
  ExperiencingSheet,
  LocationSheet,
} from './filter-sheets';

export function ListView() {
  const {
    profession,
    mode,
    languages,
    issues,
    city,
    handleBook,
    startWizard,
  } = useFindTherapist();

  const [search,           setSearch]           = useState('');
  const [showSearch,       setShowSearch]       = useState(false);
  const [showDocType,      setShowDocType]      = useState(false);
  const [showMode,         setShowMode]         = useState(false);
  const [showLang,         setShowLang]         = useState(false);
  const [showExperiencing, setShowExperiencing] = useState(false);
  const [showLocation,     setShowLocation]     = useState(false);

  // ── Derived chip labels ──────────────────────────────────────────────────────

  const docTypeLabel = useMemo(() => {
    if (profession === null) return 'All';
    const match = PROFESSION_OPTIONS.find((o) => o.value === profession);
    return match ? match.label : 'All';
  }, [profession]);

  const modeLabel = useMemo(() => {
    if (mode === null) return 'Any mode';
    if (mode === 'online') return 'Online';
    if (mode === 'in-person') return 'In-person';
    return 'Any mode';
  }, [mode]);

  const langLabel = useMemo(() => {
    if (languages.length === 0) return 'Language';
    if (languages.length === 1) return languages[0].name;
    return `Language (${languages.length})`;
  }, [languages]);

  const experiencingLabel = useMemo(() => {
    if (issues.length === 0) return 'Experiencing';
    if (issues.length === 1) return issues[0].name;
    return `Experiencing (${issues.length})`;
  }, [issues]);

  const locationLabel = useMemo(() => {
    if (!city) return 'Location';
    return city.name;
  }, [city]);

  // ── Filtered doctors ─────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let results = [...DOCTORS];

    // profession: 1=psychiatrist, 2=psychologist, 'other'=not 1 or 2, 'not_sure'=no filter
    if (profession !== null && profession !== 'not_sure') {
      if (profession === 'other') {
        results = results.filter(
          (d) => Array.isArray(d.speciality_id) && d.speciality_id[0] !== 1 && d.speciality_id[0] !== 2
        );
      } else {
        results = results.filter(
          (d) => Array.isArray(d.speciality_id) && d.speciality_id[0] === profession
        );
      }
    }

    // issues: illness_treated = [name, id] — match by id (index 1)
    if (issues.length > 0) {
      const ids = new Set(issues.map((i) => i.id));
      results = results.filter((d) => d.illness_treated?.some(([, id]: [unknown, unknown]) => ids.has(id as number)));
    }

    // languages: language_preference = [name, id] — match by name
    if (languages.length > 0) {
      const names = new Set(languages.map((l) => l.name.toLowerCase()));
      results = results.filter((d) =>
        d.language_preference?.some(([name]: [unknown, ...unknown[]]) => names.has((name as string).toLowerCase()))
      );
    }

    // city: city = [name, id] — match by keyword (city.keyword); cast needed as SDK type omits city
    if (city) {
      results = results.filter((d) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (d as any).city?.some(([name]: [string]) => name.toLowerCase().includes(city.keyword))
      );
    }

    // search
    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter((d) => d.name.toLowerCase().includes(q));
    }

    return results;
  }, [profession, issues, languages, city, search]);

  // ── Chip helper ──────────────────────────────────────────────────────────────

  function chipClass(active: boolean) {
    return [
      'flex items-center gap-1 px-3 py-2 rounded-full border text-sm font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors',
      active
        ? 'border-primary bg-primary/10 text-primary'
        : 'border-border bg-card text-foreground',
    ].join(' ');
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#f6f4f2] flex flex-col">
      {/* Header */}
      <div className="px-5 pt-6 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BackButton fallback="/home" />
          <h1 className="text-2xl font-bold text-foreground leading-tight">
            Find your therapist
          </h1>
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

        {/* Filter chip bar */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5">
          {/* Doctor type */}
          <button className={chipClass(profession !== null)} onClick={() => setShowDocType(true)}>
            {docTypeLabel}
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

          {/* Location */}
          <button className={chipClass(city !== null)} onClick={() => setShowLocation(true)}>
            {locationLabel}
            <ChevronDown className="w-3.5 h-3.5 opacity-70" />
          </button>
        </div>

        {/* Count heading */}
        <p className="text-sm font-medium text-muted-foreground">
          {filtered.length} specialist{filtered.length !== 1 ? 's' : ''} available
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
      {showDocType     && <DoctorTypeSheet    onClose={() => setShowDocType(false)} />}
      {showMode        && <ModeSheet          onClose={() => setShowMode(false)} />}
      {showLang        && <LangSheet          onClose={() => setShowLang(false)} />}
      {showExperiencing && <ExperiencingSheet onClose={() => setShowExperiencing(false)} />}
      {showLocation    && <LocationSheet      onClose={() => setShowLocation(false)} />}
    </div>
  );
}
