import { v4 as uuidv4 } from 'uuid';
import { crmClient } from '@/lib/api-client';
import { BASE_URL, ConsumerKey, AccessToken, OAuthSignature } from '@/config/env';
import type { User } from '@/types';

const ENDPOINTS = {
  LOGIN: `${BASE_URL}/crm_lead/login`,
  VERIFY_OTP: `${BASE_URL}/crm_lead/send_otp`,
  LEAD_CREATION: `${BASE_URL}/mobile/signup`,
  CHECK_EMAIL: `${BASE_URL}/check/caller/email`,
  UPDATE_USER_INFO: `${BASE_URL}/restapi/1.0/object/crm.lead`,
  SEND_SIGNUP_QUESTIONS: `${BASE_URL}/mobile/signup/details`,
  DELETE_ACCOUNT: `${BASE_URL}/delete/account`,
};

function getOAuthHeaders() {
  return {
    Authorization: `OAuth oauth_consumer_key="${ConsumerKey}", oauth_token="${AccessToken}", oauth_signature_method="PLAINTEXT", oauth_timestamp="${Math.floor(Date.now() / 1000)}", oauth_nonce="${Math.random().toString(36).substring(2)}", oauth_version="1.0", oauth_signature="${encodeURIComponent(OAuthSignature)}"`,
  };
}

export const authService = {
  async sendOtpAndCheckUserExist(
    phoneNumber: string,
    type = 'login',
    uid: string,
    countryCode: string | number,
    user_id: number = 1,
    email?: string
  ) {
    const res = await crmClient.post(ENDPOINTS.LOGIN, {
      type,
      phone_number: Number(phoneNumber),
      uid,
      country_code: Number(countryCode),
      email_id: email,
      user_id: Number(user_id),
    });
    if (res.data.result) {
      return { message: res.data.result.message, success: res.data.result.success };
    }
    return res.data;
  },

  async verifyOtp(phoneNumber: string, otp: string | number, uid: string, userID: number = 1) {
    const res = await crmClient.post(ENDPOINTS.VERIFY_OTP, {
      phone_number: Number(phoneNumber),
      uid,
      otp: Number(otp),
      user_id: Number(userID),
    });
    return res.data;
  },

  async createUser({
    firstName, lastName, email, phoneNumber, otp, uid, countryCode, userID = 1,
  }: {
    firstName: string; lastName: string; email: string; phoneNumber: string;
    otp: string; uid: string; countryCode: string | number; userID?: number;
  }) {
    const res = await crmClient.post(
      ENDPOINTS.LEAD_CREATION,
      { f_name: firstName, l_name: lastName, email_id: email, mobile: phoneNumber, otp, uid, country_code: countryCode },
      { params: { user_id: userID } }
    );
    const result = res.data.result;
    if (result?.success) {
      return {
        success: true,
        data: { caller_mobile: phoneNumber, caller_name: `${firstName} ${lastName}`, lead_id: result.lead_id, caller_email: email },
      };
    }
    if (result?.message === 'Lead already exists') {
      return { success: false, message: 'User already exists. Please login.' };
    }
    return { success: false, message: result?.message || 'Signup failed' };
  },

  async checkEmailValidity(phoneNumber: string, uid: string, userID: number = 1) {
    const res = await crmClient.get(ENDPOINTS.CHECK_EMAIL, {
      params: { phone_number: phoneNumber, uid, user_id: userID },
    });
    return res.data;
  },

  async updateUserEmail(leadId: string | number, email: string, uid: string, userID: number = 1) {
    const res = await crmClient.put(ENDPOINTS.UPDATE_USER_INFO, null, {
      params: { ids: leadId, vals: `{'caller_email':'${email}'}`, user_id: userID, uid },
    });
    return res.data;
  },

  async sendSignupQuestions(data: Record<string, unknown>) {
    const res = await crmClient.post(ENDPOINTS.SEND_SIGNUP_QUESTIONS, data);
    return res.data;
  },

  getCurrentUser(): User | null {
    try {
      if (typeof window === 'undefined') return null;
      const raw = localStorage.getItem('user');
      if (!raw) return null;
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },

  async updatePatientName(leadId: string | number, name: string, userID: number = 1) {
    const vals = JSON.stringify({ caller_name: name, patient_name: name, partner_name: name });
    const res = await crmClient.put(ENDPOINTS.UPDATE_USER_INFO, null, {
      params: { ids: leadId, vals, user_id: userID },
    });
    return res.data;
  },

  async deleteAccount(leadId: string | number, userID: number = 1) {
    const res = await crmClient.post(ENDPOINTS.DELETE_ACCOUNT, {
      lead_id: leadId,
      user_id: userID,
    });
    return res.data;
  },
};

export function saveAuthData(data: Record<string, unknown>) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('loginData', JSON.stringify(data));
  }
}

export function clearAuthData() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('loginData');
    localStorage.removeItem('mobileNumber');
    localStorage.removeItem('userLogin');
  }
}

export function getAuthData(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}
