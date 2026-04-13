'use client';

import {
  BarChart3,
  Cloud,
  Heart,
  Moon,
  Sparkles,
  Users,
  Brain,
  Stethoscope,
  Activity,
  AlertTriangle,
  Pill,
  Wine,
  BookOpen,
  Scale,
  Baby,
  BrainCircuit,
  Lightbulb,
  HeartHandshake,
  Flower2,
  Sun,
  Wind,
  Smile,
  User,
  Users2,
  Eye,
  Zap,
  Puzzle,
  Target,
  FileText,
  ClipboardList,
  TrendingUp,
} from 'lucide-react';
import type { AssessmentItem } from '@/hooks/use-assessments';

type CategoryInfo = {
  icon: React.ElementType;
  bgColor: string;
  textColor: string;
};

const categoryMap: Record<string, CategoryInfo> = {
  Healthcare: { icon: Stethoscope, bgColor: 'bg-teal-50', textColor: 'text-teal-600' },
  AI: { icon: BrainCircuit, bgColor: 'bg-violet-50', textColor: 'text-violet-600' },
  Medical: { icon: Activity, bgColor: 'bg-rose-50', textColor: 'text-rose-600' },
  General: { icon: BarChart3, bgColor: 'bg-slate-100', textColor: 'text-slate-600' },
  Schizophrenia: { icon: Brain, bgColor: 'bg-purple-50', textColor: 'text-purple-600' },
  'Bipolar-Disorder': { icon: Zap, bgColor: 'bg-amber-50', textColor: 'text-amber-600' },
  OCR: { icon: FileText, bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
  Dementia: { icon: Brain, bgColor: 'bg-indigo-50', textColor: 'text-indigo-600' },
  Alzheimers: { icon: Brain, bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
  ADHD: { icon: Target, bgColor: 'bg-orange-50', textColor: 'text-orange-600' },
  Autism: { icon: Puzzle, bgColor: 'bg-pink-50', textColor: 'text-pink-600' },
  'Relationship-Issues': { icon: HeartHandshake, bgColor: 'bg-rose-50', textColor: 'text-rose-600' },
  Stress: { icon: Sparkles, bgColor: 'bg-amber-50', textColor: 'text-amber-600' },
  Anxiety: { icon: Cloud, bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
  PTSD: { icon: AlertTriangle, bgColor: 'bg-red-50', textColor: 'text-red-600' },
  Trauma: { icon: Heart, bgColor: 'bg-red-50', textColor: 'text-red-600' },
  Sleep: { icon: Moon, bgColor: 'bg-indigo-50', textColor: 'text-indigo-600' },
  'Personality-Disorder': { icon: User, bgColor: 'bg-purple-50', textColor: 'text-purple-600' },
  Addiction: { icon: AlertTriangle, bgColor: 'bg-red-50', textColor: 'text-red-600' },
  'Drug-Addiction': { icon: Pill, bgColor: 'bg-red-50', textColor: 'text-red-600' },
  'Alcohol-Addiction': { icon: Wine, bgColor: 'bg-amber-50', textColor: 'text-amber-600' },
  'Learning-Disability': { icon: BookOpen, bgColor: 'bg-green-50', textColor: 'text-green-600' },
  Depression: { icon: Heart, bgColor: 'bg-green-50', textColor: 'text-green-600' },
  'Family-Issues': { icon: Users2, bgColor: 'bg-amber-50', textColor: 'text-amber-600' },
  'Cerebral-Palsy': { icon: Brain, bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
  'Conduct-Disorder': { icon: AlertTriangle, bgColor: 'bg-orange-50', textColor: 'text-orange-600' },
  'Eating-Disorder': { icon: Scale, bgColor: 'bg-green-50', textColor: 'text-green-600' },
  'Gender-Identity-Disorder': { icon: Users2, bgColor: 'bg-pink-50', textColor: 'text-pink-600' },
  'Intellectual-Disablity': { icon: Lightbulb, bgColor: 'bg-yellow-50', textColor: 'text-yellow-600' },
  'Mood-Disorder': { icon: Smile, bgColor: 'bg-yellow-50', textColor: 'text-yellow-600' },
  'Development-delay': { icon: Baby, bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
  Psychosis: { icon: Eye, bgColor: 'bg-violet-50', textColor: 'text-violet-600' },
  'Dual-Diagnosis': { icon: ClipboardList, bgColor: 'bg-teal-50', textColor: 'text-teal-600' },
  Parenting: { icon: Users2, bgColor: 'bg-amber-50', textColor: 'text-amber-600' },
  Mindfullness: { icon: Flower2, bgColor: 'bg-pink-50', textColor: 'text-pink-600' },
  Love: { icon: Heart, bgColor: 'bg-rose-50', textColor: 'text-rose-600' },
  'Self-Love': { icon: Heart, bgColor: 'bg-pink-50', textColor: 'text-pink-600' },
  'Self-Help': { icon: BookOpen, bgColor: 'bg-green-50', textColor: 'text-green-600' },
  Meditation: { icon: Sun, bgColor: 'bg-yellow-50', textColor: 'text-yellow-600' },
  Yoga: { icon: Wind, bgColor: 'bg-teal-50', textColor: 'text-teal-600' },
  'Personal-Growth': { icon: TrendingUp, bgColor: 'bg-emerald-50', textColor: 'text-emerald-600' },
};

export const ASSESSMENT_CATEGORIES = [
  'All',
  'Healthcare',
  'AI',
  'Medical',
  'General',
  'Schizophrenia',
  'Bipolar-Disorder',
  'OCR',
  'Dementia',
  'Alzheimers',
  'ADHD',
  'Autism',
  'Relationship-Issues',
  'Stress',
  'Anxiety',
  'PTSD',
  'Trauma',
  'Sleep',
  'Personality-Disorder',
  'Addiction',
  'Drug-Addiction',
  'Alcohol-Addiction',
  'Learning-Disability',
  'Depression',
  'Family-Issues',
  'Cerebral-Palsy',
  'Conduct-Disorder',
  'Eating-Disorder',
  'Gender-Identity-Disorder',
  'Intellectual-Disablity',
  'Mood-Disorder',
  'Development-delay',
  'Psychosis',
  'Dual-Diagnosis',
  'Parenting',
  'Mindfullness',
  'Love',
  'Self-Love',
  'Self-Help',
  'Meditation',
  'Yoga',
  'Personal-Growth',
];

export { categoryMap };

export function getCategoryInfo(assessment: AssessmentItem): CategoryInfo {
  const cats = assessment.category || [];
  for (const cat of cats) {
    const normalizedCat = cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
    const key = Object.keys(categoryMap).find(
      (k) => k.toLowerCase() === normalizedCat.toLowerCase()
    );
    if (key && categoryMap[key]) {
      return categoryMap[key];
    }
  }

  const title = assessment.title.toLowerCase();
  if (title.includes('anxiety') || title.includes('gad'))
    return { icon: Cloud, bgColor: 'bg-blue-50', textColor: 'text-blue-600' };
  if (title.includes('depression') || title.includes('phq'))
    return { icon: Heart, bgColor: 'bg-green-50', textColor: 'text-green-600' };
  if (title.includes('sleep'))
    return { icon: Moon, bgColor: 'bg-indigo-50', textColor: 'text-indigo-600' };
  if (title.includes('stress'))
    return { icon: Sparkles, bgColor: 'bg-amber-50', textColor: 'text-amber-600' };
  if (title.includes('relationship') || title.includes('social'))
    return { icon: Users, bgColor: 'bg-rose-50', textColor: 'text-rose-600' };
  if (title.includes('mood') || title.includes('emotion'))
    return { icon: BarChart3, bgColor: 'bg-purple-50', textColor: 'text-purple-600' };

  return { icon: BarChart3, bgColor: 'bg-gray-50', textColor: 'text-gray-600' };
}
