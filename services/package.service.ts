import { crmClient } from '@/lib/api-client';
import { endpoints } from '@/config/api-endpoints';

export const packageService = {
  async getAllPackages(params?: Record<string, unknown>) {
    const res = await crmClient.get(endpoints.GET_ALL_PACKAGES, { params });
    return res.data;
  },

  async getFilteredPackages(params?: Record<string, unknown>) {
    const res = await crmClient.get(endpoints.GET_FILTERED_PACKAGES, { params });
    return res.data;
  },

  async bookPackage(data: Record<string, unknown>) {
    const res = await crmClient.post(endpoints.BOOK_A_PACKAGE, data);
    return res.data;
  },

  async confirmPackage(data: Record<string, unknown>) {
    const res = await crmClient.post(endpoints.CONFIRM_THE_PACKAGE, data);
    return res.data;
  },

  async managedBookedPackages(leadId: string | number) {
    const res = await crmClient.get(endpoints.MANAGE_BOOKED_PACKAGES, {
      params: { lead_id: leadId },
    });
    return res.data;
  },

  async getProductList() {
    const res = await crmClient.get(endpoints.GET_PRODUCT_LIST);
    return res.data;
  },
};
