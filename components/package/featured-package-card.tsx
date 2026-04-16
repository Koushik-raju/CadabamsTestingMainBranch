'use client';

import { useRouter } from 'next/navigation';
import { Clock, Layers, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getPackagePalette } from '@/lib/package-colors';
import type { PackageResponseDto } from '@/sdk/backend-v2';

interface FeaturedPackageCardProps {
  pkg: PackageResponseDto;
}

export function FeaturedPackageCard({ pkg }: FeaturedPackageCardProps) {
  const router = useRouter();
  const duration = pkg.duration_days ?? 30;
  const palette = getPackagePalette(pkg.id);

  return (
    <Card
      className="relative w-full overflow-hidden cursor-pointer active:scale-[0.98] transition-all border-0 shadow-lg"
      style={{ minHeight: 230 }}
      onClick={() => router.push(`/packages/browse/${pkg.id}`)}
    >
      <div className={cn('absolute inset-0 bg-gradient-to-br', palette.gradient)} />
      {/* Decorative circles */}
      <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10" />
      <div className="absolute -bottom-12 -left-6 w-52 h-52 rounded-full bg-white/5" />
      <div className="absolute top-1/2 right-1/4 w-20 h-20 rounded-full bg-white/5" />

      {/* Top bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
        <Badge className={cn('text-white text-[10px] font-bold border-0 gap-1', palette.badgeBg, 'hover:opacity-100')}>
          <Sparkles className="w-3 h-3" />
          Featured
        </Badge>
        <ArrowRight className="w-4 h-4 text-white/60" />
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Badge className={cn('flex items-center gap-1 text-white text-[10px] font-semibold border-0', palette.badgeBg)}>
            <Clock className="w-3 h-3" />
            {duration} Days
          </Badge>
          <Badge className={cn('flex items-center gap-1 text-white text-[10px] font-semibold border-0', palette.badgeBg)}>
            <Layers className="w-3 h-3" />
            {pkg.active ? 'Active' : 'Available'}
          </Badge>
        </div>

        <h2 className="text-white font-bold text-xl leading-tight line-clamp-2 mb-1">
          {pkg.name}
        </h2>
        <p className="text-white/70 text-sm mb-4">
          ₹{(pkg.price ?? 0).toLocaleString('en-IN')} · Complete care package
        </p>

        <Button
          size="sm"
          className="bg-white hover:bg-white/90 font-bold text-xs rounded-full px-5 shadow-md border-0"
          style={{ color: 'var(--primary)' }}
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/packages/browse/${pkg.id}`);
          }}
        >
          Book Now →
        </Button>
      </div>
    </Card>
  );
}
