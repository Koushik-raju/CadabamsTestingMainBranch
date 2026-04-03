import { crmClient } from '@/lib/api-client';
import { endpoints } from '@/config/api-endpoints';

export const doctorService = {
  async getDoctors(params?: Record<string, unknown>) {
    const res = await crmClient.get(endpoints.GET_DOCTOR_LIST, { params });
    return res.data;
  },

  async getSpecialties() {
    const res = await crmClient.get(endpoints.GET_SPECIALTY_LIST);
    return res.data;
  },

  async getIllnesses() {
    const res = await crmClient.get(endpoints.GET_ILLNESSES);
    return res.data;
  },

  async getLanguages() {
    const res = await crmClient.get(endpoints.GET_LANGUAGES);
    return res.data;
  },

  async getAgePreferences() {
    const res = await crmClient.get(endpoints.GET_AGE_PREFERENCES);
    return res.data;
  },

  async getCns() {
    const res = await crmClient.get(endpoints.GET_CNS);
    return res.data;
  },

  async getCities() {
    const res = await crmClient.get(endpoints.GET_CITIES);
    return res.data;
  },

  async getAreas() {
    const res = await crmClient.get(endpoints.GET_AREAS);
    return res.data;
  },

  async getLocationCenters() {
    const res = await crmClient.get(endpoints.GET_LOCATION_CENTER);
    return res.data;
  },

  async getSubCampus() {
    const res = await crmClient.get(endpoints.GET_SUB_CAMPUS);
    return res.data;
  },
};
