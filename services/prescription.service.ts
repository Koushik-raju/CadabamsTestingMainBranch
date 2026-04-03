import { crmClient, hosClient } from '@/lib/api-client';
import { endpoints } from '@/config/api-endpoints';
import { BASE_URL, BASE_URL_HOS } from '@/config/env';
import type { Prescription, MedicineLineItem } from '@/types/package';

export const prescriptionService = {
  async fetchPrescriptions(leadId: string | number): Promise<Prescription[]> {
    const res = await crmClient.get(`${BASE_URL}/prescription/fetch/${leadId}`);
    const data = res.data as {
      status?: string;
      prescriptions?: Array<{ data?: Prescription[] }>;
    };
    if (data?.status === 'success' && data.prescriptions?.[0]?.data) {
      return data.prescriptions[0].data;
    }
    return [];
  },

  async fetchMedicineLineItems(ids: number[]): Promise<MedicineLineItem[]> {
    if (!ids.length) return [];
    const domain = `[('id','in',[${ids.join(',')}])]`;
    const res = await hosClient.get(endpoints.GET_MEDICINE_LINE_ITEMS, {
      params: { domain, fields: '[]', page: 1, per_page: 50 },
    });
    const data = res.data as Record<string, unknown>;
    const raw = data['oeh.medical.prescription.line'];
    return Array.isArray(raw) ? (raw as MedicineLineItem[]) : raw ? [raw as MedicineLineItem] : [];
  },

  async downloadPrescription(prescriptionId: number): Promise<void> {
    const url = `${BASE_URL_HOS}/download/prescription/form/${prescriptionId}`;
    // Open the download URL in a new tab
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  },
};
