'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { IndianRupee, Package, Clock, Star, CheckCircle2 } from 'lucide-react';
import type { PackageResponseDto } from '@/sdk/backend-v2';
import type { PackageProductLine } from '@/hooks/packages/use-packages';

interface PackageCardProps {
  pkg: PackageResponseDto;
  productLines?: PackageProductLine[];
  onBook: () => void;
}

export function PackageCard({ pkg, productLines, onBook }: PackageCardProps) {
  const duration = pkg.duration_days ?? 30;

  return (
    <Card className="border-border bg-card hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-sm leading-snug line-clamp-2">
              {pkg.name}
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
                ₹{(pkg.price ?? 0).toLocaleString('en-IN')}
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

          {pkg.description && (
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-7 h-7 bg-muted rounded-lg shrink-0">
                <Package className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">About</p>
                <p className="text-sm font-medium text-foreground line-clamp-2">{pkg.description}</p>
              </div>
            </div>
          )}
        </div>

        {/* Services preview */}
        {productLines && productLines.length > 0 && (
          <div className="rounded-lg bg-muted p-3 space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Package includes:</p>
            <ul className="space-y-1">
              {productLines.slice(0, 3).map((line) => (
                <li key={line.id} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                  <span className="text-xs text-foreground truncate">
                    {String(line.product_id[1])}
                  </span>
                </li>
              ))}
              {productLines.length > 3 && (
                <li className="text-xs text-primary font-medium pl-5">
                  +{productLines.length - 3} more services
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
