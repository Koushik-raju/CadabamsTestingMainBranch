'use client';

import useSWR from 'swr';
import {
  getPackages,
  getPackagesManaged,
  getPackagesProductLines,
  postPackagesBook,
  postPaymentsPackage,
} from '@/sdk/auth-and-crm';
import type { PostPackagesBookData, PostPaymentsPackageData } from '@/sdk/auth-and-crm';
import { availablePackagesKey, managedPackagesKey, packageProductLinesKey } from '@/lib/swr-keys';
import type { AvailablePackage, BookedPackage, PackageProductLine } from '@/types/package';

// ── SWR hooks ──────────────────────────────────────────────────────────────

export function useAvailablePackages() {
  const { data, isLoading, error, mutate } = useSWR(
    availablePackagesKey(),
    () => getPackages().then((r) => (r.data ?? []) as AvailablePackage[])
  );
  return { packages: data ?? [], isLoading, error, mutate };
}

export function useManagedPackages() {
  const { data, isLoading, error, mutate } = useSWR(
    managedPackagesKey(),
    () => getPackagesManaged().then((r) => (r.data ?? []) as BookedPackage[])
  );
  return { packages: data ?? [], isLoading, error, mutate };
}

export function usePackageProductLines() {
  const { data, isLoading, error } = useSWR(
    packageProductLinesKey(),
    () => getPackagesProductLines().then((r) => (r.data ?? []) as PackageProductLine[])
  );
  return { lines: data ?? [], isLoading, error };
}

// ── Mutation helpers ────────────────────────────────────────────────────────

export async function bookPackage(
  body: PostPackagesBookData['body']
): Promise<{ booking_id: number; message: string }> {
  const res = await postPackagesBook({ body });
  if (res.error) throw new Error(JSON.stringify(res.error));
  if (!res.data?.booking_id) throw new Error('No booking ID returned.');
  return res.data as { booking_id: number; message: string };
}

export async function initiatePackagePayment(
  body: PostPaymentsPackageData['body']
): Promise<string> {
  const res = await postPaymentsPackage({ body });
  if (res.error) throw new Error(JSON.stringify(res.error));
  const url = res.data?.result?.short_url;
  if (!url) throw new Error('No payment URL received.');
  return url;
}
