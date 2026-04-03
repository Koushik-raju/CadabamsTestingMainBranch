'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Stethoscope,
  Pill,
  HelpCircle,
  Monitor,
  Building2,
  MapPin,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BackButton } from '@/components/common/back-button';
import { DoctorCard } from '@/components/doctor/doctor-card';
import { doctorService } from '@/services/doctor.service';

// ── Constants ──────────────────────────────────────────────────────────────────

const STEP_PROFESSION = 1;
const STEP_ISSUES = 2;
const STEP_MODE = 3;
const STEP_LOCATION = 4;
const STEP_LANGUAGE = 5;
const STEP_RESULTS = 6;

interface IssueOption { id: number; name: string }
interface LangOption  { id: number; name: string }
interface CityOption  { id: string; name: string }
interface CenterOption { campus_id: number; sub_campus_id: number | null; name: string }

const PROFESSION_OPTIONS = [
  { id: 'psychologist', value: 2 as number | 'not_sure', label: 'Psychologist', icon: 'health_worker' },
  { id: 'psychiatrist', value: 1 as number | 'not_sure', label: 'Psychiatrist', icon: 'pill' },
  { id: 'not_sure',     value: 'not_sure' as number | 'not_sure', label: "I'm not sure — help me decide", icon: 'shrug' },
];

const TOP_ISSUES: IssueOption[] = [
  { id: 3,  name: 'Anxiety' },
  { id: 38, name: 'Depression' },
  { id: 19, name: 'Stress & burnout' },
  { id: 2,  name: 'ADHD' },
  { id: 17, name: 'Relationship issues' },
  { id: 21, name: 'Sleep problems' },
  { id: 30, name: 'Child / adolescent concerns' },
];

const ALL_ISSUES: IssueOption[] = [
  ...TOP_ISSUES,
  { id: 14, name: 'Obsessive-Compulsive Disorder' },
  { id: 33, name: 'Bipolar' },
  { id: 27, name: 'Family issues' },
  { id: 20, name: 'Trauma' },
  { id: 9,  name: 'Eating Disorders' },
  { id: 36, name: 'Drug addiction' },
  { id: 37, name: 'Alcohol Addiction' },
  { id: 1,  name: 'Addiction' },
];

const CITIES: CityOption[] = [
  { id: 'bangalore', name: 'Bangalore' },
  { id: 'mysore',    name: 'Mysore' },
];

const CENTERS_BY_CITY: Record<string, CenterOption[]> = {
  bangalore: [
    { campus_id: 1, sub_campus_id: null, name: 'Cadabams Hospital – JP Nagar' },
    { campus_id: 2, sub_campus_id: null, name: 'Cadabams Hospital – Whitefield' },
    { campus_id: 3, sub_campus_id: null, name: 'MindTalk – Indiranagar' },
    { campus_id: 4, sub_campus_id: null, name: 'MindTalk – Sarjapura Road' },
  ],
  mysore: [
    { campus_id: 7, sub_campus_id: null, name: 'Cadabams Spark – Nivedita Nagar' },
  ],
};

const LANGUAGES_TOP: LangOption[] = [
  { id: 1, name: 'English' },
  { id: 2, name: 'Hindi' },
  { id: 3, name: 'Kannada' },
  { id: 4, name: 'Telugu' },
  { id: 5, name: 'Tamil' },
];

const LANGUAGES_MORE: LangOption[] = [
  { id: 6, name: 'Malayalam' },
  { id: 7, name: 'Bengali' },
  { id: 8, name: 'Marathi' },
  { id: 9, name: 'Gujarati' },
];

