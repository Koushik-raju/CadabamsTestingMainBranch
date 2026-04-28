/**
 * FILE: app/(auth)/profile/page.tsx
 *
 * PURPOSE:
 *   My Profile page — shows the logged-in user's contact info, appointment
 *   stats, managed packages, and logout/delete-account actions.
 *
 * LOGIC OVERVIEW:
 *   1. Fetches the authenticated user profile via useAuthMe().
 *   2. Fetches appointment dashboard counts via crmControllerGetAppointmentDashboard,
 *      keyed on the user's phone number (skipped until phone is known).
 *   3. Fetches managed packages via useManagedPackages(), split into
 *      pendingPayments / activePackages / donePackages by package_stage.
 *   4. Renders a flat header (BackButton + title), an avatar tile, contact
 *      info grouped card, appointment stat tiles, package sections, and
 *      logout / delete-account actions.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   displayName       — resolved from contact_name or partner_name
 *   initials          — first two word initials of displayName
 *   upcomingCount     — upcoming appointment count from dashboard
 *   completedCount    — completed appointment count from dashboard
 *   totalCount        — total appointment count from dashboard
 *   pendingPayments   — booked packages with stage "booked"
 *   activePackages    — booked packages with stage "confirm" or "in_progress"
 *   donePackages      — booked packages with stage "done"
 *
 * DEPENDENCIES:
 *   useAuthMe() — SWR hook for authenticated user profile
 *   useManagedPackages() — SWR hook for booked packages
 *   crmControllerGetAppointmentDashboard — SDK call for appointment stats
 *   BackButton — shared back navigation component
 *
 * LAST UPDATED: 2026-04-28 — Neo design system: shadow scale, color tokens, border radius
 */

"use client";

