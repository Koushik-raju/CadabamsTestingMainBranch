import {
  authControllerLogout,
  authControllerPatientSignupVerify,
  authControllerRefresh,
  authControllerSendPatientOtp,
  authControllerVerifyPatientLogin,
} from "@/sdk/backend-v2";
import { clearTokens, getRefreshToken, setTokens } from "./cookies";

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
  return data as { message: string; uid: string };
}

// ── Verify login OTP ──────────────────────────────────────────────────────────

export async function verifyPatientLogin(phone: string, otp: string, uid: string) {
  const { data, error } = await authControllerVerifyPatientLogin({
    body: { phone, otp, uid },
  });
  if (error || !data) throw error;

  const { accessToken, refreshToken, expiresIn } = data as unknown as {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
  await setTokens({ accessToken, refreshToken }, { accessTokenOptions: { maxAge: expiresIn } });

  return data;
}

// ── Verify signup OTP ─────────────────────────────────────────────────────────

export async function verifyPatientSignup(params: {
  phone: string;
  otp: string;
  uid: string;
  firstName: string;
  lastName: string;
  email?: string;
  countryCode?: number;
}) {
  const { data, error } = await authControllerPatientSignupVerify({ body: params });
  if (error || !data) throw error;

  const { accessToken, refreshToken, expiresIn } = data as unknown as {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
  await setTokens({ accessToken, refreshToken }, { accessTokenOptions: { maxAge: expiresIn } });

  return data;
}

// ── Refresh token ─────────────────────────────────────────────────────────────

export async function refreshPatientToken() {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) throw new Error("No refresh token");

  const { data, error } = await authControllerRefresh({ body: { refreshToken } });
  if (error || !data) throw error ?? new Error("Token refresh failed");

  await setTokens(
    { accessToken: data.accessToken, refreshToken: data.refreshToken },
    { accessTokenOptions: { maxAge: data.expiresIn } },
  );

  return data;
}

// ── Logout ────────────────────────────────────────────────────────────────────

export async function logoutPatient() {
  try {
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      await authControllerLogout({ body: { refreshToken } });
    }
  } catch {
    // best-effort
  }
  await clearTokens();
}
