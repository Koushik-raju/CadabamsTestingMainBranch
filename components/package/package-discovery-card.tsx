'use client';

import { useRouter } from 'next/navigation';
import { Clock, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getPackagePalette } from '@/lib/package-colors';
import type { PackageResponseDto } from '@/sdk/backend-v2';

interface PackageDiscoveryCardProps {
  pkg: PackageResponseDto;
  className?: string;
}

export function PackageDiscoveryCard({ pkg, className }: PackageDiscoveryCardProps) {
  const router = useRouter();
  const palette = getPackagePalette(pkg.id);

  const initials = (pkg.package_name ?? '')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();

  return (
    <Card
      className={cn(
        'cursor-pointer hover:shadow-lg transition-all border-0 overflow-hidden pt-0 active:scale-[0.97]',
        className
      )}
      onClick={() => router.push(`/packages/browse/${pkg.id}`)}
    >
      {/* Coloured header */}
      <div className={cn('relative h-28 bg-gradient-to-br', palette.gradient)}>
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_80%_20%,white,transparent_55%)]" />
        {/* Initials circle */}
        <div className={cn('absolute top-3 left-3 w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white', palette.iconBg)}>
          {initials}
        </div>
        {/* Price badge */}
        <div className="absolute bottom-3 right-3">
          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm', palette.badgeBg, 'text-white')}>
            ₹{(pkg.amount_total ?? 0).toLocaleString('en-IN')}
          </span>
        </div>
        {/* Arrow */}
        <div className="absolute top-3 right-3">
          <ArrowRight className="w-4 h-4 text-white/60" />
        </div>
      </div>

      <CardContent className="p-2.5 pt-0 mt-2">
        <h4 className="font-bold text-xs text-foreground leading-snug line-clamp-2">
          {pkg.package_name}
        </h4>
        <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>30 Days</span>
        </div>
      </CardContent>
    </Card>
  );
}