import { PackageListCard } from "@/components/package/package-list-card";
import { BackButton } from "@/components/shared/navigation/back-button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useManagedPackages } from "@/hooks/packages/use-packages";
import { useAuthMe } from "@/hooks/shared/auth/use-auth";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { crmControllerGetAppointmentDashboard } from "@/sdk/backend-v2";
import type { AppointmentDashboardResponseDto, LeadResponseDto } from "@/sdk/backend-v2";
import type { BookedPackageDto } from "@/sdk/backend-v2";
import {
  CalendarCheck2,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Hash,
  LogOut,
  Mail,
  Phone,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import useSWR from "swr";

/* ------------------------------------------------------------------
 * InfoRow — a single row inside the contact info grouped card.
 * Uses gradient icon tile (§4) + label/value layout (§3).
 * ------------------------------------------------------------------ */
function InfoRow({
  gradient,
  icon,
  label,
  value,
}: {
  gradient: string;
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div
        className={cn(
          "relative w-11 h-11 rounded-2xl bg-gradient-to-br flex-shrink-0",
          "flex items-center justify-center overflow-hidden shadow-[var(--sh-1)]",
          gradient,
        )}
      >
        <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white/10" />
        {icon}
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm font-medium text-foreground truncate">{value}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
 * StatTile — one appointment stat with a gradient icon tile (§4).
 * Three tiles sit side-by-side in a flex row.
 * ------------------------------------------------------------------ */
function StatTile({
  gradient,
  icon,
  label,
  value,
}: {
  gradient: string;
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="flex-1 rounded-2xl bg-card border border-border p-4 flex flex-col items-center gap-2 shadow-[var(--sh-1)]">
      <div
        className={cn(
          "relative w-11 h-11 rounded-2xl bg-gradient-to-br flex-shrink-0",
          "flex items-center justify-center overflow-hidden shadow-[var(--sh-1)]",
          gradient,
        )}
      >
        <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white/10" />
        {icon}
      </div>
      <span className="text-[22px] font-black text-foreground leading-none">{value}</span>
      <span className="text-xs text-muted-foreground text-center leading-tight">{label}</span>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { logout } = useAuth();

  const { profile: rawProfile, isLoading: profileLoading } = useAuthMe();
  const profile = rawProfile as LeadResponseDto;

  const phoneNumber = profile?.caller_mobile as string | undefined;
  const { data: dashboard, isLoading: dashLoading } = useSWR(
    phoneNumber ? ["appointments/dashboard", phoneNumber] : null,
    async ([, phone]: [string, string]) => {
      const { data, error } = await crmControllerGetAppointmentDashboard({
        query: { phoneNumber: phone },
      });
      if (error) throw error;
      return data as AppointmentDashboardResponseDto;
    },
  );

  const { packages: rawPackages, isLoading: packagesLoading } = useManagedPackages();

  const handleLogout = async () => {
    await logout();
    router.replace("/auth/login");
  };

  const displayName = (profile?.contact_name as string) || (profile?.partner_name as string) || "—";
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0])
    .join("")
    .toUpperCase();

  const upcomingCount = dashboard?.upcoming_appointments?.length ?? 0;
  const completedCount = dashboard?.completed_appointments?.length ?? 0;
  const totalCount = dashboard?.total_appointment_counts ?? 0;

  const bookedPackages = rawPackages as BookedPackageDto[];
  const pendingPayments = bookedPackages.filter((p) => p.package_stage === "booked");
  const activePackages = bookedPackages.filter(
    (p) => p.package_stage === "confirm" || p.package_stage === "in_progress",
  );
  const donePackages = bookedPackages.filter((p) => p.package_stage === "done");

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Flat header — BackButton + title per §1 */}
      <div className="flex items-center gap-2 px-4 pt-5 pb-3">
        <BackButton fallback="/home" />
        <h1 className="flex-1 text-lg font-bold text-foreground">My Profile</h1>
      </div>

      <div className="px-4 flex flex-col gap-5 max-w-md mx-auto w-full">
        {/* Avatar + name + patient ID */}
        <div className="flex flex-col items-center gap-2 pt-2 pb-1">
          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-background shadow-[var(--sh-3)] bg-primary/10 flex items-center justify-center">
            {profileLoading ? (
              <Skeleton className="w-full h-full rounded-full" />
            ) : initials ? (
              <span className="text-2xl font-black text-primary">{initials}</span>
            ) : (
              <User className="w-9 h-9 text-primary" />
            )}
          </div>
          {profileLoading ? (
            <>
              <Skeleton className="h-5 w-44 rounded-md" />
              <Skeleton className="h-4 w-28 rounded-md" />
            </>
          ) : (
            <>
              <h2 className="text-lg font-bold text-foreground text-center leading-tight">
                {displayName}
              </h2>
              {profile?.id && (
                <span className="text-xs text-muted-foreground">
                  Patient ID #{String(profile?.id)}
                </span>
              )}
            </>
          )}
        </div>

        {/* Contact info — grouped card with Separator per §3 */}
        <section className="mb-0">
          <h2 className="text-base font-bold text-foreground mb-3">Contact Info</h2>
          <Card>
            <CardContent className="py-0 px-3">
              {profileLoading ? (
                <div className="flex flex-col gap-3 py-4">
                  <Skeleton className="h-11 w-full rounded-2xl" />
                  <Skeleton className="h-11 w-full rounded-2xl" />
                  <Skeleton className="h-11 w-full rounded-2xl" />
                </div>
              ) : (
                <>
                  <InfoRow
                    gradient="from-sky-500 to-blue-600"
                    icon={<Phone className="w-5 h-5 text-white" />}
                    label="Mobile"
                    value={(profile?.caller_mobile as string) ?? "—"}
                  />
                  <Separator />
                  <InfoRow
                    gradient="from-violet-500 to-purple-600"
                    icon={<Mail className="w-5 h-5 text-white" />}
                    label="Email"
                    value={(profile?.email as string) || "Not provided"}
                  />
                  <Separator />
                  <InfoRow
                    gradient="from-teal-500 to-emerald-600"
                    icon={<Hash className="w-5 h-5 text-white" />}
                    label="Patient ID"
                    value={profile?.id ? `#${String(profile?.id)}` : "—"}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Appointment summary — three gradient stat tiles */}
        <section className="mb-0">
          <h2 className="text-base font-bold text-foreground mb-3">Appointment Summary</h2>
          {dashLoading ? (
            <div className="flex gap-3">
              <Skeleton className="h-28 flex-1 rounded-2xl" />
              <Skeleton className="h-28 flex-1 rounded-2xl" />
              <Skeleton className="h-28 flex-1 rounded-2xl" />
            </div>
          ) : (
            <div className="flex gap-3">
              <StatTile
                gradient="from-violet-500 to-purple-600"
                icon={<CalendarCheck2 className="w-5 h-5 text-white" />}
                label="Total"
                value={totalCount}
              />
              <StatTile
                gradient="from-orange-400 to-amber-500"
                icon={<CalendarClock className="w-5 h-5 text-white" />}
                label="Upcoming"
                value={upcomingCount}
              />
              <StatTile
                gradient="from-emerald-500 to-teal-600"
                icon={<CheckCircle2 className="w-5 h-5 text-white" />}
                label="Completed"
                value={completedCount}
              />
            </div>
          )}
        </section>

        {/* Pending payments */}
        {packagesLoading && (
          <section className="mb-0">
            <Skeleton className="h-4 w-36 rounded mb-3" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </section>
        )}

        {!packagesLoading && pendingPayments.length > 0 && (
          <section className="mb-0">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-4 h-4 text-amber-600" />
              <h2 className="text-base font-bold text-foreground">Pending Payments</h2>
            </div>
            <div className="flex flex-col gap-2">
              {pendingPayments.map((pkg) => (
                <PackageListCard key={pkg.booked_package_id} pkg={pkg} />
              ))}
            </div>
          </section>
        )}

        {!packagesLoading && activePackages.length > 0 && (
          <section className="mb-0">
            <h2 className="text-base font-bold text-foreground mb-3">Active Packages</h2>
            <div className="flex flex-col gap-2">
              {activePackages.map((pkg) => (
                <PackageListCard key={pkg.booked_package_id} pkg={pkg} />
              ))}
            </div>
          </section>
        )}

        {!packagesLoading && donePackages.length > 0 && (
          <section className="mb-0">
            <h2 className="text-base font-bold text-foreground mb-3">Completed Packages</h2>
            <div className="flex flex-col gap-2">
              {donePackages.map((pkg) => (
                <PackageListCard key={pkg.booked_package_id} pkg={pkg} />
              ))}
            </div>
          </section>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 mt-1">
          <Button
            variant="outline"
            className="w-full h-12 rounded-xl font-semibold"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                className="w-full h-12 rounded-xl font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action is permanent. All your data will be removed and cannot be recovered.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => toast.info("Please contact support to delete your account.")}
                >
                  Delete Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
