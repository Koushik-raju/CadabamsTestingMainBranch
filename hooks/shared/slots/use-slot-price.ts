import useSWR from 'swr';
import { crmControllerGetSlotPrice } from '@/sdk/backend-v2';
import { slotPriceKey } from '@/lib/swr-keys';

interface SlotPriceResult {
  price: number | null;
  isLoading: boolean;
  error: Error | undefined;
}

export function useSlotPrice(slotId: number | string | null): SlotPriceResult {
  const { data, error, isLoading } = useSWR(
    slotId !== null ? slotPriceKey(slotId) : null,
    async () => {
      const res = await crmControllerGetSlotPrice({ path: { id: Number(slotId) } });
      if (res.error) throw new Error(JSON.stringify(res.error));
      return res.data?.price ?? null;
    }
  );

  return {
    price: data ?? null,
    isLoading,
    error,
  };
}
