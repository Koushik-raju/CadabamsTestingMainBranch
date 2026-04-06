import {
  postAuthPatientSendOtp,
  postAuthPatientVerifyLogin,
  postAuthPatientSignupVerify,
  postAuthRefresh,
  postAuthLogout,
} from "@/sdk/auth-and-crm/sdk.gen";
import { setTokens, clearTokens, getRefreshToken } from "./cookies";

// ── Send OTP ──────────────────────────────────────────────────────────────────

export async function sendPatientOtp(
  phone: string,
  type: "login" | "signup" = "login",
  email?: string,
) {
  const { data, error } = await postAuthPatientSendOtp({
    body: { phone, type, email },
  });
  if (error || !data) throw error;
  return data;
}

// ── Verify login OTP ──────────────────────────────────────────────────────────

export async function verifyPatientLogin(phone: string, otp: string) {
  const { data, error } = await postAuthPatientVerifyLogin({
    body: { phone, otp },
  });
  if (error || !data) throw error;

  await setTokens(
    {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    },
    {
      accessTokenOptions: { maxAge: data.expiresIn },
    },
  );

  return data;
}

// ── Verify signup OTP ─────────────────────────────────────────────────────────

export async function verifyPatientSignup(params: {
  phone: string;
  otp: string;
  firstName: string;
  lastName: string;
  email?: string;
  countryCode?: number;
  dob?: string;
}) {
  const { data, error } = await postAuthPatientSignupVerify({ body: params });
  if (error || !data) throw error;

  await setTokens(
    {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    },
    {
      accessTokenOptions: { maxAge: data.expiresIn },
    },
  );

  return data;
}

// ── Refresh token ─────────────────────────────────────────────────────────────

export async function refreshPatientToken() {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) throw new Error("No refresh token");

  const { data, error } = await postAuthRefresh({ body: { refreshToken } });
  if (error || !data) throw error;

  await setTokens(
    {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    },
    {
      accessTokenOptions: { maxAge: data.expiresIn },
    },
  );

  return data;
}

// ── Logout ────────────────────────────────────────────────────────────────────

export async function logoutPatient() {
  const refreshToken = await getRefreshToken();

  if (refreshToken) {
    const { error } = await postAuthLogout({ body: { refreshToken } });
    if (error || !data) throw error;
  }

  await clearTokens();
}
