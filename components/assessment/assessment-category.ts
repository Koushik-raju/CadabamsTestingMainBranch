"use client";

import { type TintKey } from "@/components/shared/glyph-tile";
import type { AssessmentItem } from "@/hooks/use-assessments";
import {
  Activity,
  AlertTriangle,
  Baby,
  BarChart3,
  BookOpen,
  Brain,
  BrainCircuit,
  CalendarHeart,
  ClipboardList,
  Cloud,
  Dna,
  Eye,
  Flame,
  Gamepad2,
  Handshake,
  Heart,
  HeartHandshake,
  Leaf,
  Microscope,
  Moon,
  Pill,
  Puzzle,
  Repeat2,
  Scale,
  ShieldAlert,
  Smile,
  Sparkles,
  Stethoscope,
  Sun,
  Target,
  User,
  Users2,
  Wine,
  Zap,
} from "lucide-react";

type CategoryInfo = {
  icon: React.ElementType;
  tint: TintKey;
  /* retained for any legacy callers */
  bgColor: string;
  textColor: string;
};

// Keys must match ASSESSMENT_CATEGORIES exactly (case-sensitive)
const categoryMap: Record<string, CategoryInfo> = {
  // ── Mood & Emotional ──────────────────────────────────────────────────────
  depression: { icon: Heart, tint: "blue", bgColor: "bg-blue-50", textColor: "text-blue-600" },
  anxiety: { icon: Cloud, tint: "blue", bgColor: "bg-sky-50", textColor: "text-sky-600" },
  stress: { icon: Flame, tint: "peach", bgColor: "bg-amber-50", textColor: "text-amber-600" },
  "mood-disorder": {
    icon: Smile,
    tint: "orange",
    bgColor: "bg-yellow-50",
    textColor: "text-yellow-600",
  },
  "bipolar-disorder": {
    icon: Zap,
    tint: "orange",
    bgColor: "bg-orange-50",
    textColor: "text-orange-600",
  },
  ptsd: { icon: ShieldAlert, tint: "pink", bgColor: "bg-red-50", textColor: "text-red-600" },
  trauma: { icon: AlertTriangle, tint: "pink", bgColor: "bg-rose-50", textColor: "text-rose-600" },

  // ── Sleep & Wellbeing ─────────────────────────────────────────────────────
  sleep: { icon: Moon, tint: "purple", bgColor: "bg-indigo-50", textColor: "text-indigo-600" },
  "self-love": { icon: Sparkles, tint: "pink", bgColor: "bg-pink-50", textColor: "text-pink-600" },
  love: { icon: Heart, tint: "pink", bgColor: "bg-rose-50", textColor: "text-rose-600" },
  "Self-Care Planning": {
    icon: CalendarHeart,
    tint: "green",
    bgColor: "bg-teal-50",
    textColor: "text-teal-600",
  },

  // ── Relationships & Social ────────────────────────────────────────────────
  "relationship-issues": {
    icon: HeartHandshake,
    tint: "pink",
    bgColor: "bg-rose-50",
    textColor: "text-rose-600",
  },
  "family-issues": {
    icon: Users2,
    tint: "peach",
    bgColor: "bg-amber-50",
    textColor: "text-amber-600",
  },
  "Relationship Beliefs": {
    icon: Handshake,
    tint: "purple",
    bgColor: "bg-violet-50",
    textColor: "text-violet-600",
  },

  // ── Personality & Identity ────────────────────────────────────────────────
  "personality-disorder": {
    icon: User,
    tint: "purple",
    bgColor: "bg-purple-50",
    textColor: "text-purple-600",
  },
  "gender-identity-disorder": {
    icon: Users2,
    tint: "pink",
    bgColor: "bg-pink-50",
    textColor: "text-pink-600",
  },
  ocd: { icon: Repeat2, tint: "peach", bgColor: "bg-cyan-50", textColor: "text-cyan-600" },
  "Rewiring Patterns": {
    icon: Repeat2,
    tint: "green",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-600",
  },

  // ── Neurodevelopmental ────────────────────────────────────────────────────
  adhd: { icon: Target, tint: "orange", bgColor: "bg-orange-50", textColor: "text-orange-600" },
  autism: { icon: Puzzle, tint: "purple", bgColor: "bg-violet-50", textColor: "text-violet-600" },
  "learning-disability": {
    icon: BookOpen,
    tint: "green",
    bgColor: "bg-green-50",
    textColor: "text-green-600",
  },
  "intellectual-disability": {
    icon: BrainCircuit,
    tint: "blue",
    bgColor: "bg-yellow-50",
    textColor: "text-yellow-600",
  },
  "developmental-delay": {
    icon: Baby,
    tint: "blue",
    bgColor: "bg-blue-50",
    textColor: "text-blue-600",
  },
  "cerebral-palsy": {
    icon: Activity,
    tint: "green",
    bgColor: "bg-teal-50",
    textColor: "text-teal-600",
  },

  // ── Psychotic & Cognitive ─────────────────────────────────────────────────
  schizophrenia: {
    icon: Brain,
    tint: "purple",
    bgColor: "bg-purple-50",
    textColor: "text-purple-600",
  },
  psychosis: { icon: Eye, tint: "purple", bgColor: "bg-violet-50", textColor: "text-violet-600" },
  dementia: { icon: Brain, tint: "blue", bgColor: "bg-indigo-50", textColor: "text-indigo-600" },
  alzheimers: { icon: Brain, tint: "blue", bgColor: "bg-blue-50", textColor: "text-blue-600" },
  "dual-diagnosis": {
    icon: ClipboardList,
    tint: "green",
    bgColor: "bg-teal-50",
    textColor: "text-teal-600",
  },

  // ── Addiction ─────────────────────────────────────────────────────────────
  Addiction: {
    icon: AlertTriangle,
    tint: "peach",
    bgColor: "bg-red-50",
    textColor: "text-red-600",
  },
  addiction: {
    icon: AlertTriangle,
    tint: "peach",
    bgColor: "bg-red-50",
    textColor: "text-red-600",
  },
  "drug-addiction": { icon: Pill, tint: "peach", bgColor: "bg-red-50", textColor: "text-red-600" },
  "alcohol-addiction": {
    icon: Wine,
    tint: "orange",
    bgColor: "bg-amber-50",
    textColor: "text-amber-600",
  },
  "Gaming Disorder": {
    icon: Gamepad2,
    tint: "purple",
    bgColor: "bg-indigo-50",
    textColor: "text-indigo-600",
  },

  // ── Eating & Body ─────────────────────────────────────────────────────────
  "eating-disorder": {
    icon: Scale,
    tint: "green",
    bgColor: "bg-green-50",
    textColor: "text-green-600",
  },

  // ── Clinical & Specialist ─────────────────────────────────────────────────
  "perinatal-mental-health": {
    icon: Leaf,
    tint: "green",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-600",
  },
  "conduct-disorder": {
    icon: AlertTriangle,
    tint: "orange",
    bgColor: "bg-orange-50",
    textColor: "text-orange-600",
  },

  // ── General ───────────────────────────────────────────────────────────────
  general: { icon: BarChart3, tint: "blue", bgColor: "bg-slate-100", textColor: "text-slate-600" },
  Healthcare: {
    icon: Stethoscope,
    tint: "green",
    bgColor: "bg-teal-50",
    textColor: "text-teal-600",
  },
  Medical: { icon: Microscope, tint: "pink", bgColor: "bg-rose-50", textColor: "text-rose-600" },
  AI: { icon: BrainCircuit, tint: "purple", bgColor: "bg-violet-50", textColor: "text-violet-600" },
  Dna: { icon: Dna, tint: "green", bgColor: "bg-green-50", textColor: "text-green-600" },
  Sun: { icon: Sun, tint: "orange", bgColor: "bg-yellow-50", textColor: "text-yellow-600" },
};

