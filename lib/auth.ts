import {
  authControllerSendPatientOtp,
  authControllerVerifyPatientLogin,
  authControllerPatientSignupVerify,
  authControllerRefresh,
  authControllerLogout,
} from "@/sdk/backend-v2";
import { setTokens, clearTokens, getRefreshToken } from "./cookies";

// ── Send OTP ──────────────────────────────────────────────────────────────────

export async function sendPatientOtp(
  phone: string,
  type: "login" | "signup" = "login",
  email?: string,
) {
  const { data, error } = await authControllerSendPatientOtp({
    body: { phone, type, email },
  });
  if (error || !data) throw error;
  return data;
}

// ── Verify login OTP ──────────────────────────────────────────────────────────

export async function verifyPatientLogin(phone: string, otp: string) {
  const { data, error } = await authControllerVerifyPatientLogin({
    body: { phone, otp },
  });
  if (error || !data) throw error;

  const tokenData = data as unknown as { accessToken: string; refreshToken: string; expiresIn: number };
  await setTokens(
    {
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
    },
    {
      accessTokenOptions: { maxAge: tokenData.expiresIn },
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
  const { data, error } = await authControllerPatientSignupVerify({ body: params });
  if (error || !data) throw error;

  const tokenData = data as unknown as { accessToken: string; refreshToken: string; expiresIn: number };
  await setTokens(
    {
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
    },
    {
      accessTokenOptions: { maxAge: tokenData.expiresIn },
    },
  );

  return data;
}

// ── Refresh token ─────────────────────────────────────────────────────────────

export async function refreshPatientToken() {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) throw new Error("No refresh token");

  const { data, error } = await authControllerRefresh({ body: { refreshToken } });
  if (error || !data) throw error ?? new Error("Token refresh failed");

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
    const { error } = await authControllerLogout({ body: { refreshToken } });
    if (error) throw error;
  }

  await clearTokens();
}
