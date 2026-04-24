import { useAuth } from "@/hooks/shared/auth/use-auth";
import {
  availablePackagesKey,
  managedPackagesKey,
  packageProductDetailsKey,
  packageProductLinesKey,
} from "@/lib/swr-keys";
import {
  crmControllerBookPackage,
  crmControllerGetAllPackages,
  crmControllerGetPackageProductDetails,
  crmControllerGetPackageProductLines,
  crmControllerGetUserPackages,
  crmControllerRazorpayPackagePayment,
} from "@/sdk/backend-v2";
import type { BookPackageResultDto, RazorpayPaymentEnvelopeDto } from "@/sdk/backend-v2";
import useSWR from "swr";

// ── SWR hooks ──────────────────────────────────────────────────────────────

export function useAvailablePackages() {
  const { data, isLoading, error, mutate } = useSWR(availablePackagesKey(), async () => {
    const res = await crmControllerGetAllPackages();
    return res.data ?? [];
  });
  return { packages: data ?? [], isLoading, error, mutate };
}

export function useManagedPackages() {
  const { user } = useAuth();
  const leadId = user?.lead_id ? Number(user.lead_id) : null;

  const { data, isLoading, error, mutate } = useSWR(
    leadId ? managedPackagesKey() : null,
    async () => {
      const res = await crmControllerGetUserPackages({ query: { leadId: leadId! } });
      return res.data ?? [];
    },
  );
  return { packages: data ?? [], isLoading, error, mutate };
}

export function usePackageProductLines(packageId?: number) {
  const { data, isLoading, error } = useSWR(packageProductLinesKey(packageId), async () => {
    const res = await crmControllerGetPackageProductLines(
      packageId ? { query: { packageId } } : undefined,
    );
    return res.data ?? [];
  });
  return { lines: data ?? [], isLoading, error };
}

export function usePackageProductDetails(packageId: number) {
  const { data, isLoading, error } = useSWR(packageProductDetailsKey(packageId), async () => {
    const res = await crmControllerGetPackageProductDetails({ path: { id: packageId } });
    return res.data ?? [];
  });
  return { lines: data ?? [], isLoading, error };
}

// ── Mutation helpers ────────────────────────────────────────────────────────

export async function bookPackage(data: Record<string, unknown>): Promise<BookPackageResultDto> {
  const res = await crmControllerBookPackage({ body: { data } });
  if (!res.data?.booking_id) throw new Error(res.data?.message ?? "No booking ID returned.");
  return res.data;
}

export async function initiatePackagePayment(opts: {
  leadBookedPackageId: number;
  leadId: number;
  campusId?: number;
}): Promise<RazorpayPaymentEnvelopeDto> {
  const res = await crmControllerRazorpayPackagePayment({
    body: {
      booked_package_id: opts.leadBookedPackageId,
      lead_id: opts.leadId,
      campus_id: opts.campusId ?? 0,
    },
  });
  if (!res.data) throw new Error("Payment initiation failed.");
  return res.data;
}
