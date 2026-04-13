// Deterministic color palette for packages — same id always yields same palette.
// Used on listing cards AND the detail page hero.

export interface PackagePalette {
  gradient: string;       // Tailwind gradient classes for bg-gradient-to-br
  decorBg: string;        // Decorative circle colour
  badgeBg: string;        // Semi-transparent badge background
  iconBg: string;         // Icon / initials circle background
  ctaGradient: string;    // Gradient for the sticky CTA button
}

const PALETTES: PackagePalette[] = [
  {
    gradient:    'from-violet-600 via-purple-600 to-indigo-700',
    decorBg:     'bg-white/10',
    badgeBg:     'bg-white/20',
    iconBg:      'bg-white/20',
    ctaGradient: 'from-violet-600 to-indigo-600',
  },
  {
    gradient:    'from-sky-500 to-blue-600',
    decorBg:     'bg-white/10',
    badgeBg:     'bg-white/20',
    iconBg:      'bg-white/20',
    ctaGradient: 'from-sky-500 to-blue-600',
  },
  {
    gradient:    'from-emerald-500 to-teal-600',
    decorBg:     'bg-white/10',
    badgeBg:     'bg-white/20',
    iconBg:      'bg-white/20',
    ctaGradient: 'from-emerald-500 to-teal-600',
  },
  {
    gradient:    'from-orange-500 to-amber-600',
    decorBg:     'bg-white/10',
    badgeBg:     'bg-white/20',
    iconBg:      'bg-white/20',
    ctaGradient: 'from-orange-500 to-amber-500',
  },
  {
    gradient:    'from-rose-500 to-pink-600',
    decorBg:     'bg-white/10',
    badgeBg:     'bg-white/20',
    iconBg:      'bg-white/20',
    ctaGradient: 'from-rose-500 to-pink-600',
  },
  {
    gradient:    'from-indigo-500 to-blue-700',
    decorBg:     'bg-white/10',
    badgeBg:     'bg-white/20',
    iconBg:      'bg-white/20',
    ctaGradient: 'from-indigo-500 to-blue-700',
  },
];

export function getPackagePalette(id: number | string): PackagePalette {
  const index = Math.abs(Number(id)) % PALETTES.length;
  return PALETTES[index];
}
