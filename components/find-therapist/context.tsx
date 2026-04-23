"use client";

import type { DoctorListing as Doctor } from "@/data/doctors";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface IssueOption {
  id: number;
  name: string;
}
export interface LangOption {
  id: number;
  name: string;
}
export interface CityOption {
  id: string;
  name: string;
  keyword: string;
}
export interface CenterOption {
  campus_id: number;
  sub_campus_id: number | null;
  name: string;
}

export type ProfessionValue = 1 | 2 | "other" | "not_sure";
export type View = "list" | "wizard";

export const STEP_PROFESSION = 1;
export const STEP_ISSUES = 2;
export const STEP_MODE = 3;
export const STEP_LOCATION = 4;
export const STEP_LANGUAGE = 5;

export const PROFESSION_OPTIONS = [
  {
    id: "psychologist",
    value: 2 as ProfessionValue,
    label: "Psychologist",
    desc: "Talk therapy & counselling",
    icon: "health_worker",
  },
  {
    id: "psychiatrist",
    value: 1 as ProfessionValue,
    label: "Psychiatrist",
    desc: "Medication management",
    icon: "pill",
  },
  {
    id: "other",
    value: "other" as ProfessionValue,
    label: "Other specialist",
    desc: "OT, counselor & more",
    icon: "other",
  },
  {
    id: "not_sure",
    value: "not_sure" as ProfessionValue,
    label: "I'm not sure",
    desc: "Help me decide",
    icon: "shrug",
  },
];

export const TOP_ISSUES: IssueOption[] = [
  { id: 3, name: "Anxiety" },
  { id: 38, name: "Depression" },
  { id: 19, name: "Stress & burnout" },
  { id: 2, name: "ADHD" },
  { id: 17, name: "Relationship issues" },
  { id: 21, name: "Sleep problems" },
  { id: 30, name: "Child / adolescent concerns" },
];

export const ALL_ISSUES: IssueOption[] = [
  ...TOP_ISSUES,
  { id: 14, name: "Obsessive-Compulsive Disorder" },
  { id: 33, name: "Bipolar" },
  { id: 27, name: "Family issues" },
  { id: 20, name: "Trauma" },
  { id: 9, name: "Eating Disorders" },
  { id: 36, name: "Drug addiction" },
  { id: 37, name: "Alcohol Addiction" },
  { id: 1, name: "Addiction" },
];

export const CITIES: CityOption[] = [
  { id: "bangalore", name: "Bangalore", keyword: "bengaluru" },
  { id: "mysore", name: "Mysore", keyword: "mysore" },
];

export const CENTERS_BY_CITY: Record<string, CenterOption[]> = {
  bangalore: [
    { campus_id: 1, sub_campus_id: null, name: "Cadabams Hospital – JP Nagar" },
    {
      campus_id: 2,
      sub_campus_id: null,
      name: "Cadabams Hospital – Whitefield",
    },
    { campus_id: 3, sub_campus_id: null, name: "MindTalk – Indiranagar" },
    { campus_id: 4, sub_campus_id: null, name: "MindTalk – Sarjapura Road" },
  ],
  mysore: [
    {
      campus_id: 7,
      sub_campus_id: null,
      name: "Cadabams Spark – Nivedita Nagar",
    },
  ],
};

export const LANGUAGES_TOP: LangOption[] = [
  { id: 1, name: "English" },
  { id: 2, name: "Hindi" },
  { id: 3, name: "Kannada" },
  { id: 4, name: "Telugu" },
  { id: 5, name: "Tamil" },
];

export const LANGUAGES_MORE: LangOption[] = [
  { id: 6, name: "Malayalam" },
  { id: 7, name: "Bengali" },
  { id: 8, name: "Marathi" },
  { id: 9, name: "Gujarati" },
];

export const MODE_OPTIONS = [
  {
    id: "online",
    value: "online",
    label: "Online",
    icon: "computer",
    consultationTypeId: 2,
  },
  {
    id: "in-person",
    value: "in-person",
    label: "In-person",
    icon: "hospital",
    consultationTypeId: 1,
  },
];

// ── Context value ─────────────────────────────────────────────────────────────

interface FindTherapistContextValue {
  // view
  view: View;
  setView: (v: View) => void;
  // wizard step
  step: number;
  // selections
  profession: ProfessionValue | null;
  setProfession: (v: ProfessionValue | null) => void;
  issues: IssueOption[];
  toggleIssue: (i: IssueOption) => void;
  clearIssues: () => void;
  mode: string | null;
  setMode: (v: string | null) => void;
  city: CityOption | null;
  setCity: (v: CityOption | null) => void;
  center: CenterOption | null;
  setCenter: (v: CenterOption | null) => void;
  languages: LangOption[];
  toggleLang: (l: LangOption) => void;
  clearLanguages: () => void;
  // ui helpers
  showAllIssues: boolean;
  setShowAllIssues: (v: boolean) => void;
  showMoreLanguages: boolean;
  setShowMoreLanguages: (v: boolean) => void;
  issueSearch: string;
  setIssueSearch: (v: string) => void;
  // computed
  consultationTypeId: number;
  centersForCity: CenterOption[];
  issuesToShow: IssueOption[];
  languageList: LangOption[];
  canNext: Record<number, boolean>;
  // actions
  handleNext: () => void;
  handleBack: () => void;
  clearFilters: () => void;
  handleBook: (doctor: Doctor) => void;
  startWizard: () => void;
}

