'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BackButton } from '@/components/common/back-button';
import { PackageCard } from '@/components/package/package-card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Filter, Check, AlertCircle, PackageOpen } from 'lucide-react';
import { getPackages, getPackagesProductLines } from '@/sdk/auth-and-crm';
import type { AvailablePackage, PackageProductLine } from '@/types/package';

const ILLNESSES = [
  { id: 1, name: 'Addiction' },
  { id: 2, name: 'ADHD' },
  { id: 3, name: 'Anxiety' },
  { id: 4, name: 'Autism Spectrum Disorder' },
  { id: 5, name: 'Cerebral Palsy' },
  { id: 6, name: 'Conduct Disorder' },
  { id: 7, name: 'Dementia' },
  { id: 8, name: 'Dual Diagnosis' },
  { id: 9, name: 'Eating Disorders' },
  { id: 10, name: 'Gender Identity Disorder' },
  { id: 11, name: 'Learning Disability' },
  { id: 12, name: 'Mental Retardation' },
  { id: 13, name: 'Mood Disorders' },
  { id: 14, name: 'Obsessive-Compulsive Disorder' },
  { id: 15, name: 'Personality Disorder' },
  { id: 16, name: 'Psychosis' },
  { id: 17, name: 'Relationship Issues' },
  { id: 18, name: 'Behavioural issues' },
  { id: 19, name: 'Stress' },
  { id: 20, name: 'Trauma' },
  { id: 21, name: 'Academic issues' },
  { id: 22, name: 'Brain Injury/ Neurological' },
  { id: 27, name: 'Family issues' },
  { id: 29, name: 'Divorce' },
  { id: 30, name: 'Parenting' },
  { id: 31, name: 'Perinatal Mental Health' },
  { id: 32, name: 'Schizophrenia' },
  { id: 33, name: 'Bipolar' },
  { id: 34, name: 'OCD' },
  { id: 38, name: 'Depression' },
];

function PackageCardSkeleton() {
  return (
    <div className="rounded-xl border border-border p-4 space-y-3">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-px w-full" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-2">
          <Skeleton className="w-7 h-7 rounded-lg" />
          <div className="space-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
      <Skeleton className="h-8 w-full rounded-md" />
    </div>
  );
}

// Store selected package in sessionStorage to survive navigation
function storeSelectedPackage(pkg: AvailablePackage) {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem('selected_package', JSON.stringify(pkg));
  }
}

function BookPackageContent() {
  const router = useRouter();

  const [allPackages, setAllPackages] = useState<AvailablePackage[]>([]);
  const [filteredPackages, setFilteredPackages] = useState<AvailablePackage[]>([]);
  const [productLines, setProductLines] = useState<PackageProductLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [selectedIllnessIds, setSelectedIllnessIds] = useState<number[]>([]);
  const [tempIllnessIds, setTempIllnessIds] = useState<number[]>([]);

  const loadPackages = useCallback(async (serviceIds: number[] = []) => {
    try {
      setLoading(true);
      setError(null);

      const [pkgRes, linesRes] = await Promise.all([
        getPackages(serviceIds.length ? { query: { service_ids: serviceIds.join(',') } } : undefined),
        getPackagesProductLines(),
      ]);

      const list = (pkgRes.data ?? []) as unknown as AvailablePackage[];
      const lines = (linesRes.data ?? []) as unknown as PackageProductLine[];

      setAllPackages(list);
      setFilteredPackages(list);
      setProductLines(lines);
    } catch {
      setError('Failed to load packages. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPackages();
  }, [loadPackages]);

  const applyFilters = async (ids: number[]) => {
    setSelectedIllnessIds(ids);
    if (ids.length === 0) {
      setFilteredPackages(allPackages);
      return;
    }
    await loadPackages(ids);
  };

  const handleSelect = (pkg: AvailablePackage) => {
    storeSelectedPackage(pkg);
    router.push('/packages/selected-package');
  };

  const filteredIllnesses = ILLNESSES.filter((i) =>
    i.name.toLowerCase().includes(filterSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-safe-top pt-4">
        <div className="flex items-center gap-3 mb-4">
          <BackButton fallback="/packages" />
          <div>
            <h1 className="text-xl font-bold text-foreground">Browse Packages</h1>
            <p className="text-sm text-muted-foreground">Find the perfect healthcare package</p>
          </div>
        </div>

        {/* Stats + filter */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-foreground">{filteredPackages.length}</span>
            <span className="text-sm text-muted-foreground">packages available</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              setTempIllnessIds(selectedIllnessIds);
              setShowFilter(true);
            }}
          >
            <Filter className="w-3.5 h-3.5" />
            Filter
            {selectedIllnessIds.length > 0 && (
              <Badge variant="default" className="h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                {selectedIllnessIds.length}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              {error}
              <Button size="sm" variant="outline" onClick={() => loadPackages()} className="ml-2">
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[0, 1, 2, 3].map((i) => <PackageCardSkeleton key={i} />)}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filteredPackages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <PackageOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">No Packages Found</h2>
              <p className="text-sm text-muted-foreground max-w-xs">
                Try adjusting your filters or browse all packages.
              </p>
            </div>
            <Button variant="outline" onClick={() => applyFilters([])}>
              Clear Filters
            </Button>
          </div>
        )}

        {/* Package grid */}
        {!loading && !error && filteredPackages.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredPackages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                productLines={productLines}
                onBook={() => handleSelect(pkg)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Filter Dialog */}
      <Dialog open={showFilter} onOpenChange={setShowFilter}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Filter Packages</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search conditions..."
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="h-64">
              <div className="space-y-1 pr-3">
                {filteredIllnesses.map((illness) => {
                  const selected = tempIllnessIds.includes(illness.id);
                  return (
                    <button
                      key={illness.id}
                      onClick={() =>
                        setTempIllnessIds((prev) =>
                          selected ? prev.filter((id) => id !== illness.id) : [...prev, illness.id]
                        )
                      }
                      className="flex items-center gap-3 w-full p-2 rounded-md hover:bg-muted transition-colors text-left"
                    >
                      <div
                        className={`w-4 h-4 border-2 rounded flex items-center justify-center shrink-0 transition-colors ${
                          selected ? 'bg-primary border-primary' : 'border-border'
                        }`}
                      >
                        {selected && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                      </div>
                      <span className="text-sm text-foreground">{illness.name}</span>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setTempIllnessIds([]);
                setFilterSearch('');
              }}
            >
              Clear All
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                applyFilters(tempIllnessIds);
                setShowFilter(false);
              }}
            >
              Apply Filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function BookPackagePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <BookPackageContent />
    </Suspense>
  );
}
