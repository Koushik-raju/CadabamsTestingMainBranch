import { backendClient } from '@/lib/api-client';
import { endpoints } from '@/config/api-endpoints';

export const chatService = {
  async saveChat(data: Record<string, unknown>) {
    const res = await backendClient.post(endpoints.saveChat, data);
    return res.data;
  },

  async fetchChats(params: Record<string, unknown>) {
    const res = await backendClient.get(endpoints.fetchChat, { params });
    return res.data;
  },

  async saveLog(data: Record<string, unknown>) {
    const res = await backendClient.post(endpoints.saveLog, data);
    return res.data;
  },

  async saveAssessment(data: Record<string, unknown>) {
    const res = await backendClient.post(endpoints.saveAssessment, data);
    return res.data;
  },

  async fetchAssessments(params: Record<string, unknown>) {
    const res = await backendClient.get(endpoints.fetchAssessment, { params });
    return res.data;
  },

  async getAssignments(params: Record<string, unknown>) {
    const res = await backendClient.get(endpoints.getAssignments, { params });
    return res.data;
  },
};
