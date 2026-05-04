/**
 * FILE: hooks/use-auth-actions.ts
 *
 * PURPOSE:
 *   Thin wrapper around lib/auth functions that manages loading states for OTP
 *   send and verification, and holds the session UID between send and verify steps.
 *
 * LOGIC OVERVIEW:
 *   sendOtp calls sendPatientOtp (phone + type + optional email) and stores the
 *   returned session UID. verifyLogin and verifySignup pass that UID through to
 *   the respective verify calls. logout calls logoutPatient.
 *
 * KEY EXPORTS:
 *   SignupPayload   — shape passed to verifySignup
 *   useAuthActions  — returns { sendOtp, verifyLogin, verifySignup, logout, isSendingOtp, isVerifying }
 *
 * DEPENDENCIES:
 *   lib/auth — sendPatientOtp, verifyPatientLogin, verifyPatientSignup, logoutPatient
 *
 * LAST UPDATED: 2026-05-04 — thread email through sendOtp so it reaches the backend
 */

"use client";

import { logoutPatient, sendPatientOtp, verifyPatientLogin, verifyPatientSignup } from "@/lib/auth";
import { useState } from "react";

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

  const sendOtp = async (phone: string, type: "login" | "signup", email?: string) => {
    setIsSendingOtp(true);
    try {
      const data = await sendPatientOtp(phone, type, email);
      setSessionUid(data.uid);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const verifyLogin = async (phone: string, otp: string) => {
    setIsVerifying(true);
    try {
      await verifyPatientLogin(phone, otp, sessionUid ?? "");
    } finally {
      setIsVerifying(false);
    }
  };

  const verifySignup = async (payload: SignupPayload) => {
    setIsVerifying(true);
    try {
      await verifyPatientSignup({
        ...payload,
        lastName: payload.lastName ?? "",
        uid: sessionUid ?? "",
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
