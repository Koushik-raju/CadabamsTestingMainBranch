'use client';

import {
  Stethoscope, Pill, Users, HelpCircle,
  Monitor, Building2, MapPin, ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useFindTherapist,
  PROFESSION_OPTIONS,
  CITIES,
  STEP_PROFESSION,
  STEP_ISSUES,
  STEP_MODE,
  STEP_LOCATION,
  STEP_LANGUAGE,
} from './context';

// ── Icon helpers ───────────────────────────────────────────────────────────────

function ProfessionIcon({ icon }: { icon: string }) {
  if (icon === 'health_worker') return <Stethoscope className="h-6 w-6" />;
  if (icon === 'pill')          return <Pill className="h-6 w-6" />;
  if (icon === 'other')         return <Users className="h-6 w-6" />;
  return <HelpCircle className="h-6 w-6" />;
}

// ── Chip button ────────────────────────────────────────────────────────────────

function ChipBtn({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border whitespace-nowrap ${
        selected
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-muted text-muted-foreground border-transparent hover:bg-muted/80'
      }`}
    >
      {children}
    </button>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

export function WizardView() {
  const {
    step,
    profession, setProfession,
    issues, toggleIssue,
    mode, setMode,
    city, setCity,
    center, setCenter,
    languages, toggleLang,
    showAllIssues, setShowAllIssues,
    showMoreLanguages, setShowMoreLanguages,
    issueSearch, setIssueSearch,
    issuesToShow, languageList, centersForCity, canNext,
    handleNext, handleBack,
  } = useFindTherapist();

  const totalSteps = mode === 'in-person' ? 5 : 4;
  const currentStep = Math.min(step, totalSteps);
  const progressPct = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-3 border-b border-border shrink-0">
        <button type="button" onClick={handleBack} className="p-1 rounded-full hover:bg-muted transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-base font-semibold flex-1 text-foreground">Find your therapist</h1>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted shrink-0">
        <div
          className="h-1 bg-primary transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-6 pb-28">
        <div className="max-w-lg mx-auto w-full space-y-6">

          {/* ── Step 1: Profession ────────────────────────────────────────── */}
          {step === STEP_PROFESSION && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Who are you looking for?</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  We&apos;ll match you with the right specialist
                </p>
              </div>

              <div className="grid gap-3">
                {PROFESSION_OPTIONS.map((opt) => {
                  const selected = profession === opt.value;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setProfession(opt.value)}
                      className={`flex items-center gap-4 w-full px-5 py-4 rounded-2xl border-2 text-left transition-all ${
                        selected
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-card hover:border-primary/30'
                      }`}
                    >
                      <span
                        className={`p-2.5 rounded-full shrink-0 ${
                          selected ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <ProfessionIcon icon={opt.icon} />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className={`block font-semibold text-base ${selected ? 'text-primary' : 'text-foreground'}`}>
                          {opt.label}
                        </span>
                        <span className="block text-sm text-muted-foreground mt-0.5">{opt.desc}</span>
                      </span>
                      {selected && (
                        <span className="h-5 w-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                          <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 12 12">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <Button
                disabled={!canNext[STEP_PROFESSION]}
                onClick={handleNext}
                className="w-full rounded-full"
                size="lg"
              >
                Continue
              </Button>
            </div>
          )}

          {/* ── Step 2: Issues ───────────────────────────────────────────── */}
          {step === STEP_ISSUES && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">What&apos;s been on your mind?</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Select everything that applies — there are no wrong answers
                </p>
              </div>

              <Input
                placeholder="Search issues..."
                value={issueSearch}
                onChange={(e) => setIssueSearch(e.target.value)}
                className="rounded-full"
              />

              <div className="flex flex-wrap gap-2">
                {issuesToShow.map((issue) => (
                  <ChipBtn
                    key={issue.id}
                    selected={issues.some((i) => i.id === issue.id)}
                    onClick={() => toggleIssue(issue)}
                  >
                    {issue.name}
                  </ChipBtn>
                ))}
              </div>

              {!showAllIssues && (
                <button
                  type="button"
                  onClick={() => setShowAllIssues(true)}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  View all
                </button>
              )}

              <div className="space-y-3 pt-2">
                <Button onClick={handleNext} className="w-full rounded-full" size="lg">
                  Continue
                </Button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full text-sm text-center text-muted-foreground hover:text-foreground py-1"
                >
                  Skip for now
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Mode ─────────────────────────────────────────────── */}
          {step === STEP_MODE && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">How would you like to meet?</h2>
              </div>

              <div className="grid gap-3">
                {[
                  {
                    id: 'online',
                    label: 'Online',
                    desc: 'Consult from anywhere, any time',
                    icon: <Monitor className="h-6 w-6" />,
                  },
                  {
                    id: 'in-person',
                    label: 'In-person',
                    desc: 'Visit one of our centers',
                    icon: <Building2 className="h-6 w-6" />,
                  },
                ].map((opt) => {
                  const selected = mode === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setMode(opt.id);
                        if (opt.id === 'online') {
                          setCity(null);
                          setCenter(null);
                        }
                      }}
                      className={`flex items-center gap-4 w-full px-5 py-4 rounded-2xl border-2 text-left transition-all ${
                        selected
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-card hover:border-primary/30'
                      }`}
                    >
                      <span
                        className={`p-2.5 rounded-full shrink-0 ${
                          selected ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {opt.icon}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className={`block font-semibold text-base ${selected ? 'text-primary' : 'text-foreground'}`}>
                          {opt.label}
                        </span>
                        <span className="block text-sm text-muted-foreground mt-0.5">{opt.desc}</span>
                      </span>
                      {selected && (
                        <span className="h-5 w-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                          <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 12 12">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <Button
                disabled={!canNext[STEP_MODE]}
                onClick={handleNext}
                className="w-full rounded-full"
                size="lg"
              >
                Continue
              </Button>
            </div>
          )}

          {/* ── Step 4: Location ─────────────────────────────────────────── */}
          {step === STEP_LOCATION && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Where would you like to visit?</h2>
                <p className="text-sm text-muted-foreground mt-1">Select a city, then choose your preferred center</p>
              </div>

              {/* City chips */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">City</p>
                <div className="flex flex-wrap gap-2">
                  {CITIES.map((c) => {
                    const selected = city?.id === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setCity(selected ? null : c);
                          setCenter(null);
                        }}
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full border-2 text-sm font-medium transition-all ${
                          selected
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-card text-foreground hover:border-primary/30'
                        }`}
                      >
                        <MapPin className="h-4 w-4 shrink-0" />
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Center list */}
              {city && centersForCity.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-foreground">Center</p>
                  <div className="grid gap-2">
                    {centersForCity.map((c) => {
                      const selected = center?.campus_id === c.campus_id;
                      return (
                        <button
                          key={`${c.campus_id}-${c.sub_campus_id ?? 'main'}`}
                          type="button"
                          onClick={() => setCenter(selected ? null : c)}
                          className={`flex items-center gap-3 w-full p-4 rounded-2xl border-2 text-left text-sm transition-all ${
                            selected
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border bg-card text-foreground hover:border-primary/30'
                          }`}
                        >
                          <Building2 className="h-5 w-5 shrink-0" />
                          <span className="flex-1 font-medium">{c.name}</span>
                          {selected && (
                            <span className="h-5 w-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                              <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 12 12">
                                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <Button
                disabled={!canNext[STEP_LOCATION]}
                onClick={handleNext}
                className="w-full rounded-full"
                size="lg"
              >
                Continue
              </Button>
            </div>
          )}

          {/* ── Step 5: Language ─────────────────────────────────────────── */}
          {step === STEP_LANGUAGE && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Language preference?</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Optional — you can always change this later
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {languageList.map((lang) => (
                  <ChipBtn
                    key={lang.id}
                    selected={languages.some((l) => l.id === lang.id)}
                    onClick={() => toggleLang(lang)}
                  >
                    {lang.name}
                  </ChipBtn>
                ))}
              </div>

              {!showMoreLanguages && (
                <button
                  type="button"
                  onClick={() => setShowMoreLanguages(true)}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  More languages
                </button>
              )}

              <div className="space-y-3 pt-2">
                <Button onClick={handleNext} className="w-full rounded-full" size="lg">
                  See my matches
                </Button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full text-sm text-center text-muted-foreground hover:text-foreground py-1"
                >
                  Skip — no preference
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
