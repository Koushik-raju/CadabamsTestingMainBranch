"use client";

import { useRouter } from "next/navigation";
import useSWR from "swr";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  LogOut,
  User,
  Phone,
  Mail,
  Hash,
  CalendarCheck2,
  CalendarClock,
  CheckCircle2,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useAuth } from "@/hooks/use-auth";
import { crmControllerGetAppointmentDashboard } from "@/sdk/backend-v2";
import type { AppointmentDashboardResponseDto } from "@/sdk/backend-v2";
import { PackageListCard } from "@/components/package/package-list-card";
import { useManagedPackages } from "@/hooks/packages/use-packages";
import { useAuthMe } from "@/hooks/shared/auth/use-auth";
import type { BookedPackage } from "@/types/package";


function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 py-3.5 border-b border-border last:border-0">
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
        <span className="text-[14px] font-semibold text-foreground truncate">
          {value}
        </span>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="flex-1 rounded-2xl bg-card border border-border p-4 flex flex-col items-center gap-1.5 shadow-sm">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <span className="text-[22px] font-black text-foreground leading-none">
        {value}
      </span>
      <span className="text-[11px] font-medium text-muted-foreground text-center leading-tight">
        {label}
      </span>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { logout } = useAuth();

  const { profile: rawProfile, isLoading: profileLoading } = useAuthMe();
  const profile = rawProfile as Record<string, unknown> | null;

  const phoneNumber = profile?.caller_mobile as string | undefined;
  const { data: dashboard, isLoading: dashLoading } = useSWR(
    phoneNumber ? ["appointments/dashboard", phoneNumber] : null,
    async ([, phone]: [string, string]) => {
      const { data, error } = await crmControllerGetAppointmentDashboard({ query: { phoneNumber: phone } });
      if (error) throw error;
      return data as AppointmentDashboardResponseDto;
    }
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

  const upcomingCount = dashboard?.upcomingCount ?? 0;
  const completedCount = dashboard?.pastCount ?? 0;
  const totalCount = (dashboard?.upcomingCount ?? 0) + (dashboard?.pastCount ?? 0) + (dashboard?.cancelledCount ?? 0);

  const bookedPackages = rawPackages as BookedPackage[];
  const pendingPayments = bookedPackages.filter((p) => p.package_stage === "booked");
  const activePackages = bookedPackages.filter(
    (p) => p.package_stage === "confirm" || p.package_stage === "in_progress"
  );
  const donePackages = bookedPackages.filter((p) => p.package_stage === "done");

  return (
    <div className="min-h-screen flex flex-col bg-background pb-10">
      {/* Gradient Header */}
      <div className="home-header-gradient px-4 pt-12 pb-20 text-white relative">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => router.back()}
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">My Profile</h1>
        </div>
      </div>

      {/* Avatar — overlaps gradient */}
      <div className="flex justify-center mt-[-44px] mb-2 z-10 relative">
        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-background shadow-xl bg-primary/20 flex items-center justify-center">
          {profileLoading ? (
            <Skeleton className="w-full h-full rounded-full" />
          ) : initials ? (
            <span className="text-3xl font-black text-primary">{initials}</span>
          ) : (
            <User className="w-10 h-10 text-primary" />
          )}
        </div>
      </div>

      {/* Name + ID pill */}
      <div className="flex flex-col items-center gap-1 mb-6 px-4">
        {profileLoading ? (
          <>
            <Skeleton className="h-6 w-40 rounded-md" />
            <Skeleton className="h-4 w-24 rounded-md" />
          </>
        ) : (
          <>
            <h2 className="text-[20px] font-black text-foreground text-center leading-tight">
              {displayName}
            </h2>
            {profile?.id && (
              <span className="text-[12px] font-medium text-muted-foreground">
                Patient ID #{String(profile.id)}
              </span>
            )}
          </>
        )}
      </div>

      <div className="flex flex-col gap-4 px-4 max-w-md mx-auto w-full">
        {/* Contact Info Card */}
        <div className="bg-card rounded-2xl border border-border shadow-sm px-4 py-1">
          {profileLoading ? (
            <div className="flex flex-col gap-3 py-4">
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          ) : (
            <>
              <InfoRow
                icon={<Phone className="w-4 h-4 text-primary" />}
                label="Mobile"
                value={(profile?.caller_mobile as string) ?? "—"}
              />
              <InfoRow
                icon={<Mail className="w-4 h-4 text-primary" />}
                label="Email"
                value={(profile?.caller_email as string) || "Not provided"}
              />
              <InfoRow
                icon={<Hash className="w-4 h-4 text-primary" />}
                label="Patient ID"
                value={profile?.id ? `#${String(profile.id)}` : "—"}
              />
            </>
          )}
        </div>

        {/* Appointment Stats */}
        <div>
          <p className="text-[13px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-1">
            Appointment Summary
          </p>
          {dashLoading ? (
            <div className="flex gap-3">
              <Skeleton className="h-24 flex-1 rounded-2xl" />
              <Skeleton className="h-24 flex-1 rounded-2xl" />
              <Skeleton className="h-24 flex-1 rounded-2xl" />
            </div>
          ) : (
            <div className="flex gap-3">
              <StatCard
                icon={<CalendarCheck2 className="w-4 h-4 text-violet-600" />}
                label="Total"
                value={totalCount}
                color="bg-violet-100"
              />
              <StatCard
                icon={<CalendarClock className="w-4 h-4 text-amber-600" />}
                label="Upcoming"
                value={upcomingCount}
                color="bg-amber-100"
              />
              <StatCard
                icon={<CheckCircle2 className="w-4 h-4 text-green-600" />}
                label="Completed"
                value={completedCount}
                color="bg-green-100"
              />
            </div>
          )}
        </div>

        {/* Pending Payments */}
        {packagesLoading && (
          <div>
            <Skeleton className="h-4 w-36 rounded mb-2" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>
        )}

        {!packagesLoading && pendingPayments.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2 px-1">
              <CreditCard className="w-3.5 h-3.5 text-amber-600" />
              <p className="text-[13px] font-bold text-amber-600 uppercase tracking-widest">
                Pending Payments
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {pendingPayments.map((pkg) => (
                <PackageListCard key={pkg.booked_package_id} pkg={pkg} />
              ))}
            </div>
          </div>
        )}

        {/* Active Packages */}
        {!packagesLoading && activePackages.length > 0 && (
          <div>
            <p className="text-[13px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-1">
              Active Packages
            </p>
            <div className="flex flex-col gap-2">
              {activePackages.map((pkg) => (
                <PackageListCard key={pkg.booked_package_id} pkg={pkg} />
              ))}
            </div>
          </div>
        )}

        {/* Completed Packages */}
        {!packagesLoading && donePackages.length > 0 && (
          <div>
            <p className="text-[13px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-1">
              Completed Packages
            </p>
            <div className="flex flex-col gap-2">
              {donePackages.map((pkg) => (
                <PackageListCard key={pkg.booked_package_id} pkg={pkg} />
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 mt-2">
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
                  This action is permanent. All your data will be removed and
                  cannot be recovered.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() =>
                    toast.info("Please contact support to delete your account.")
                  }
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
