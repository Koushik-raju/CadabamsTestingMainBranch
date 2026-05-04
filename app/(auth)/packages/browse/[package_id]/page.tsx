/**
 * FILE: app/(auth)/packages/browse/[package_id]/page.tsx
 *
 * PURPOSE:
 *   Detail page for an available (purchasable) package. Shows a journey image
 *   hero (with gradient fallback), pricing, session count, included services list,
 *   an "Included Journey" card when a journey is linked, and a Proceed CTA.
 *
 * LOGIC OVERVIEW:
 *   - Reads :package_id from useParams(); matches against useAvailablePackages().
 *   - usePackageProductDetails(numericId) fetches product lines for this package.
 *   - Hero: renders pkg.journey_icon_url as a cover image with dark overlay when
 *     available; falls back to palette gradient when no image is present.
 *   - Journey section: when pkg.cms_journey_id is non-null, renders a clickable
 *     "Included Journey" card showing journey_name and journey_icon_url (thumbnail + name);
 *     tapping navigates to /journeys/:cms_journey_id.
 *   - Product lines grouped by product name with session counts.
 *   - handleProceed() serialises the package to sessionStorage then routes to /packages/book/:id.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   packageId       — string from useParams
 *   pkg             — PackageResponseDto (includes journey_icon_url, journey_name, journey_id)
 *   lines           — PackageProductLineDto[] from usePackageProductDetails
 *   hasJourneyImage — boolean; true when pkg.journey_icon_url is set
 *   PackageBrowsePage — default exported page
 *
 * DEPENDENCIES:
 *   useAvailablePackages, usePackageProductDetails  — from @/hooks/use-packages
 *   odooTuple                                       — from @/lib/odoo
 *   PackageResponseDto                              — from @/sdk/backend-v2
 *
 * LAST UPDATED: 2026-05-04 — Journey image hero and included-journey section added
 */
"use client";

import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  IndianRupee,
  Layers,
  Package,
  Sparkles,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/shared/navigation/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAvailablePackages, usePackageProductDetails } from "@/hooks/use-packages";
import { odooTuple } from "@/lib/odoo";
import { getPackagePalette } from "@/lib/package-colors";
import { cn } from "@/lib/utils";
import type { PackageResponseDto } from "@/sdk/backend-v2";

function storeSelectedPackage(pkg: PackageResponseDto) {
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.setItem("selected_package", JSON.stringify(pkg));
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
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PackageDetailContent({ packageId }: { packageId: string }) {
  const router = useRouter();
  const { packages, isLoading: pkgLoading } = useAvailablePackages();
  const numericId = Number(packageId);
  const pkg = packages.find((p) => p.id === numericId) ?? null;
  const { lines, isLoading: linesLoading } = usePackageProductDetails(numericId);

  const isLoading = pkgLoading || linesLoading;

  if (isLoading) return <PackageDetailSkeleton />;

  if (!pkg) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <PageHeader title="" fallback="/packages" />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <p className="text-destructive font-medium">Package not found.</p>
          <Button variant="outline" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const handleProceed = () => {
    storeSelectedPackage(pkg);
    router.push(`/packages/book/${pkg.id}`);
  };

  const palette = getPackagePalette(pkg.id);
  const hasJourneyImage = Boolean(pkg.journey_icon_url);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PageHeader title="" fallback="/packages" />

      <div className="flex-1 overflow-y-auto pb-32">
        {/* Hero banner — journey image when available, gradient fallback otherwise */}
        <div className="w-full h-52 relative overflow-hidden flex items-end">
          {hasJourneyImage ? (
            <>
              <img
                src={pkg.journey_icon_url!}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            </>
          ) : (
            <>
              <div className={cn("absolute inset-0 bg-gradient-to-br", palette.gradient)} />
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_70%_20%,white,transparent_60%)]" />
              <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10" />
              <div className="absolute top-4 left-5">
                <div
                  className={cn(
                    "w-12 h-12 rounded-2xl backdrop-blur-sm flex items-center justify-center",
                    palette.iconBg,
                  )}
                >
                  <Package className="w-6 h-6 text-white" />
                </div>
              </div>
            </>
          )}
          <div className="relative p-5 w-full">
            <p className="text-white/70 text-sm font-semibold mb-1">
              ₹{pkg.amount_total.toLocaleString("en-IN")}
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
          <div className="grid grid-cols-2 py-3 border-y border-border">
            <div className="flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  ₹{pkg.amount_total.toLocaleString("en-IN")}
                </p>
                <p className="text-[11px] text-muted-foreground">Total Cost</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">{lines.length}</p>
                <p className="text-[11px] text-muted-foreground">Sessions</p>
              </div>
            </div>
          </div>

          {/* What's included */}
          {lines.length > 0 &&
            (() => {
              const groups = lines.reduce<{ name: string; count: number }[]>((acc, line) => {
                const name = String(odooTuple(line.product_id, 1) ?? "");
                const existing = acc.find((g) => g.name === name);
                if (existing) {
                  existing.count++;
                } else {
                  acc.push({ name, count: 1 });
                }
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
          {/* Included Journey — only rendered when this package links to a CMS journey */}
          {pkg.cms_journey_id && (
            <div>
              <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-primary" />
                Included Journey
              </h2>
              <div
                className="flex items-center gap-3 rounded-2xl border border-border overflow-hidden shadow-[var(--sh-1)] cursor-pointer active:scale-[0.98] transition-transform"
                onClick={() => router.push(`/journeys/${pkg.cms_journey_id}`)}
              >
                {/* Journey thumbnail */}
                <div className="w-20 h-20 flex-shrink-0 relative overflow-hidden bg-muted">
                  {pkg.journey_icon_url ? (
                    <img
                      src={pkg.journey_icon_url}
                      alt={pkg.journey_name ?? "Journey"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className={cn(
                        "w-full h-full bg-gradient-to-br flex items-center justify-center",
                        palette.gradient,
                      )}
                    >
                      <Sparkles className="w-6 h-6 text-white/80" />
                    </div>
                  )}
                </div>
                <div className="flex-1 py-3 pr-3">
                  <p className="text-xs text-primary font-semibold mb-0.5">Wellness Journey</p>
                  <p className="text-sm font-bold text-foreground leading-snug line-clamp-2">
                    {pkg.journey_name ?? "Journey included"}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground mr-3 flex-shrink-0" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fixed CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-3 bg-background border-t border-border">
        <Button
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base h-14 rounded-2xl"
          onClick={handleProceed}
        >
          Book for ₹{pkg.amount_total.toLocaleString("en-IN")}
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
