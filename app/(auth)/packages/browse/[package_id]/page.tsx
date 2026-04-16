'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BackButton } from '@/components/shared/navigation/back-button';
import {
  CheckCircle2,
  Clock,
  Layers,
  IndianRupee,
  AlertCircle,
  Package,
  ChevronRight,
} from 'lucide-react';
import { useAvailablePackages, usePackageProductLines } from '@/hooks/use-packages';
import { getPackagePalette } from '@/lib/package-colors';
import { cn } from '@/lib/utils';
import type { PackageResponseDto } from '@/sdk/backend-v2';

function storeSelectedPackage(pkg: PackageResponseDto) {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem('selected_package', JSON.stringify(pkg));
  }
}

function PackageDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex items-center gap-2 px-2 py-2 border-b border-border bg-background">
        <Skeleton className="h-9 w-9 rounded-full" />
      </div>
      <div className="flex-1 overflow-y-auto">
        <Skeleton className="h-52 w-full" />
        <div className="p-5 space-y-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-16 w-full rounded-2xl" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
          </div>
        </div>
      </div>
    </div>
  );
}

function PackageDetailContent({ packageId }: { packageId: string }) {
  const router = useRouter();
  const { packages, isLoading: pkgLoading } = useAvailablePackages();
  const { lines, isLoading: linesLoading } = usePackageProductLines();
  const [pkg, setPkg] = useState<PackageResponseDto | null>(null);

  useEffect(() => {
    if (!pkgLoading && packages.length > 0) {
      const found = packages.find((p) => String(p.id) === packageId);
      if (found) {
        setPkg(found);
      } else {
        if (typeof sessionStorage !== 'undefined') {
          const stored = sessionStorage.getItem('selected_package');
          if (stored) {
            try {
              const parsed = JSON.parse(stored) as PackageResponseDto;
              if (String(parsed.id) === packageId) setPkg(parsed);
            } catch {
              // ignore
            }
          }
        }
      }
    }
  }, [packages, pkgLoading, packageId]);

  const isLoading = pkgLoading || linesLoading;

  if (isLoading) return <PackageDetailSkeleton />;

  if (!pkg) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex items-center px-2 py-2 border-b border-border bg-background">
          <BackButton fallback="/packages" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <p className="text-destructive font-medium">Package not found.</p>
          <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  const handleProceed = () => {
    storeSelectedPackage(pkg);
    router.push(`/packages/book/${pkg.id}`);
  };

  const duration = 30;
  const palette = getPackagePalette(pkg.id);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex items-center px-2 py-2 border-b border-border bg-background">
        <BackButton fallback="/packages" />
      </div>

      <div className="flex-1 overflow-y-auto pb-32">
        {/* Hero banner */}
        <div className={cn('w-full h-52 bg-gradient-to-br relative overflow-hidden flex items-end', palette.gradient)}>
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_70%_20%,white,transparent_60%)]" />
          <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute top-4 left-5">
            <div className={cn('w-12 h-12 rounded-2xl backdrop-blur-sm flex items-center justify-center', palette.iconBg)}>
              <Package className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="relative p-5 w-full">
            <p className="text-white/70 text-sm font-semibold mb-1">
              ₹{(pkg.amount_total ?? 0).toLocaleString('en-IN')}
            </p>
            <h1 className="text-white font-bold text-xl leading-tight line-clamp-2">
              {pkg.package_name}
            </h1>
          </div>
        </div>

        <div className="px-5 pt-5 space-y-5">
          <div className="flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-primary" />
            <p className="text-xs font-semibold text-primary tracking-wide">Healthcare Package</p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 py-3 border-y border-border">
            <div className="flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  ₹{(pkg.amount_total ?? 0).toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] text-muted-foreground">Total Cost</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">{duration} Days</p>
                <p className="text-[11px] text-muted-foreground">Duration</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">{lines.length}</p>
                <p className="text-[11px] text-muted-foreground">Services</p>
              </div>
            </div>
          </div>

          {/* What's included */}
          {lines.length > 0 && (() => {
            const groups = lines.reduce<{ name: string; count: number }[]>((acc, line) => {
              const name = String((line.product_id as unknown[])?.[1] ?? '');
              const existing = acc.find((g) => g.name === name);
              if (existing) { existing.count++; } else { acc.push({ name, count: 1 }); }
              return acc;
            }, []);

            return (
              <ul className="space-y-3">
                {groups.map(({ name, count }) => (
                  <li key={name} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <p className="text-sm font-medium text-foreground flex-1">{name}</p>
                    {count > 1 && (
                      <Badge variant="secondary" className="text-xs font-semibold shrink-0">
                        ×{count}
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            );
          })()}


        </div>
      </div>

      {/* Fixed CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-3 bg-background border-t border-border">
        <Button
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base h-14 rounded-2xl"
          onClick={handleProceed}
        >
          Book for ₹{(pkg.amount_total ?? 0).toLocaleString('en-IN')}
          <ChevronRight className="w-5 h-5 ml-1" />
        </Button>
      </div>
    </div>
  );
}

export default function PackageDetailPage() {
  const params = useParams();
  const packageId = params.package_id as string;

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <PackageDetailContent packageId={packageId} />
    </Suspense>
  );
}
