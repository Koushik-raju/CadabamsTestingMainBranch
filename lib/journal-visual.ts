/**
 * FILE: lib/journal-visual.ts
 *
 * PURPOSE:
 *   Derives a deterministic gradient + icon for a journaling category or
 *   sub-journal based on its title. Ensures every journal tile looks visually
 *   distinct without requiring manual configuration.
 *
 * LOGIC OVERVIEW:
 *   1. hashStr() converts a title string to a stable unsigned integer.
 *   2. getJournalGradient() picks one of 8 gradient pairs using the hash modulo.
 *   3. getJournalIcon() does keyword matching on the lowercased title and
 *      returns the most semantically relevant Lucide icon React component.
 *   4. getJournalVisual() bundles both into a single call.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   JournalVisual         — { gradient: string; Icon: React.ElementType }
 *   getJournalVisual(t)   — main export, takes a title string
 *
 * DEPENDENCIES:
 *   lucide-react — icon components
 *
 * LAST UPDATED: 2026-04-17 — Initial creation for unique journal card visuals.
 */

import type { ElementType } from 'react';
import {
  Brain,
  Heart,
  Moon,
  Users,
  Target,
  Smile,
  Briefcase,
  Activity,
  Feather,
  Zap,
  CloudRain,
  TrendingUp,
  UserCircle,
  Palette,
  Star,
  Sun,
  Leaf,
  Wind,
  BookOpen,
  ShieldCheck,
  Flame,
  Sparkles,
  Eye,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Gradient palette — 8 visually distinct options
// ---------------------------------------------------------------------------

const GRADIENTS = [
  'from-violet-500 to-purple-700',
  'from-emerald-500 to-teal-600',
  'from-sky-500 to-blue-600',
  'from-orange-400 to-amber-600',
  'from-rose-500 to-pink-600',
  'from-indigo-500 to-violet-700',
  'from-cyan-500 to-sky-700',
  'from-lime-500 to-green-600',
] as const;

// ---------------------------------------------------------------------------
// Deterministic string hash
// ---------------------------------------------------------------------------

function hashStr(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// ---------------------------------------------------------------------------
// Icon selection by keyword
// ---------------------------------------------------------------------------

function getIconForTitle(title: string): ElementType {
  const t = title.toLowerCase();

  if (/anxiet|stress|worry|panic|overwhelm|tension/.test(t)) return Brain;
  if (/gratitude|thankful|appreciat|grateful|bless/.test(t)) return Heart;
  if (/sleep|rest|dream|night|insomni/.test(t)) return Moon;
  if (/relation|family|friend|social|partner|love|bond/.test(t)) return Users;
  if (/goal|achieve|success|accomplish|progress|milestone/.test(t)) return Target;
  if (/emotion|feeling|mood|express|affect/.test(t)) return Smile;
  if (/work|career|job|profession|burnout/.test(t)) return Briefcase;
  if (/health|body|fit|physic|energy|wellness/.test(t)) return Activity;
  if (/mindful|meditat|calm|peace|breath|relax/.test(t)) return Feather;
  if (/anger|frustrat|rage|annoy|irritat/.test(t)) return Zap;
  if (/grief|loss|sad|depress|mourn|cry/.test(t)) return CloudRain;
  if (/grow|change|transform|evolve|develop/.test(t)) return TrendingUp;
  if (/self|identit|who am|inner|persona/.test(t)) return UserCircle;
  if (/creat|art|express|imagin|inspir/.test(t)) return Palette;
  if (/joy|happy|celebrat|gratif|positiv/.test(t)) return Star;
  if (/morning|day|daily|routine|ritual/.test(t)) return Sun;
  if (/nature|outdoor|environ|earth|green/.test(t)) return Leaf;
  if (/mind|thought|mental|cogni|reflect/.test(t)) return Wind;
  if (/confiden|strength|courag|brave|empower/.test(t)) return ShieldCheck;
  if (/passion|motivat|drive|purpos|fire/.test(t)) return Flame;
  if (/hope|future|vision|dream|aspir/.test(t)) return Sparkles;
  if (/aware|observ|perspect|insight|clarity/.test(t)) return Eye;

  return BookOpen;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface JournalVisual {
  gradient: string;
  Icon: ElementType;
}

/**
 * Returns a stable gradient + icon pair for the given journal title.
 * The same title always produces the same output.
 */
export function getJournalVisual(title: string): JournalVisual {
  const gradient = GRADIENTS[hashStr(title) % GRADIENTS.length];
  const Icon = getIconForTitle(title);
  return { gradient, Icon };
}