const FindTherapistContext = createContext<FindTherapistContextValue | null>(null);

export function useFindTherapist() {
  const ctx = useContext(FindTherapistContext);
  if (!ctx) throw new Error("useFindTherapist must be used within FindTherapistProvider");
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function FindTherapistProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const [view, setView] = useState<View>("list");
  const [step, setStep] = useState(STEP_PROFESSION);
  const [profession, setProfession] = useState<ProfessionValue | null>(null);
  const [issues, setIssues] = useState<IssueOption[]>([]);
  const [mode, setMode] = useState<string | null>(null);
  const [city, setCity] = useState<CityOption | null>(null);
  const [center, setCenter] = useState<CenterOption | null>(null);
  const [languages, setLanguages] = useState<LangOption[]>([]);
  const [showAllIssues, setShowAllIssues] = useState(false);
  const [showMoreLanguages, setShowMoreLanguages] = useState(false);
  const [issueSearch, setIssueSearch] = useState("");

  const consultationTypeId = mode === "online" ? 2 : 1;

  const centersForCity = useMemo(() => (city ? (CENTERS_BY_CITY[city.id] ?? []) : []), [city]);

  const issuesToShow = useMemo(() => {
    const list = showAllIssues ? ALL_ISSUES : TOP_ISSUES;
    const q = issueSearch.trim().toLowerCase();
    return q ? list.filter((i) => i.name.toLowerCase().includes(q)) : list;
  }, [showAllIssues, issueSearch]);

  const languageList = useMemo(
    () => (showMoreLanguages ? [...LANGUAGES_TOP, ...LANGUAGES_MORE] : LANGUAGES_TOP),
    [showMoreLanguages],
  );

  const canNext: Record<number, boolean> = {
    [STEP_PROFESSION]: profession !== null,
    [STEP_ISSUES]: true,
    [STEP_MODE]: mode !== null,
    [STEP_LOCATION]: mode !== "in-person" || (city !== null && center !== null),
    [STEP_LANGUAGE]: true,
  };

  const toggleIssue = useCallback((issue: IssueOption) => {
    setIssues((prev) =>
      prev.some((i) => i.id === issue.id)
        ? prev.filter((i) => i.id !== issue.id)
        : [...prev, issue],
    );
  }, []);

  const clearIssues = useCallback(() => setIssues([]), []);

  const toggleLang = useCallback((lang: LangOption) => {
    setLanguages((prev) =>
      prev.some((l) => l.id === lang.id) ? prev.filter((l) => l.id !== lang.id) : [...prev, lang],
    );
  }, []);

  const clearLanguages = useCallback(() => setLanguages([]), []);

  const handleNext = useCallback(() => {
    if (step === STEP_PROFESSION && canNext[STEP_PROFESSION]) setStep(STEP_ISSUES);
    else if (step === STEP_ISSUES) setStep(STEP_MODE);
    else if (step === STEP_MODE && canNext[STEP_MODE]) {
      setStep(mode === "in-person" ? STEP_LOCATION : STEP_LANGUAGE);
    } else if (step === STEP_LOCATION && canNext[STEP_LOCATION]) setStep(STEP_LANGUAGE);
    else if (step === STEP_LANGUAGE) {
      setView("list");
      setStep(STEP_PROFESSION);
    }
  }, [step, canNext, mode]);

  const handleBack = useCallback(() => {
    if (step === STEP_LANGUAGE) setStep(mode === "in-person" ? STEP_LOCATION : STEP_MODE);
    else if (step === STEP_LOCATION) setStep(STEP_MODE);
    else if (step === STEP_MODE) setStep(STEP_ISSUES);
    else if (step === STEP_ISSUES) setStep(STEP_PROFESSION);
    else if (step === STEP_PROFESSION) {
      setView("list");
    }
  }, [step, mode]);

  const startWizard = useCallback(() => {
    setStep(STEP_PROFESSION);
    setView("wizard");
  }, []);

  const clearFilters = useCallback(() => {
    setProfession(null);
    setIssues([]);
    setMode(null);
    setCity(null);
    setCenter(null);
    setLanguages([]);
  }, []);

  const handleBook = useCallback(
    (doctor: Doctor) => {
      const params = new URLSearchParams();
      params.set("mode", mode ?? "online");
      if (center?.campus_id) params.set("campus_id", String(center.campus_id));
      if (center?.sub_campus_id) params.set("sub_campus_id", String(center.sub_campus_id));
      router.push(`/consult/booking/${doctor.id}?${params.toString()}`);
    },
    [router, mode, center],
  );

  return (
    <FindTherapistContext.Provider
      value={{
        view,
        setView,
        step,
        profession,
        setProfession,
        issues,
        toggleIssue,
        clearIssues,
        mode,
        setMode,
        city,
        setCity,
        center,
        setCenter,
        languages,
        toggleLang,
        clearLanguages,
        showAllIssues,
        setShowAllIssues,
        showMoreLanguages,
        setShowMoreLanguages,
        issueSearch,
        setIssueSearch,
        consultationTypeId,
        centersForCity,
        issuesToShow,
        languageList,
        canNext,
        handleNext,
        handleBack,
        clearFilters,
        handleBook,
        startWizard,
      }}
    >
      {children}
    </FindTherapistContext.Provider>
  );
}
