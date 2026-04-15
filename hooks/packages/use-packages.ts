import useSWR from 'swr';
import {
  crmControllerGetAllPackages,
  crmControllerGetUserPackages,
  crmControllerGetPackageProductLines,
  crmControllerBookPackage,
  crmControllerRazorpayPackagePayment,
} from '@/sdk/backend-v2';
import type { BookedPackageDto, PackageProductLineDto } from '@/sdk/backend-v2';
import {
  availablePackagesKey,
  managedPackagesKey,
  packageProductLinesKey,
} from '@/lib/swr-keys';
import { useAuth } from '@/hooks/shared/auth/use-auth';

// ── Local type definitions matching what pages/components expect ──────────────

export type AvailablePackage = {
  id: number;
  package_name: string;
  amount_total: number;
  service_id?: [number | string, number | string];
  package_product_ids?: Array<number>;
  journey_id?: string | number | null;
  journey_document_id?: string | null;
  duration?: number;
  package_duration?: number;
  [key: string]: unknown;
};

// BookedPackage keeps the tuple-style package_id for backward compatibility with pages
export type BookedPackage = {
  booked_package_id: number;
  package_id: [number | string, number | string];
  package_stage: 'booked' | 'confirm' | 'in_progress' | 'done' | string;
  package_cost: number;
  lead_id: number;
  date: string;
  campus_id?: [number | string, number | string];
  caller_name?: string;
  patient_name?: string;
  sequence_booking?: boolean;
  lines?: Array<unknown>;
  journey_id?: string | number | null;
};

export type PackageProductLine = {
  id: number;
  product_id: [number | string, number | string];
  sequence_no?: number;
  price_unit?: number;
  price_subtotal?: number;
  discount?: number;
};

function mapBookedPackage(dto: BookedPackageDto): BookedPackage {
  return {
    booked_package_id: dto.id,
    package_id: [dto.package_id, dto.package_name],
    package_stage: dto.status ?? 'booked',
    package_cost: 0, // not provided in new DTO
    lead_id: dto.lead_id,
    date: dto.start_date ?? '',
    lines: [],
  };
}

function mapProductLine(dto: PackageProductLineDto): PackageProductLine {
  return {
    id: dto.id,
    product_id: [dto.product_id, dto.product_name],
    sequence_no: undefined,
    price_unit: dto.price,
    price_subtotal: dto.total_price,
    discount: undefined,
  };
}

// ── SWR hooks ──────────────────────────────────────────────────────────────

export function useAvailablePackages() {
  const { data, isLoading, error, mutate } = useSWR(
    availablePackagesKey(),
    async () => {
      const res = await crmControllerGetAllPackages();
      const items = (res.data as Array<{ result?: Record<string, unknown> }> | undefined) ?? [];
      return items.map((dto) => (dto.result ?? {}) as AvailablePackage);
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
      return ((res.data as BookedPackageDto[] | undefined) ?? []).map(mapBookedPackage);
    }
  );
  return { packages: data ?? [], isLoading, error, mutate };
}

export function usePackageProductLines(packageId?: number) {
  const { data, isLoading, error } = useSWR(
    packageProductLinesKey(),
    async () => {
      const res = await crmControllerGetPackageProductLines(
        packageId ? { query: { packageId } } : undefined
      );
      return ((res.data as PackageProductLineDto[] | undefined) ?? []).map(mapProductLine);
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
  uid: string;
}): Promise<{ razorpay_order_id: string; amount: number; key_id: string }> {
  const res = await crmControllerRazorpayPackagePayment({
    body: {
      lead_booked_package_id: opts.leadBookedPackageId,
      lead_id: opts.leadId,
      uid: opts.uid,
    },
  });
  const d = res.data as { razorpay_order_id?: string; amount?: number; key_id?: string } | undefined;
  if (!d?.razorpay_order_id) throw new Error('Payment initiation failed.');
  return d as { razorpay_order_id: string; amount: number; key_id: string };
}
