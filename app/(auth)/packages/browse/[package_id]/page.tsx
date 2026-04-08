'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { BackButton } from '@/components/common/back-button';
import {
  Clock,
  CheckCircle2,
  Package,
  IndianRupee,
  Layers,
} from 'lucide-react';
import { getPackages, getPackagesProductLines } from '@/sdk/auth-and-crm';
import type { AvailablePackage, PackageProductLine } from '@/types/package';

function getDisplayDuration(pkg: AvailablePackage): number {
  const duration = pkg.duration ?? pkg.package_duration;
  if (duration === 90) return 90;
  const name = (pkg.package_name ?? '').toLowerCase();
  if (/90[\s-]?day|^90\s/.test(name)) return 90;
  return duration ?? 30;
}

function getStoredPackage(): AvailablePackage | null {
  if (typeof sessionStorage === 'undefined') return null;
  const stored = sessionStorage.getItem('selected_package');
  if (!stored) return null;
  try {
    return JSON.parse(stored) as AvailablePackage;
  } catch {
    return null;
  }
}

function PackageDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border px-4 pt-6 pb-5 space-y-4">
        <Skeleton className="h-6 w-24" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>
      <div className="px-4 pt-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
        <Skeleton className="h-px w-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-12 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

function PackageDetailContent({ packageId }: { packageId: string }) {
  const router = useRouter();
  const [pkg, setPkg] = useState<AvailablePackage | null>(null);
  const [productLines, setProductLines] = useState<PackageProductLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPackage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pkgRes, linesRes] = await Promise.all([
        getPackages(),
        getPackagesProductLines(),
      ]);
      const list = (pkgRes.data ?? []) as unknown as AvailablePackage[];
      const lines = (linesRes.data ?? []) as unknown as PackageProductLine[];

      const found = list.find((p) => String(p.id) === packageId);
      if (!found) {
        const stored = getStoredPackage();
        if (stored && String(stored.id) === packageId) {
          setPkg(stored);
        } else {
          setError('Package not found');
        }
      } else {
        setPkg(found);
      }
      setProductLines(lines);
    } catch {
      setError('Failed to load package. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [packageId]);

  useEffect(() => {
    const stored = getStoredPackage();
    if (stored && String(stored.id) === packageId) {
      setPkg(stored);
      getPackagesProductLines()
        .then((res) => {
          setProductLines((res.data ?? []) as unknown as PackageProductLine[]);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      loadPackage();
    }
  }, [packageId, loadPackage]);

  const handleProceed = () => {
    if (!pkg) return;
    sessionStorage.setItem('selected_package', JSON.stringify(pkg));
    router.push(`/packages/book/${pkg.id}`);
  };

  const sheetLines = pkg
    ? productLines.filter((l) => pkg.package_product_ids?.includes(l.id))
    : [];

  if (loading) return <PackageDetailSkeleton />;

  if (error || !pkg) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="px-4 pt-6">
          <BackButton fallback="/packages/book-package" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 text-center">
          <Package className="w-12 h-12 text-muted-foreground/30" />
          <div>
            <p className="font-semibold text-sm text-foreground">
              {error ?? 'Package not found'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              The package you&apos;re looking for doesn&apos;t exist.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            Go back
          </Button>
        </div>
      </div>
    );
  }

  const duration = getDisplayDuration(pkg);
  const serviceCount = pkg.package_product_ids?.length ?? 0;

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 pt-6 pb-5">
        <div className="flex items-center gap-3 mb-4">
          <BackButton fallback="/packages/book-package" />
          <span className="text-sm font-medium text-muted-foreground">
            Package Details
          </span>
        </div>
        <h1 className="text-lg font-bold text-foreground leading-snug">
          {pkg.package_name}
        </h1>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="secondary" className="gap-1 text-xs font-normal">
            <Clock className="w-3 h-3" />
            {duration} days
          </Badge>
          <Badge variant="secondary" className="gap-1 text-xs font-normal">
            <Layers className="w-3 h-3" />
            {serviceCount} {serviceCount === 1 ? 'service' : 'services'}
          </Badge>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pt-5 space-y-5">
        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Total amount</p>
            <div className="flex items-baseline gap-0.5">
              <IndianRupee className="w-4 h-4 text-primary shrink-0" />
              <span className="text-2xl font-bold text-primary leading-none">
                {pkg.amount_total.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Duration</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-foreground leading-none">
                {duration}
              </span>
              <span className="text-sm text-muted-foreground">days</span>
            </div>
          </div>
        </div>

        {/* Services */}
        {sheetLines.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">
                What&apos;s included
                <span className="text-muted-foreground font-normal ml-1.5">
                  ({sheetLines.length} services)
                </span>
              </p>
              <div className="space-y-2">
                {sheetLines.map((line) => (
                  <div
                    key={line.id}
                    className="flex items-center gap-3 bg-muted/50 rounded-xl p-3"
                  >
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm text-foreground">
                      {String(line.product_id[1])}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {sheetLines.length === 0 && serviceCount > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">
                Services included
                <span className="text-muted-foreground font-normal ml-1.5">
                  ({serviceCount})
                </span>
              </p>
              <p className="text-sm text-muted-foreground">
                This package includes {serviceCount} services.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 bg-background/95 backdrop-blur border-t border-border">
        <Button
          className="w-full h-12 rounded-full text-base font-semibold"
          onClick={handleProceed}
        >
          Book for ₹{pkg.amount_total.toLocaleString('en-IN')}
        </Button>
      </div>
    </div>
  );
}

export default function PackageDetailPage() {
  const params = useParams();
  const packageId = params.package_id as string;

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PackageDetailContent packageId={packageId} />
    </Suspense>
  );
}
