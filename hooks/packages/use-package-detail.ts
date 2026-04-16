import useSWR from 'swr';
import { crmControllerGetPackageProductDetails } from '@/sdk/backend-v2';
import type { PackageProductLineDto } from '@/sdk/backend-v2';
import { packageByIdKey } from '@/lib/swr-keys';

export function usePackageDetail(packageId: number | string | null) {
  const { data, isLoading, error } = useSWR(
    packageId != null ? packageByIdKey(packageId) : null,
    async () => {
      const res = await crmControllerGetPackageProductDetails({ path: { id: Number(packageId) } });
      return (res.data as PackageProductLineDto[] | undefined) ?? [];
    }
  );
  return { lines: data ?? [], isLoading, error };
}
