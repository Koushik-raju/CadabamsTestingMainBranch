'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/common/back-button';
import { BookedPackageCard } from '@/components/package/booked-package-card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Package, AlertCircle, PlusCircle } from 'lucide-react';
import { getPackagesManaged, postPaymentsPackage } from '@/sdk/auth-and-crm';
import { useAuth } from '@/hooks/use-auth';
import type { BookedPackage } from '@/types/package';

export default function PackagesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [packages, setPackages] = useState<BookedPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState<number | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const loadPackages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getPackagesManaged();
      setPackages((res.data ?? []) as unknown as BookedPackage[]);
    } catch {
      setError('Failed to load packages. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPackages();
  }, [loadPackages]);

  const handlePayNow = async (pkg: BookedPackage) => {
    if (!user?.lead_id) return;
    try {
      setPaymentLoading(pkg.booked_package_id);
      setPaymentError(null);

      const res = await postPaymentsPackage({
        body: {
          booked_package_id: Number(pkg.booked_package_id),
          campus_id: Number(pkg.campus_id[0]),
          lead_id: Number(user.lead_id),
        },
      });
      if (res.error) throw new Error(JSON.stringify(res.error));
      const url = res.data?.redirect_url;
      if (!url) throw new Error('No payment URL received.');
      window.location.href = url;
    } catch (err: unknown) {
      setPaymentError((err as { message?: string })?.message ?? 'Failed to process payment');
    } finally {
      setPaymentLoading(null);
    }
  };

  const handleViewJourney = (pkg: BookedPackage) => {
    if (pkg.journey_id) {
      const isPreview = pkg.package_stage === 'booked' ? '&isPreview=true' : '';
      router.push(`/journey?id=${pkg.journey_id}${isPreview}`);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-safe-top pt-4 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <BackButton fallback="/home" />
          <div>
            <h1 className="text-xl font-bold text-foreground">My Packages</h1>
            <p className="text-sm text-muted-foreground">Manage your healthcare packages</p>
          </div>
        </div>

        {/* Book new package CTA */}
        <Button
          className="w-full gap-2"
          onClick={() => router.push('/packages/book-package')}
        >
          <PlusCircle className="w-4 h-4" />
          Book New Package
        </Button>
      </div>

      <div className="px-4 space-y-4">
        {/* Payment error */}
        {paymentError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{paymentError}</AlertDescription>
          </Alert>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Loading packages...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              {error}
              <Button size="sm" variant="outline" onClick={loadPackages} className="ml-2">
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Empty state */}
        {!loading && !error && packages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Package className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">No Packages Yet</h2>
              <p className="text-sm text-muted-foreground max-w-xs">
                You have not purchased any packages. Browse available packages to start your wellness journey.
              </p>
            </div>
            <Button onClick={() => router.push('/packages/book-package')}>
              Browse Packages
            </Button>
          </div>
        )}

        {/* Package list */}
        {!loading && !error && packages.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {packages.map((pkg) => (
              <BookedPackageCard
                key={pkg.booked_package_id}
                pkg={pkg}
                onPayNow={() => handlePayNow(pkg)}
                onViewJourney={() => handleViewJourney(pkg)}
                paymentLoading={paymentLoading === pkg.booked_package_id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