export const ASSESSMENT_CATEGORIES = [
  "All",
  "Addiction",
  "relationship-issues",
  "stress",
  "self-love",
  "love",
  "mood-disorder",
  "depression",
  "sleep",
  "anxiety",
  "Gaming Disorder",
  "trauma",
  "bipolar-disorder",
  "ptsd",
  "ocd",
  "personality-disorder",
  "dementia",
  "drug-addiction",
  "alcohol-addiction",
  "learning-disability",
  "eating-disorder",
  "gender-identity-disorder",
  "psychosis",
  "perinatal-mental-health",
  "family-issues",
  "adhd",
  "autism",
  "schizophrenia",
  "alzheimers",
  "addiction",
  "cerebral-palsy",
  "conduct-disorder",
  "intellectual-disability",
  "developmental-delay",
  "dual-diagnosis",
  "general",
  "Relationship Beliefs",
  "Rewiring Patterns",
  "Self-Care Planning",
];

export { categoryMap };

// These are matched with highest priority — most clinically specific / distinctive
const PRIORITY_CATEGORY_ORDER = [
  "depression",
  "anxiety",
  "stress",
  "sleep",
  "ocd",
  "adhd",
  "ptsd",
  "trauma",
  "bipolar-disorder",
  "addiction",
  "drug-addiction",
  "alcohol-addiction",
  "eating-disorder",
  "schizophrenia",
  "psychosis",
  "dementia",
  "alzheimers",
  "autism",
  "self-love",
  "love",
];

