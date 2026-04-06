import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_BASE =
  "https://asjkuqm3eoea6q7sqkfpuqt2ye0letxc.lambda-url.ap-south-1.on.aws/api/v1";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: "No refresh token" }, { status: 401 });
  }

  const upstream = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!upstream.ok) {
    return NextResponse.json({ error: "Refresh failed" }, { status: 401 });
  }

  const {
    accessToken,
    refreshToken: newRefreshToken,
    expiresIn,
  } = await upstream.json();

  const response = NextResponse.json({
    access_token: accessToken,
    expires_in: expiresIn,
  });

  const isProd = process.env.NODE_ENV === "production";

  response.cookies.set("access_token", accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: expiresIn,
    path: "/",
  });

  response.cookies.set("refresh_token", newRefreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return response;
}