const MODE_OPTIONS = [
  { id: 'online',     value: 'online',     label: 'Online',     icon: 'computer',  consultationTypeId: '2' },
  { id: 'in-person',  value: 'in-person',  label: 'In-person',  icon: 'hospital',  consultationTypeId: '1' },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function professionIcon(icon: string) {
  if (icon === 'health_worker') return <Stethoscope className="h-5 w-5" />;
  if (icon === 'pill')          return <Pill className="h-5 w-5" />;
  return <HelpCircle className="h-5 w-5" />;
}

function displayName(name: unknown): string {
  const raw = (String(name || '')).trim();
  if (!raw) return 'Doctor';
  return /^Dr\.?\s/i.test(raw) ? raw : `Dr. ${raw}`;
}

// ── Step pill buttons ──────────────────────────────────────────────────────────

interface PillBtnProps {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

function PillBtn({ selected, onClick, children, className = '' }: PillBtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-full border-2 text-left transition-all text-sm font-medium ${
        selected
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border bg-card text-foreground hover:border-primary/30'
      } ${className}`}
    >
      {children}
    </button>
  );
}

function ChipBtn({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
        selected
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-muted text-muted-foreground border-transparent hover:bg-muted/80'
      }`}
    >
      {children}
    </button>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function FindTherapistPage() {
  const router = useRouter();

  const [step, setStep] = useState(STEP_PROFESSION);
  const [profession, setProfession] = useState<number | 'not_sure' | null>(null);
  const [issues,      setIssues]     = useState<IssueOption[]>([]);
  const [mode,        setMode]       = useState<string | null>(null);
  const [city,        setCity]       = useState<CityOption | null>(null);
  const [center,      setCenter]     = useState<CenterOption | null>(null);
  const [languages,   setLanguages]  = useState<LangOption[]>([]);
  const [showAllIssues,      setShowAllIssues]      = useState(false);
  const [showMoreLanguages,  setShowMoreLanguages]  = useState(false);
  const [issueSearch, setIssueSearch] = useState('');
  const [doctors,     setDoctors]    = useState<Record<string, unknown>[]>([]);
  const [loading,     setLoading]    = useState(false);
  const [error,       setError]      = useState<string | null>(null);

  const consultationTypeId = mode === 'online' ? '2' : mode === 'in-person' ? '1' : null;

  const centersForCity = useMemo(
    () => (city ? CENTERS_BY_CITY[city.id] ?? [] : []),
    [city]
  );

  const issuesToShow = useMemo(() => {
    const list = showAllIssues ? ALL_ISSUES : TOP_ISSUES;
    const q = issueSearch.trim().toLowerCase();
    return q ? list.filter((i) => i.name.toLowerCase().includes(q)) : list;
  }, [showAllIssues, issueSearch]);

  const languageList = useMemo(
    () => (showMoreLanguages ? [...LANGUAGES_TOP, ...LANGUAGES_MORE] : LANGUAGES_TOP),
    [showMoreLanguages]
  );

  const toggleIssue = (issue: IssueOption) =>
    setIssues((prev) =>
      prev.some((i) => i.id === issue.id) ? prev.filter((i) => i.id !== issue.id) : [...prev, issue]
    );

  const toggleLang = (lang: LangOption) =>
    setLanguages((prev) =>
      prev.some((l) => l.id === lang.id) ? prev.filter((l) => l.id !== lang.id) : [...prev, lang]
    );

  const canNext: Record<number, boolean> = {
    [STEP_PROFESSION]: profession !== null,
    [STEP_ISSUES]:     true,
    [STEP_MODE]:       mode !== null,
    [STEP_LOCATION]:   mode !== 'in-person' || (city !== null && center !== null),
    [STEP_LANGUAGE]:   true,
  };

  const handleNext = () => {
    if (step === STEP_PROFESSION && canNext[STEP_PROFESSION]) setStep(STEP_ISSUES);
    else if (step === STEP_ISSUES)  setStep(STEP_MODE);
    else if (step === STEP_MODE && canNext[STEP_MODE]) {
      setStep(mode === 'in-person' ? STEP_LOCATION : STEP_LANGUAGE);
    } else if (step === STEP_LOCATION && canNext[STEP_LOCATION]) setStep(STEP_LANGUAGE);
    else if (step === STEP_LANGUAGE) {
      setStep(STEP_RESULTS);
      fetchDoctors();
    }
  };

  const handleBack = () => {
    if (step === STEP_LANGUAGE) setStep(mode === 'in-person' ? STEP_LOCATION : STEP_MODE);
    else if (step === STEP_LOCATION) setStep(STEP_MODE);
    else if (step === STEP_MODE)     setStep(STEP_ISSUES);
    else if (step === STEP_ISSUES)   setStep(STEP_PROFESSION);
    else if (step === STEP_RESULTS)  setStep(STEP_LANGUAGE);
    else setStep((s) => Math.max(STEP_PROFESSION, s - 1));
  };

  const fetchDoctors = async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: Record<string, string> = {
        language_preference: languages.map((l) => l.id).join(','),
        illness_treated:     issues.map((i) => i.id).join(','),
        consultationTypeId:  consultationTypeId ?? '2',
      };
      if (center?.campus_id)     filters.campus_id     = String(center.campus_id);
      if (center?.sub_campus_id) filters.sub_campus_id = String(center.sub_campus_id);

      let allDoctors: Record<string, unknown>[] = [];

      const flatten = (res: unknown): Record<string, unknown>[] => {
        if (Array.isArray(res)) return res.flatMap((g) => ((g as Record<string, unknown>).data as Record<string, unknown>[]) ?? [g]);
        return [];
      };

      if (profession === null || profession === 'not_sure') {
        const [r1, r2] = await Promise.all([
          doctorService.getDoctors({ ...filters, speciality_id: '1' }),
          doctorService.getDoctors({ ...filters, speciality_id: '2' }),
        ]);
        allDoctors = [...flatten(r1), ...flatten(r2)];
      } else {
        const res = await doctorService.getDoctors({ ...filters, speciality_id: String(profession) });
        allDoctors = flatten(res);
      }
      setDoctors(allDoctors);
    } catch (err) {
      console.error(err);
      setError('Unable to load doctors. Please try again.');
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = (doctor: Record<string, unknown>) => {
    const params = new URLSearchParams();
    params.set('id',               String(doctor.id ?? ''));
    params.set('name',             String(doctor.name ?? doctor.professional_name ?? ''));
    params.set('speciality',       Array.isArray(doctor.speciality_id) ? String(doctor.speciality_id[1]) : String(doctor.speciality_id ?? ''));
    params.set('mode',             mode ?? 'online');
    params.set('consultationTypeId', consultationTypeId ?? '2');
    if (center?.campus_id)     params.set('campus_id',     String(center.campus_id));
    if (center?.sub_campus_id) params.set('sub_campus_id', String(center.sub_campus_id));
    router.push(`/booking?${params.toString()}`);
  };

  // ── Step progress indicator ──────────────────────────────────────────────────
  const totalSteps = mode === 'in-person' ? 6 : 5;
  const currentDisplayStep = Math.min(step, totalSteps);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-3 border-b border-border">
        <BackButton fallback="/" />
        <h1 className="text-base font-semibold text-foreground flex-1">
          Help me find the right therapist
        </h1>
      </div>

      {/* Progress bar */}
      {step < STEP_RESULTS && (
        <div className="h-1 bg-muted">
          <div
            className="h-1 bg-primary transition-all duration-300"
            style={{ width: `${((currentDisplayStep - 1) / (totalSteps - 1)) * 100}%` }}
          />
        </div>
      )}

      <div className="flex-1 px-4 py-6 pb-28 max-w-2xl mx-auto w-full space-y-6">

        {/* ── Step 1: Profession ─────────────────────────────────────────────── */}
        {step === STEP_PROFESSION && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-foreground">Who are you looking for?</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Not sure? That&apos;s completely okay — we&apos;ll guide you.
              </p>
            </div>
            <div className="grid gap-3">
              {PROFESSION_OPTIONS.map((opt) => (
                <PillBtn
                  key={opt.id}
                  selected={profession === opt.value}
                  onClick={() => setProfession(opt.value)}
                >
                  <span className="p-1.5 rounded-full bg-muted text-muted-foreground">
                    {professionIcon(opt.icon)}
                  </span>
                  <span>{opt.label}</span>
                </PillBtn>
              ))}
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

        {/* ── Step 2: Issues ─────────────────────────────────────────────────── */}
        {step === STEP_ISSUES && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-foreground">What are you currently experiencing?</h2>
              <p className="text-sm text-muted-foreground mt-1">Select all that apply (optional).</p>
            </div>
            <Input
              type="text"
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
            <div className="space-y-3">
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 rounded-full" onClick={handleBack}>
                  Back
                </Button>
                <Button className="flex-1 rounded-full" onClick={handleNext}>
                  Continue
                </Button>
              </div>
              <button
                type="button"
                onClick={handleNext}
                className="w-full text-sm text-muted-foreground hover:text-foreground"
              >
                Skip for now
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Mode ───────────────────────────────────────────────────── */}
        {step === STEP_MODE && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-foreground">How would you like to attend your session?</h2>
            <div className="grid gap-3">
              {MODE_OPTIONS.map((opt) => (
                <PillBtn
                  key={opt.id}
                  selected={mode === opt.value}
                  onClick={() => {
                    setMode(opt.value);
                    if (opt.value === 'online') { setCity(null); setCenter(null); }
                  }}
                >
                  {opt.icon === 'computer'
                    ? <Monitor className="h-5 w-5 text-muted-foreground" />
                    : <Building2 className="h-5 w-5 text-muted-foreground" />}
                  <span>{opt.label}</span>
                </PillBtn>
              ))}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-full" onClick={handleBack}>Back</Button>
              <Button disabled={!canNext[STEP_MODE]} className="flex-1 rounded-full" onClick={handleNext}>Continue</Button>
            </div>
          </div>
        )}

        {/* ── Step 4: Location (in-person) ───────────────────────────────────── */}
        {step === STEP_LOCATION && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-foreground">Where would you like to visit?</h2>
              <p className="text-sm text-muted-foreground mt-1">Select city, then center.</p>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">City</p>
              <div className="flex flex-wrap gap-2">
                {CITIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => { setCity(c); setCenter(null); }}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full border-2 text-sm font-medium transition-colors ${
                      city?.id === c.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card text-foreground'
                    }`}
                  >
                    <MapPin className="h-4 w-4" />
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {city && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">Center</p>
                <div className="grid gap-2">
                  {centersForCity.map((c) => (
                    <button
                      key={`${c.campus_id}-${c.sub_campus_id ?? 'main'}`}
                      type="button"
                      onClick={() => setCenter(c)}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left text-sm transition-colors ${
                        center?.campus_id === c.campus_id
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-card text-foreground'
                      }`}
                    >
                      <Building2 className="h-4 w-4 shrink-0" />
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-full" onClick={handleBack}>Back</Button>
              <Button disabled={!canNext[STEP_LOCATION]} className="flex-1 rounded-full" onClick={handleNext}>Continue</Button>
            </div>
          </div>
        )}

        {/* ── Step 5: Language ───────────────────────────────────────────────── */}
        {step === STEP_LANGUAGE && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-foreground">Do you have a language preference?</h2>
              <p className="text-sm text-muted-foreground mt-1">Optional — you can skip.</p>
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
            <div className="space-y-3">
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 rounded-full" onClick={handleBack}>Back</Button>
                <Button className="flex-1 rounded-full" onClick={handleNext}>
                  See matched doctors
                </Button>
              </div>
              <button
                type="button"
                onClick={handleNext}
                className="w-full text-sm text-muted-foreground hover:text-foreground"
              >
                Skip — no preference
              </button>
            </div>
          </div>
        )}

        {/* ── Step 6: Results ────────────────────────────────────────────────── */}
        {step === STEP_RESULTS && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Doctors who match your preferences
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {doctors.length > 0 ? `${doctors.length} found` : ''}
              </p>
            </div>

            {loading && (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm py-4">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {!loading && !error && doctors.length === 0 && (
              <p className="text-center text-muted-foreground py-8 text-sm">
                No doctors found. Try adjusting your preferences.
              </p>
            )}

            {!loading && doctors.length > 0 && (
              <div className="grid gap-4">
                {doctors.map((doc) => (
                  <DoctorCard
                    key={String(doc.id)}
                    doctor={doc}
                    mode={mode ?? 'online'}
                    centerName={center?.name}
                    onBook={handleBook}
                  />
                ))}
              </div>
            )}

            <Button variant="outline" className="w-full rounded-full" onClick={handleBack}>
              Back to preferences
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