export function getCategoryInfo(assessment: AssessmentItem): CategoryInfo {
  const DEFAULT: CategoryInfo = {
    icon: BarChart3,
    tint: "blue",
    bgColor: "bg-slate-100",
    textColor: "text-slate-500",
  };
  const cats = assessment.category ?? [];

  // 1. Priority match — prefer specific clinical/semantic categories over generic ones
  for (const priority of PRIORITY_CATEGORY_ORDER) {
    if (cats.some((c) => c === priority || c.toLowerCase() === priority)) {
      return categoryMap[priority] ?? DEFAULT;
    }
  }

  // 2. Exact match on remaining categories
  for (const cat of cats) {
    if (categoryMap[cat]) return categoryMap[cat];
  }

  // 3. Case-insensitive match on remaining categories
  for (const cat of cats) {
    const lower = cat.toLowerCase();
    const key = Object.keys(categoryMap).find((k) => k.toLowerCase() === lower);
    if (key) return categoryMap[key];
  }

  // 4. Title keyword fallback — catches mislabelled or uncategorised assessments
  const title = (assessment.title ?? "").toLowerCase();
  if (title.includes("anxiety") || title.includes("gad") || title.includes("worry"))
    return categoryMap["anxiety"];
  if (title.includes("depress") || title.includes("phq") || title.includes("mood"))
    return categoryMap["depression"];
  if (title.includes("sleep") || title.includes("insomnia") || title.includes("night"))
    return categoryMap["sleep"];
  if (title.includes("stress") || title.includes("burnout") || title.includes("overwhelm"))
    return categoryMap["stress"];
  if (title.includes("trauma") || title.includes("ptsd") || title.includes("trigger"))
    return categoryMap["ptsd"];
  if (title.includes("bipolar") || title.includes("mania")) return categoryMap["bipolar-disorder"];
  if (
    title.includes("adhd") ||
    title.includes("attention") ||
    title.includes("focus") ||
    title.includes("habit")
  )
    return categoryMap["adhd"];
  if (title.includes("ocd") || title.includes("compuls") || title.includes("obsess"))
    return categoryMap["ocd"];
  if (title.includes("addiction") || title.includes("substance") || title.includes("crav"))
    return categoryMap["addiction"];
  if (title.includes("eating") || title.includes("binge") || title.includes("body image"))
    return categoryMap["eating-disorder"];
  if (title.includes("relation") || title.includes("partner") || title.includes("love"))
    return categoryMap["relationship-issues"];
  if (title.includes("family") || title.includes("parent") || title.includes("child"))
    return categoryMap["family-issues"];
  if (
    title.includes("self") ||
    title.includes("kindness") ||
    title.includes("compassion") ||
    title.includes("worth")
  )
    return categoryMap["self-love"];
  if (
    title.includes("resilience") ||
    title.includes("strength") ||
    title.includes("growth") ||
    title.includes("thrive")
  )
    return categoryMap["self-love"];
  if (
    title.includes("mindful") ||
    title.includes("meditat") ||
    title.includes("breath") ||
    title.includes("calm")
  )
    return categoryMap["sleep"];
  if (title.includes("brain") || title.includes("cogni") || title.includes("memory"))
    return categoryMap["dementia"];
  if (title.includes("gaming") || title.includes("screen") || title.includes("digital"))
    return categoryMap["Gaming Disorder"];
  if (title.includes("gratitude") || title.includes("journal") || title.includes("reflect"))
    return categoryMap["Self-Care Planning"];

  // 5. ID-based deterministic fallback — ensures visual variety even for uncategorised items
  const FALLBACK_PALETTE: CategoryInfo[] = [
    {
      icon: categoryMap["depression"].icon,
      tint: "blue",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      icon: categoryMap["anxiety"].icon,
      tint: "blue",
      bgColor: "bg-sky-50",
      textColor: "text-sky-600",
    },
    {
      icon: categoryMap["stress"].icon,
      tint: "peach",
      bgColor: "bg-amber-50",
      textColor: "text-amber-600",
    },
    {
      icon: categoryMap["sleep"].icon,
      tint: "purple",
      bgColor: "bg-indigo-50",
      textColor: "text-indigo-600",
    },
    {
      icon: categoryMap["self-love"].icon,
      tint: "pink",
      bgColor: "bg-pink-50",
      textColor: "text-pink-600",
    },
    {
      icon: categoryMap["adhd"].icon,
      tint: "orange",
      bgColor: "bg-orange-50",
      textColor: "text-orange-600",
    },
    {
      icon: categoryMap["ocd"].icon,
      tint: "peach",
      bgColor: "bg-cyan-50",
      textColor: "text-cyan-600",
    },
    {
      icon: categoryMap["Self-Care Planning"].icon,
      tint: "green",
      bgColor: "bg-teal-50",
      textColor: "text-teal-600",
    },
    {
      icon: categoryMap["Rewiring Patterns"].icon,
      tint: "green",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-600",
    },
    {
      icon: categoryMap["personality-disorder"].icon,
      tint: "purple",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
    },
  ];
  const id = assessment.id ?? assessment.title ?? "";
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) & 0xffff;
  return FALLBACK_PALETTE[hash % FALLBACK_PALETTE.length];
}
