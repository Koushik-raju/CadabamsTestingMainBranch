'use client';

import { useState } from 'react';
import { sendPatientOtp, verifyPatientLogin, verifyPatientSignup, logoutPatient } from '@/lib/auth';

export interface SignupPayload {
  phone: string;
  otp: string;
  firstName: string;
  lastName?: string;
  email?: string;
  countryCode?: number;
}

export function useAuthActions() {
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [sessionUid, setSessionUid] = useState<string | null>(null);

  const sendOtp = async (phone: string, type: 'login' | 'signup') => {
    setIsSendingOtp(true);
    try {
      const data = await sendPatientOtp(phone, type);
      setSessionUid(data.uid);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const verifyLogin = async (phone: string, otp: string) => {
    setIsVerifying(true);
    try {
      await verifyPatientLogin(phone, otp, sessionUid ?? '');
    } finally {
      setIsVerifying(false);
    }
  };

  const verifySignup = async (payload: SignupPayload) => {
    setIsVerifying(true);
    try {
      await verifyPatientSignup({
        ...payload,
        lastName: payload.lastName ?? '',
        uid: sessionUid ?? '',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const logout = async () => {
    await logoutPatient();
  };

  return { sendOtp, verifyLogin, verifySignup, logout, isSendingOtp, isVerifying };
}
