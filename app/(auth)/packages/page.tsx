'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Package } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BackButton } from '@/components/common/back-button';
import { PackageListCard } from '@/components/package/package-list-card';
import { getPackagesManaged } from '@/sdk/auth-and-crm';
import type { BookedPackage } from '@/types/package';

export default function PackagesPage() {
  const [packages, setPackages] = useState<BookedPackage[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPackages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPackagesManaged();
      setPackages((res.data ?? []) as unknown as BookedPackage[]);
    } catch (err) {
      console.error('Failed to load packages:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPackages();
  }, [loadPackages]);

  const active  = packages.filter(p => p.package_stage === 'in_progress' || p.package_stage === 'confirm');
  const pending = packages.filter(p => p.package_stage === 'booked');
  const done    = packages.filter(p => p.package_stage === 'done');
  const total   = packages.length;

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <BackButton fallback="/home" />
        <h1 className="text-xl font-bold text-foreground">My Packages</h1>
      </div>

      {loading && (
        <div className="px-4 space-y-3">
          <Skeleton className="h-10 w-full rounded-full" />
          {[0, 1, 2].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
        </div>
      )}

      {!loading && total === 0 && (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center gap-4">
          <Package className="h-16 w-16 text-muted-foreground/50" />
          <div>
            <p className="text-lg font-semibold text-foreground">No packages yet</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
              Browse and purchase a healthcare package to begin your wellness journey.
            </p>
          </div>
          <Button asChild className="rounded-full px-8 mt-2">
            <Link href="/packages/book-package">
              <Plus className="h-4 w-4 mr-1.5" strokeWidth={3} />
              Browse Packages
            </Link>
          </Button>
        </div>
      )}

      {!loading && total > 0 && (
        <div className="px-4 pb-24">
          <Tabs defaultValue="active">
            <TabsList className="w-full rounded-full mb-4">
              <TabsTrigger value="active" className="flex-1 rounded-full">
                Active ({active.length})
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex-1 rounded-full">
                Pending ({pending.length})
              </TabsTrigger>
              {done.length > 0 && (
                <TabsTrigger value="done" className="flex-1 rounded-full">
                  Done ({done.length})
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="active" className="space-y-3 mt-0">
              {active.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-10">No active packages</p>
              ) : (
                active.map(pkg => <PackageListCard key={pkg.booked_package_id} pkg={pkg} />)
              )}
            </TabsContent>

            <TabsContent value="pending" className="space-y-3 mt-0">
              {pending.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-10">No pending packages</p>
              ) : (
                pending.map(pkg => <PackageListCard key={pkg.booked_package_id} pkg={pkg} />)
              )}
            </TabsContent>

            {done.length > 0 && (
              <TabsContent value="done" className="space-y-3 mt-0">
                {done.map(pkg => <PackageListCard key={pkg.booked_package_id} pkg={pkg} />)}
              </TabsContent>
            )}
          </Tabs>
        </div>
      )}

      {!loading && total > 0 && (
        <div className="fixed bottom-6 right-4">
          <Button asChild size="lg" className="rounded-full shadow-lg gap-2">
            <Link href="/packages/book-package">
              <Plus className="h-5 w-5" strokeWidth={3} />
              New
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
