'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { IndianRupee, Package, Clock, Star, CheckCircle2 } from 'lucide-react';
import type { AvailablePackage, PackageProductLine } from '@/types/package';

interface PackageCardProps {
  pkg: AvailablePackage;
  productLines?: PackageProductLine[];
  onBook: () => void;
}

function getDisplayDuration(pkg: AvailablePackage): number {
  const duration = pkg.duration ?? pkg.package_duration;
  if (duration === 90) return 90;
  const name = (pkg.package_name ?? '').toLowerCase();
  if (/90[\s-]?day|^90\s/.test(name)) return 90;
  return duration ?? 30;
}

export function PackageCard({ pkg, productLines, onBook }: PackageCardProps) {
  const duration = getDisplayDuration(pkg);
  const serviceCount = pkg.package_product_ids?.length ?? 0;

  return (
    <Card className="border-border bg-card hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-sm leading-snug line-clamp-2">
              {pkg.package_name}
            </h3>
          </div>
          <Badge variant="secondary" className="shrink-0 text-xs gap-1">
            <Star className="w-3 h-3" />
            Available
          </Badge>
        </div>

        <Separator />

        {/* Details */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 bg-muted rounded-lg shrink-0">
              <IndianRupee className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Cost</p>
              <p className="text-sm font-medium text-foreground">
                ₹{pkg.amount_total.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 bg-muted rounded-lg shrink-0">
              <Package className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Services Included</p>
              <p className="text-sm font-medium text-foreground">
                {serviceCount} {serviceCount === 1 ? 'service' : 'services'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 bg-muted rounded-lg shrink-0">
              <Clock className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Duration</p>
              <p className="text-sm font-medium text-foreground">{duration} Days</p>
            </div>
          </div>
        </div>

        {/* Services preview */}
        {productLines && (pkg.package_product_ids?.length ?? 0) > 0 && (
          <div className="rounded-lg bg-muted p-3 space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Package includes:</p>
            <ul className="space-y-1">
              {(pkg.package_product_ids ?? []).slice(0, 3).map((sid) => {
                const line = productLines.find((l) => l.id === sid);
                return (
                  <li key={sid} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                    <span className="text-xs text-foreground truncate">
                      {line ? line.product_id[1] : `Service ${sid}`}
                    </span>
                  </li>
                );
              })}
              {(pkg.package_product_ids?.length ?? 0) > 3 && (
                <li className="text-xs text-primary font-medium pl-5">
                  +{(pkg.package_product_ids?.length ?? 0) - 3} more services
                </li>
              )}
            </ul>
          </div>
        )}

        {/* CTA */}
        <Button size="sm" className="w-full" onClick={onBook}>
          Book Package
        </Button>
      </CardContent>
    </Card>
  );
}
