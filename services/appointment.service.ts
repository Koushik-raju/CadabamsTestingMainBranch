import { crmClient } from '@/lib/api-client';
import { endpoints } from '@/config/api-endpoints';

export const appointmentService = {
  async getAppointments(leadId: string | number) {
    const res = await crmClient.get(endpoints.GET_APPOINTMENT_DETAILS, {
      params: { lead_id: leadId },
    });
    return res.data;
  },

  async getPreviousAppointments(leadId: string | number) {
    const res = await crmClient.get(endpoints.GET_PREVIOUS_APPOINTMENT, {
      params: { domain: `[('lead_id','=',${leadId})]` },
    });
    return res.data;
  },

  async bookAppointment(data: Record<string, unknown>) {
    const res = await crmClient.post(endpoints.BOOK_INDIVIDUAL_APPOINTMENT, data);
    return res.data;
  },

  async cancelAppointment(data: Record<string, unknown>) {
    const res = await crmClient.post(endpoints.CANCEL_APPOINTMENT, data);
    return res.data;
  },

  async getTimeSlots(params: Record<string, unknown>) {
    const res = await crmClient.get(endpoints.GET_TIME_SLOT, { params });
    return res.data;
  },

  async getSlotPrice(params: Record<string, unknown>) {
    const res = await crmClient.get(endpoints.GET_SLOT_PRICE, { params });
    return res.data;
  },

  async getFollowUpDetails(params: Record<string, unknown>) {
    const res = await crmClient.get(endpoints.FOLLOWUP_ENDPOINT, { params });
    return res.data;
  },
};
