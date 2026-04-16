import useSWR from 'swr';
import {
  crmControllerGetAllPackages,
  crmControllerGetUserPackages,
  crmControllerGetPackageProductLines,
  crmControllerBookPackage,
  crmControllerRazorpayPackagePayment,
} from '@/sdk/backend-v2';
import type { PackageResponseDto, BookedPackageDto, PackageProductLineDto } from '@/sdk/backend-v2';
import {
  availablePackagesKey,
  managedPackagesKey,
  packageProductLinesKey,
} from '@/lib/swr-keys';
import { useAuth } from '@/hooks/shared/auth/use-auth';

// ── SWR hooks ──────────────────────────────────────────────────────────────

export function useAvailablePackages() {
  const { data, isLoading, error, mutate } = useSWR(
    availablePackagesKey(),
    async () => {
      const res = await crmControllerGetAllPackages();
      return (res.data as PackageResponseDto[] | undefined) ?? [];
    }
  );
  return { packages: data ?? [], isLoading, error, mutate };
}

export function useManagedPackages() {
  const { user } = useAuth();
  const leadId = user?.lead_id ? Number(user.lead_id) : null;

  const { data, isLoading, error, mutate } = useSWR(
    leadId ? managedPackagesKey() : null,
    async () => {
      const res = await crmControllerGetUserPackages({ query: { leadId: leadId! } });
      return (res.data as BookedPackageDto[] | undefined) ?? [];
    }
  );
  return { packages: data ?? [], isLoading, error, mutate };
}

export function usePackageProductLines(packageId?: number) {
  const { data, isLoading, error } = useSWR(
    packageProductLinesKey(packageId),
    async () => {
      const res = await crmControllerGetPackageProductLines(
        packageId ? { query: { packageId } } : undefined
      );
      return (res.data as PackageProductLineDto[] | undefined) ?? [];
    }
  );
  return { lines: data ?? [], isLoading, error };
}

// ── Mutation helpers ────────────────────────────────────────────────────────

export async function bookPackage(
  data: Record<string, unknown>
): Promise<{ booking_id: number; message: string }> {
  const res = await crmControllerBookPackage({ body: { data } });
  const result = res.data as { booked_package_id?: number; message?: string; success?: boolean } | undefined;
  if (!result?.booked_package_id) throw new Error(result?.message ?? 'No booking ID returned.');
  return { booking_id: result.booked_package_id, message: result.message ?? '' };
}

export async function initiatePackagePayment(opts: {
  leadBookedPackageId: number;
  leadId: number;
  campusId?: number;
}): Promise<{ razorpay_order_id: string; amount: number; key_id: string }> {
  const res = await crmControllerRazorpayPackagePayment({
    body: {
      booked_package_id: opts.leadBookedPackageId,
      lead_id: opts.leadId,
      campus_id: opts.campusId ?? 0,
    },
  });
  const d = res.data as { razorpay_order_id?: string; amount?: number; key_id?: string } | undefined;
  if (!d?.razorpay_order_id) throw new Error('Payment initiation failed.');
  return d as { razorpay_order_id: string; amount: number; key_id: string };
}
