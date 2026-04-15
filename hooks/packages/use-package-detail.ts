import useSWR from 'swr';
import { crmControllerGetPackageProductDetails } from '@/sdk/backend-v2';
import type { PackageProductLineDto } from '@/sdk/backend-v2';
import { packageByIdKey } from '@/lib/swr-keys';
import type { PackageProductLine } from './use-packages';

export type { PackageProductLine };

export function usePackageDetail(packageId: number | string | null) {
  const { data, isLoading, error } = useSWR(
    packageId != null ? packageByIdKey(packageId) : null,
    async () => {
      const res = await crmControllerGetPackageProductDetails({ path: { id: Number(packageId) } });
      const lines = (res.data as PackageProductLineDto[] | undefined) ?? [];
      return lines.map((dto) => ({
        id: dto.id,
        product_id: [dto.product_id, dto.product_name] as [number | string, number | string],
        price_unit: dto.price,
        price_subtotal: dto.total_price,
      })) as PackageProductLine[];
    }
  );
  return { lines: data ?? [], isLoading, error };
}
