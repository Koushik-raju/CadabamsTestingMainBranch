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
  User,
  MapPin,
  ListOrdered,
  Stethoscope,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BackButton } from '@/components/shared/navigation/back-button';
import { getPackagesManaged, postPaymentsPackage } from '@/sdk/auth-and-crm';
import { useAuth } from '@/hooks/use-auth';
import type { BookedPackage } from '@/types/package';
import type { BookedPackageProductLine } from '@/sdk/auth-and-crm';

function getStageBadge(stage: string) {
  switch (stage) {
    case 'in_progress':
      return { label: 'Active', className: 'bg-green-100 text-green-700 border-green-200', Icon: PlayCircle };
    case 'confirm':
      return { label: 'Confirmed', className: 'bg-primary/10 text-primary border-primary/20', Icon: CheckCircle };
    case 'booked':
      return { label: 'Pending Payment', className: 'bg-amber-100 text-amber-700 border-amber-200', Icon: Clock };
    case 'done':
      return { label: 'Completed', className: 'bg-muted text-muted-foreground border-border', Icon: CheckCircle };
    default:
      return { label: stage, className: 'bg-muted text-muted-foreground border-border', Icon: Package };
  }
}

function getLineStatusBadge(status: string) {
  switch (status) {
    case 'done':
      return <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">Done</Badge>;
    case 'scheduled':
      return <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">Scheduled</Badge>;
    case 'cancelled':
      return <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/20">Cancelled</Badge>;
    default:
      return <Badge variant="outline" className="text-[10px]">Open</Badge>;
  }
}

type ManagedPkg = BookedPackage & {
  caller_name?: string;
  patient_name?: string;
  sequence_booking?: boolean;
  lines?: BookedPackageProductLine[];
};

export default function PackageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [pkg, setPkg]               = useState<ManagedPkg | null>(null);
  const [loading, setLoading]       = useState(true);
  const [notFound, setNotFound]     = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError]     = useState<string | null>(null);

  const loadPackage = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPackagesManaged();
      const list = (res.data ?? []) as unknown as ManagedPkg[];
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
  const lines = pkg.lines ?? [];
  const doneCount = lines.filter(l => l.status === 'done').length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-3">
          <BackButton fallback="/packages" />
          <span className="text-sm font-medium text-muted-foreground">Package Details</span>
        </div>
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-lg font-bold text-foreground leading-snug flex-1">{packageName}</h1>
          <Badge variant="outline" className={`text-[10px] shrink-0 gap-1 ${className}`}>
            <Icon className="h-2.5 w-2.5" />
            {label}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Booking #{pkg.booked_package_id}</p>
      </div>

      <div className="px-4 py-4 pb-36 space-y-3">

        {/* Key details */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-0.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Amount</p>
              <p className="text-base font-bold text-primary">₹{pkg.package_cost.toLocaleString('en-IN')}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Date</p>
              <p className="text-sm font-semibold text-foreground">{pkg.date}</p>
            </div>
          </div>

          {(campusName || pkg.patient_name || pkg.caller_name) && (
            <>
              <Separator />
              <div className="space-y-2.5">
                {campusName && (
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Campus</p>
                      <p className="text-sm font-medium text-foreground">{campusName}</p>
                    </div>
                  </div>
                )}
                {pkg.patient_name && (
                  <div className="flex items-center gap-2.5">
                    <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Patient</p>
                      <p className="text-sm font-medium text-foreground">{pkg.patient_name}</p>
                    </div>
                  </div>
                )}
                {pkg.caller_name && pkg.caller_name !== pkg.patient_name && (
                  <div className="flex items-center gap-2.5">
                    <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Booked by</p>
                      <p className="text-sm font-medium text-foreground">{pkg.caller_name}</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {pkg.sequence_booking !== undefined && (
            <>
              <Separator />
              <div className="flex items-center gap-2.5">
                <ListOrdered className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <p className="text-sm text-foreground">
                  {pkg.sequence_booking ? 'Sequential booking enabled' : 'Flexible booking order'}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Journey */}
        {pkg.journey_id && (
          <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-4 h-4 text-primary shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">Care Journey</p>
                <p className="text-xs text-muted-foreground">Your personalised care plan</p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="shrink-0 rounded-full" onClick={handleViewJourney}>
              View
            </Button>
          </div>
        )}

        {/* Sessions */}
        {lines.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Sessions</p>
              <span className="text-xs text-muted-foreground">{doneCount}/{lines.length} completed</span>
            </div>
            <div className="space-y-2">
              {lines.map((line, i) => (
                <div key={line.id ?? i} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 text-[10px] font-bold text-muted-foreground">
                    {line.sequence_no ?? i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{String(line.product_id[1])}</p>
                    {line.speciality_id && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Stethoscope className="w-3 h-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">{String(line.speciality_id[1])}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {getLineStatusBadge(line.status)}
                    {line.price_subtotal > 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        ₹{line.price_subtotal.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {payError && (
          <div className="flex items-center gap-2 text-destructive text-sm rounded-xl bg-destructive/10 p-3">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {payError}
          </div>
        )}
      </div>

      {/* Sticky action bar */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 bg-background/95 backdrop-blur border-t border-border space-y-2">
        {pkg.package_stage === 'booked' && (
          <Button
            className="w-full rounded-full h-12 text-base font-semibold gap-2"
            onClick={handlePayNow}
            disabled={payLoading}
          >
            {payLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}
            {payLoading ? 'Redirecting to Razorpay…' : `Pay ₹${pkg.package_cost.toLocaleString('en-IN')}`}
          </Button>
        )}

        {(pkg.package_stage === 'confirm' || pkg.package_stage === 'in_progress') && (
          <Button
            className="w-full rounded-full h-12 text-base font-semibold gap-2"
            onClick={() => router.push('/consult/find-therapist')}
          >
            <CalendarPlus className="h-5 w-5" />
            Book a Session
          </Button>
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
