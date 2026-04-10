import useSWR from 'swr';
import { getAppointmentsSlotsBySlotIdPrice } from '@/sdk/auth-and-crm';
import { slotPriceKey } from '@/lib/swr-keys';

interface SlotPriceResult {
  price: number | null;
  isLoading: boolean;
  error: Error | undefined;
}

export function useSlotPrice(slotId: number | string | null): SlotPriceResult {
  const { data, error, isLoading } = useSWR(
    slotId !== null ? slotPriceKey(slotId) : null,
    () =>
      getAppointmentsSlotsBySlotIdPrice({ path: { slotId: Number(slotId) } }).then(
        (res) => {
          if (res.error) throw new Error(JSON.stringify(res.error));
          return res.data?.price ?? null;
        }
      )
  );

  return {
    price: data ?? null,
    isLoading,
    error,
  };
}
