import { NextRequest, NextResponse } from "next/server";
import { postAuthPatientSignupVerify } from "@/sdk/auth-and-crm/sdk.gen";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data, error } = await postAuthPatientSignupVerify({ body });

    if (error || !data) {
      const status = (error as { status?: number }).status ?? 401;
      return NextResponse.json({ error: "Signup verification failed" }, { status });
    }

    const { accessToken, refreshToken, expiresIn, ...userInfo } = data;

    const res = NextResponse.json(userInfo);
    res.cookies.set("access_token", accessToken, { path: "/", maxAge: expiresIn });
    res.cookies.set("refresh_token", refreshToken, { path: "/", maxAge: 60 * 60 * 24 * 7 });
    return res;
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
