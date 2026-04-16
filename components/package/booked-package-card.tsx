'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  IndianRupee,
  Hash,
  CalendarDays,
  CheckCircle,
  PlayCircle,
  Clock,
  Package,
  CreditCard,
} from 'lucide-react';
import type { BookedPackageDto } from '@/sdk/backend-v2';

interface BookedPackageCardProps {
  pkg: BookedPackageDto;
  onPayNow?: () => void;
  paymentLoading?: boolean;
}

type StageConfig = {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  icon: React.ComponentType<{ className?: string }>;
};

function getStageConfig(stage: string): StageConfig {
  switch (stage) {
    case 'confirm':
      return { label: 'Confirmed', variant: 'default', icon: CheckCircle };
    case 'in_progress':
      return { label: 'Active', variant: 'secondary', icon: PlayCircle };
    case 'booked':
      return { label: 'Payment Pending', variant: 'outline', icon: Clock };
    default:
      return { label: stage, variant: 'secondary', icon: Package };
  }
}

export function BookedPackageCard({
  pkg,
  onPayNow,
  paymentLoading = false,
}: BookedPackageCardProps) {
  const stageConfig = getStageConfig(pkg.package_stage);
  const StageIcon = stageConfig.icon;

  return (
    <Card className="border-border bg-card hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground text-sm leading-snug flex-1 min-w-0 line-clamp-2">
            {String((pkg.package_id as unknown[])?.[1] ?? 'Package')}
          </h3>
          <Badge variant={stageConfig.variant} className="shrink-0 text-xs gap-1">
            <StageIcon className="w-3 h-3" />
            {stageConfig.label}
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
              <p className="text-xs text-muted-foreground">Cost</p>
              <p className="text-sm font-medium text-foreground">
                ₹{pkg.package_cost.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 bg-muted rounded-lg shrink-0">
              <Hash className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Package ID</p>
              <p className="text-sm font-medium text-foreground">#{pkg.booked_package_id}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 bg-muted rounded-lg shrink-0">
              <CalendarDays className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="text-sm font-medium text-foreground">{pkg.date}</p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        {pkg.package_stage === 'booked' && onPayNow && (
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 gap-1.5"
              onClick={onPayNow}
              disabled={paymentLoading}
            >
              <CreditCard className="w-3.5 h-3.5" />
              {paymentLoading ? 'Processing...' : 'Pay Now'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
