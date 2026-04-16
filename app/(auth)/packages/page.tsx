'use client';

import { useState, useMemo, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Package,
  IndianRupee,
  ArrowRight,
  PlayCircle,
  CheckCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { BackButton } from '@/components/shared/navigation/back-button';
import { FeaturedPackageCard } from '@/components/package/featured-package-card';
import { PackageDiscoveryCard } from '@/components/package/package-discovery-card';
import { useAvailablePackages, useManagedPackages } from '@/hooks/use-packages';
import { getPackagePalette } from '@/lib/package-colors';
import { cn } from '@/lib/utils';
import type { BookedPackageDto } from '@/sdk/backend-v2';

// Per-stage visual config
const STAGE_CONFIG: Record<string, { label: string; Icon: React.ElementType; cardGradient: string; badgeCn: string }> = {
  in_progress: {
    label: 'Active',
    Icon: PlayCircle,
    cardGradient: 'from-emerald-500 to-teal-600',
    badgeCn: 'bg-white/20 text-white border-0',
  },
  confirm: {
    label: 'Confirmed',
    Icon: CheckCircle,
    cardGradient: 'from-violet-600 to-indigo-700',
    badgeCn: 'bg-white/20 text-white border-0',
  },
  booked: {
    label: 'Pay Now',
    Icon: Clock,
    cardGradient: 'from-orange-500 to-amber-500',
    badgeCn: 'bg-white text-orange-600 border-0 font-bold',
  },
  done: {
    label: 'Completed',
    Icon: CheckCircle2,
    cardGradient: 'from-slate-400 to-slate-500',
    badgeCn: 'bg-white/20 text-white border-0',
  },
};

function fallbackConfig(stage: string) {
  return STAGE_CONFIG[stage] ?? {
    label: stage,
    Icon: Package,
    cardGradient: 'from-sky-500 to-blue-600',
    badgeCn: 'bg-white/20 text-white border-0',
  };
}

function PurchasedPackageCard({ pkg }: { pkg: BookedPackageDto }) {
  const router = useRouter();
  const packageName = String((pkg.package_id as unknown[])?.[1] ?? 'Package');
  const initials = packageName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();

  const { label, Icon, cardGradient, badgeCn } = fallbackConfig(pkg.package_stage);

  return (
    <Card
      className="flex-shrink-0 w-56 cursor-pointer active:scale-[0.97] transition-transform border-0 overflow-hidden shadow-md"
      onClick={() => router.push(`/packages/${pkg.booked_package_id}`)}
    >
      <CardContent className="p-0">
        <div className={cn('bg-gradient-to-br p-4 relative overflow-hidden', cardGradient)}>
          <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
          {/* Top row: initials + stage badge */}
          <div className="flex items-start justify-between gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold text-xs text-white shrink-0">
              {initials}
            </div>
            <Badge className={cn('text-[10px] gap-1 shrink-0', badgeCn)}>
              <Icon className="w-3 h-3" />
              {label}
            </Badge>
          </div>
          {/* Package name */}
          <p className="text-white font-semibold text-sm leading-snug line-clamp-2 mt-3">
            {packageName}
          </p>
        </div>
        {/* Footer */}
        <div className="px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-0.5 text-sm font-bold text-foreground">
            <IndianRupee className="w-3.5 h-3.5" />
            {pkg.package_cost.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>{pkg.package_stage === 'booked' ? 'Pay now' : 'Details'}</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Sort order: booked (urgent) → in_progress → confirm → done
const STAGE_ORDER: Record<string, number> = { booked: 0, in_progress: 1, confirm: 2, done: 3 };

function PackagesInner() {
  const [search, setSearch] = useState('');
  const { packages: available, isLoading: loadingAvailable } = useAvailablePackages();
  const { packages: managed, isLoading: loadingManaged } = useManagedPackages();

  const isLoading = loadingAvailable || loadingManaged;

  const sortedManaged = useMemo(
    () =>
      [...managed].sort(
        (a, b) =>
          (STAGE_ORDER[a.package_stage] ?? 99) - (STAGE_ORDER[b.package_stage] ?? 99)
      ),
    [managed]
  );

  const filtered = useMemo(
    () =>
      available.filter(
        (p) => !search || p.package_name.toLowerCase().includes(search.toLowerCase())
      ),
    [available, search]
  );

  const featuredPackage = filtered[0] ?? null;
  const quickPicks = filtered.slice(1, 11);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-5 pb-3">
        <BackButton fallback="/" />
        <h1 className="flex-1 text-lg font-bold text-foreground">Explore Packages</h1>
      </div>

      {/* Search */}
      <div className="px-4 mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search packages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>
      </div>

      <div className="px-4">
        {/* My Packages — all purchased packages sorted by urgency */}
        {(isLoading || sortedManaged.length > 0) && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-foreground">My Packages</h2>
              {!isLoading && sortedManaged.length > 0 && (
                <span className="text-xs text-muted-foreground">{sortedManaged.length} purchased</span>
              )}
            </div>
            {isLoading ? (
              <div className="flex gap-3 overflow-hidden">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-32 w-56 rounded-2xl flex-shrink-0" />
                ))}
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
                {sortedManaged.map((pkg, i) => (
                  <PurchasedPackageCard key={pkg.booked_package_id ?? i} pkg={pkg} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Featured Package */}
        <section className="mb-6">
          <h2 className="text-base font-bold text-foreground mb-3">Featured Package</h2>
          {isLoading ? (
            <Skeleton className="w-full h-[220px] rounded-2xl" />
          ) : featuredPackage ? (
            <FeaturedPackageCard pkg={featuredPackage} />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <Package className="w-12 h-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No packages available right now.</p>
            </div>
          )}
        </section>

        {/* Quick Picks */}
        {(isLoading || quickPicks.length > 0) && (
          <section>
            <h2 className="text-base font-bold text-foreground mb-3">
              {search ? 'Results' : 'Quick Picks'}
            </h2>
            {isLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-[160px] w-full rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {quickPicks.map((pkg, i) => (
                  <PackageDiscoveryCard key={pkg.id ?? i} pkg={pkg} />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

export default function PackagesPage() {
  return (
    <Suspense fallback={null}>
      <PackagesInner />
    </Suspense>
  );
}
