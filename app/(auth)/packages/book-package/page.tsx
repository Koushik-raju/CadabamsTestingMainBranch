'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/shared/navigation/back-button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PackageOpen,
  Clock,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { getPackages } from '@/sdk/auth-and-crm';
import type { AvailablePackage } from '@/types/package';


function getDisplayDuration(pkg: AvailablePackage): number {
  const duration = pkg.duration ?? pkg.package_duration;
  if (duration === 90) return 90;
  const name = (pkg.package_name ?? '').toLowerCase();
  if (/90[\s-]?day|^90\s/.test(name)) return 90;
  return duration ?? 30;
}

function storeSelectedPackage(pkg: AvailablePackage) {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem('selected_package', JSON.stringify(pkg));
  }
}

function PackageCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3.5 w-1/2" />
        </div>
        <Skeleton className="h-7 w-20 rounded-full shrink-0" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>
    </div>
  );
}

function BookPackageContent() {
  const router = useRouter();

  const [packages, setPackages] = useState<AvailablePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPackages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const pkgRes = await getPackages();
      const list = (pkgRes.data ?? []) as unknown as AvailablePackage[];
      setPackages(list);
    } catch {
      setError('Failed to load packages. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPackages();
  }, [loadPackages]);

  const handlePackageClick = (pkg: AvailablePackage) => {
    storeSelectedPackage(pkg);
    router.push(`/packages/browse/${pkg.id}`);
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <BackButton fallback="/packages" />
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground tracking-tight">
              Browse Packages
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Comprehensive care plans tailored for you
            </p>
          </div>
          {!loading && (
            <Badge variant="secondary" className="text-xs">
              {packages.length} plans
            </Badge>
          )}
        </div>
      </div>

      {/* Package list */}
      <div className="px-4 pt-4 space-y-3">
        {loading && [0, 1, 2, 3].map((i) => <PackageCardSkeleton key={i} />)}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <PackageOpen className="w-12 h-12 text-muted-foreground/30" />
            <div>
              <p className="font-semibold text-sm text-foreground">
                Something went wrong
              </p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => loadPackages()}>
              Try again
            </Button>
          </div>
        )}

        {!loading && !error && packages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <PackageOpen className="w-12 h-12 text-muted-foreground/30" />
            <div>
              <p className="font-semibold text-sm text-foreground">
                No packages found
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                No packages are available right now.
              </p>
            </div>
          </div>
        )}

        {!loading &&
          !error &&
          packages.map((pkg) => {
            const duration = getDisplayDuration(pkg);
            const count = pkg.package_product_ids?.length ?? 0;

            return (
              <button
                key={pkg.id}
                type="button"
                onClick={() => handlePackageClick(pkg)}
                className="w-full text-left bg-card rounded-2xl border border-border p-4 active:scale-[0.98] transition-transform hover:border-primary/30 hover:shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Name + price */}
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-sm text-foreground leading-snug line-clamp-2 flex-1">
                        {pkg.package_name}
                      </p>
                      <span className="text-base font-bold text-primary shrink-0 leading-none mt-0.5">
                        ₹{pkg.amount_total.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Meta pills */}
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="gap-1 text-xs font-normal h-5 px-2">
                        <Clock className="w-3 h-3" />
                        {duration}d
                      </Badge>
                      <Badge variant="outline" className="gap-1 text-xs font-normal h-5 px-2">
                        <Layers className="w-3 h-3" />
                        {count} {count === 1 ? 'service' : 'services'}
                      </Badge>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                </div>
              </button>
            );
          })}
      </div>

    </div>
  );
}

export default function BookPackagePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <BookPackageContent />
    </Suspense>
  );
}
