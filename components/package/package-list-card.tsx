/**
 * FILE: components/package/package-list-card.tsx
 *
 * PURPOSE:
 *   Compact list-row card for a booked package. Used in the packages list page
 *   to display a user's purchased packages in a grouped-list layout.
 *
 * LOGIC OVERVIEW:
 *   - Receives a BookedPackageDto and renders package name (from many2one tuple),
 *     cost, date, and stage badge.
 *   - Tapping navigates to /packages/:booked_package_id.
 *   - Package initials (up to 2 words) are shown in an avatar circle.
 *   - Stage badge label/icon/color is derived from getStageBadge().
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   pkg             — BookedPackageDto from SDK
 *   PackageListCard — default exported row card component
 *
 * DEPENDENCIES:
 *   BookedPackageDto  — from @/sdk/backend-v2
 *   odooTuple         — from @/lib/odoo (safe many2one tuple access)
 *
 * LAST UPDATED: 2026-04-17 — added odooTuple guard for package_id many2one field
 */
'use client';

import { useRouter } from 'next/navigation';
import { IndianRupee, Calendar, Package, Clock, CheckCircle, PlayCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { BookedPackageDto } from '@/sdk/backend-v2';
import { odooTuple } from '@/lib/odoo';

interface PackageListCardProps {
  pkg: BookedPackageDto;
}

function getStageBadge(stage: string) {
  switch (stage) {
    case 'in_progress':
      return { label: 'Active', className: 'bg-green-100 text-green-700 border-green-200', Icon: PlayCircle };
    case 'confirm':
      return { label: 'Confirmed', className: 'bg-primary/10 text-primary border-primary/20', Icon: CheckCircle };
    case 'booked':
      return { label: 'Pending Payment', className: 'bg-amber-100 text-amber-700 border-amber-200', Icon: Clock };
    default:
      return { label: stage, className: 'bg-muted text-muted-foreground border-border', Icon: Package };
  }
}

export function PackageListCard({ pkg }: PackageListCardProps) {
  const router = useRouter();
  const { label, className, Icon } = getStageBadge(pkg.package_stage);
  const packageName = String(odooTuple(pkg.package_id, 1) ?? 'Package');

  const initials = packageName
    .split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <Card
      className="cursor-pointer active:scale-[0.98] transition-transform"
      onClick={() => router.push(`/packages/${pkg.booked_package_id}`)}
    >
      <CardContent className="p-4 flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-sm font-semibold text-primary">{initials || <Package className="h-5 w-5" />}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-sm text-foreground line-clamp-1">{packageName}</p>
            <Badge variant="outline" className={`text-[10px] shrink-0 capitalize gap-0.5 ${className}`}>
              <Icon className="h-2.5 w-2.5" />
              {label}
            </Badge>
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <IndianRupee className="h-3 w-3" />
              {pkg.package_cost.toLocaleString('en-IN')}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {pkg.date}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
