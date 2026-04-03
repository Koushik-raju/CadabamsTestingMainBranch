import { crmClient } from '@/lib/api-client';
import { endpoints } from '@/config/api-endpoints';

export const paymentService = {
  async createRazorpayOrder(data: Record<string, unknown>) {
    const res = await crmClient.post(endpoints.RAZORPAY_ORDER_URL, data);
    return res.data;
  },

  async razorpayCallback(data: Record<string, unknown>) {
    const res = await crmClient.post(endpoints.RAZORPAY_PAYMENT_CALLBACK, data);
    return res.data;
  },

  async getPaymentDetails(params: Record<string, unknown>) {
    const res = await crmClient.get(endpoints.GET_PAYMENT_VALS, { params });
    return res.data;
  },

  async getPaymentStatus(params: Record<string, unknown>) {
    const res = await crmClient.get(endpoints.GET_PAYMENT_STATUS, { params });
    return res.data;
  },
};
