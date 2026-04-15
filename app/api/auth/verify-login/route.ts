import { NextRequest, NextResponse } from "next/server";
import { authControllerVerifyPatientLogin } from "@/sdk/backend-v2";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data, error } = await authControllerVerifyPatientLogin({ body });

    if (error || !data) {
      const status = (error as { status?: number })?.status ?? 401;
      return NextResponse.json({ error: "OTP verification failed" }, { status });
    }

    const tokenData = data as unknown as { accessToken: string; refreshToken: string; expiresIn: number; [key: string]: unknown };
    const { accessToken, refreshToken, expiresIn, ...userInfo } = tokenData;

    const res = NextResponse.json(userInfo);
    res.cookies.set("access_token", accessToken, { path: "/", maxAge: expiresIn });
    res.cookies.set("refresh_token", refreshToken, { path: "/", maxAge: 60 * 60 * 24 * 7 });
    return res;
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
