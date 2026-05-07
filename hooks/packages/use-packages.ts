import useSWR from "swr";
import { useAuth } from "@/hooks/shared/auth/use-auth";
import {
  availablePackagesKey,
  managedPackagesKey,
  packageProductDetailsKey,
  packageProductLinesKey,
} from "@/lib/swr-keys";
import type {
  BookPackageResultDto,
  CrmBookPackageDto,
  RazorpayPaymentEnvelopeDto,
} from "@/sdk/backend-v2";
import {
  crmControllerBookPackage,
  crmControllerGetAllPackages,
  crmControllerGetPackageProductDetails,
  crmControllerGetPackageProductLines,
  crmControllerGetUserPackages,
  crmControllerRazorpayPackagePayment,
} from "@/sdk/backend-v2";

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

export async function bookPackage(data: CrmBookPackageDto): Promise<BookPackageResultDto> {
  const res = await crmControllerBookPackage({ body: data });
  if (!res.data?.booking_id) throw new Error(res.data?.message ?? "No booking ID returned.");
  return res.data;
}

export async function initiatePackagePayment(opts: {
  leadBookedPackageId: number;
  leadId: number;
  campusId?: number;
}): Promise<RazorpayPaymentEnvelopeDto> {
  // Odoo rejects campus_id 0 (see payments.dto / ERP); must match the campus used when booking.
  const campusId = opts.campusId ?? 1;
  const res = await crmControllerRazorpayPackagePayment({
    body: {
      booked_package_id: opts.leadBookedPackageId,
      lead_id: opts.leadId,
      campus_id: campusId,
    },
  });

  if (process.env.NODE_ENV === "development") {
    console.group("[Razorpay package payment] POST /api/v1/crm/payments/razorpay-package");
    console.log("request body:", {
      booked_package_id: opts.leadBookedPackageId,
      lead_id: opts.leadId,
      campus_id: campusId,
    });
    const ax = res as {
      status?: number;
      statusText?: string;
      data?: RazorpayPaymentEnvelopeDto;
      error?: unknown;
    };
    console.log("httpStatus:", ax.status, ax.statusText ?? "");
    if (ax.data !== undefined) {
      console.log("response.data (envelope from backend / CRM):", ax.data);
      const result = ax.data.result as Record<string, unknown> | undefined;
      if (result && typeof result === "object") {
        console.log("result.short_url:", result.short_url);
        console.log("result.id (payment link id, if any):", result.id);
      }
    }
    if (ax.error !== undefined) {
      console.warn("client error object:", ax.error);
    }
    console.groupEnd();
  }

  if (!res.data) throw new Error("Payment initiation failed.");
  return res.data;
}
