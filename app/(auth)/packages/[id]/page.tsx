'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  IndianRupee,
  Calendar,
  Package,
  Clock,
  CheckCircle,
  PlayCircle,
  CreditCard,
  BookOpen,
  CalendarPlus,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BackButton } from '@/components/common/back-button';
import { getPackagesManaged, postPaymentsPackage } from '@/sdk/auth-and-crm';
import { useAuth } from '@/hooks/use-auth';
import type { BookedPackage } from '@/types/package';

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

export default function PackageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [pkg, setPkg]               = useState<BookedPackage | null>(null);
  const [loading, setLoading]       = useState(true);
  const [notFound, setNotFound]     = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError]     = useState<string | null>(null);

  const loadPackage = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPackagesManaged();
      const list = (res.data ?? []) as unknown as BookedPackage[];
      const found = list.find(p => String(p.booked_package_id) === id);
      if (!found) {
        setNotFound(true);
      } else {
        setPkg(found);
      }
    } catch (err) {
      console.error('Failed to load package:', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPackage();
  }, [loadPackage]);

  const handlePayNow = async () => {
    if (!pkg || !user?.lead_id) return;
    setPayLoading(true);
    setPayError(null);
    try {
      const res = await postPaymentsPackage({
        body: {
          booked_package_id: Number(pkg.booked_package_id),
          campus_id: Number(pkg.campus_id[0]),
          lead_id: Number(user.lead_id),
        },
      });
      if (res.error) throw new Error(JSON.stringify(res.error));
      const url = res.data?.result?.short_url;
      if (!url) throw new Error('No payment URL received.');
      window.location.href = url;
    } catch (err: unknown) {
      setPayError((err as { message?: string })?.message ?? 'Failed to process payment');
      setPayLoading(false);
    }
  };

  const handleViewJourney = () => {
    if (!pkg?.journey_id) return;
    const isPreview = pkg.package_stage === 'booked' ? '&isPreview=true' : '';
    router.push(`/journey?id=${pkg.journey_id}${isPreview}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !pkg) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center gap-3 px-4 pt-6 pb-4">
          <BackButton fallback="/packages" />
          <h1 className="text-xl font-bold text-foreground">Package Details</h1>
        </div>
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center gap-4">
          <Package className="h-16 w-16 text-muted-foreground/50" />
          <p className="text-lg font-semibold text-foreground">Package not found</p>
          <Button variant="outline" onClick={() => router.push('/packages')}>
            Back to Packages
          </Button>
        </div>
      </div>
    );
  }

  const { label, className, Icon } = getStageBadge(pkg.package_stage);
  const packageName = pkg.package_id[1] ?? 'Package';
  const campusName  = pkg.campus_id[1] ?? '';

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center gap-3 px-4 pt-6 pb-4 border-b border-border">
        <BackButton fallback="/packages" />
        <h1 className="text-base font-semibold text-foreground">Package Details</h1>
      </div>

      <div className="px-4 py-5 pb-40 max-w-2xl mx-auto space-y-4">
        {/* Package header card */}
        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <Package className="h-7 w-7 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h2 className="font-bold text-foreground text-base leading-snug">{packageName}</h2>
                  <Badge variant="outline" className={`text-[10px] shrink-0 gap-0.5 ${className}`}>
                    <Icon className="h-2.5 w-2.5" />
                    {label}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">#{pkg.booked_package_id}</p>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-lg shrink-0">
                  <IndianRupee className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Cost</p>
                  <p className="text-sm font-semibold text-foreground">
                    ₹{pkg.package_cost.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-lg shrink-0">
                  <Calendar className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Date</p>
                  <p className="text-sm font-semibold text-foreground">{pkg.date}</p>
                </div>
              </div>

              {campusName && (
                <div className="flex items-center gap-2.5 col-span-2">
                  <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-lg shrink-0">
                    <BookOpen className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Campus</p>
                    <p className="text-sm font-semibold text-foreground">{campusName}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sessions / product lines */}
        {pkg.lines && pkg.lines.length > 0 && (
          <Card className="border-border">
            <CardContent className="p-5">
              <h3 className="font-semibold text-foreground mb-3">Sessions Included</h3>
              <div className="space-y-2">
                {pkg.lines.map((line, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                    <span className="text-foreground">{line.product_id[1]}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {payError && (
          <div className="flex items-center gap-2 text-destructive text-sm rounded-lg bg-destructive/10 p-3">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {payError}
          </div>
        )}
      </div>

      {/* Sticky action bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border space-y-2">
        {pkg.package_stage === 'booked' && (
          <Button
            className="w-full rounded-full h-12 text-base font-semibold gap-2"
            onClick={handlePayNow}
            disabled={payLoading}
          >
            {payLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <CreditCard className="h-5 w-5" />
            )}
            {payLoading ? 'Redirecting to Razorpay…' : `Pay ₹${pkg.package_cost.toLocaleString('en-IN')}`}
          </Button>
        )}

        {(pkg.package_stage === 'confirm' || pkg.package_stage === 'in_progress') && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 rounded-full h-12 gap-2"
              onClick={() => router.push('/find-therapist')}
            >
              <CalendarPlus className="h-5 w-5" />
              Book Session
            </Button>
            {pkg.journey_id && (
              <Button
                className="flex-1 rounded-full h-12 gap-2"
                onClick={handleViewJourney}
              >
                <BookOpen className="h-5 w-5" />
                View Journey
              </Button>
            )}
          </div>
        )}

        {pkg.package_stage === 'done' && pkg.journey_id && (
          <Button
            className="w-full rounded-full h-12 text-base font-semibold gap-2"
            onClick={handleViewJourney}
          >
            <BookOpen className="h-5 w-5" />
            View Journey
          </Button>
        )}
      </div>
    </div>
  );
}
