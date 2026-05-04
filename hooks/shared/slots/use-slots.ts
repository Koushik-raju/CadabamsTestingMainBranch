import useSWR from "swr";
import { slotsKey } from "@/lib/swr-keys";
import type { SlotResponseDto } from "@/sdk/backend-v2";
import { crmControllerGetSlots } from "@/sdk/backend-v2";

interface UseSlotsResult {
  slots: SlotResponseDto[];
  isLoading: boolean;
  error: Error | undefined;
}

export function useSlots(
  doctorId: number | string | null,
  consultTypeId: number | null,
): UseSlotsResult {
  const shouldFetch = doctorId !== null && consultTypeId !== null;

  const { data, error, isLoading } = useSWR(
    shouldFetch ? slotsKey(doctorId!, consultTypeId!) : null,
    async () => {
      const res = await crmControllerGetSlots({
        query: {
          doctor_id: Number(doctorId),
          availability: "open",
        },
      });
      if (res.error) throw new Error(JSON.stringify(res.error));
      return res.data ?? [];
    },
  );

  return {
    slots: Array.isArray(data) ? data : [],
    isLoading,
    error,
  };
}
