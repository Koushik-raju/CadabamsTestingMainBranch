import { NextRequest, NextResponse } from "next/server";
import { authControllerRefresh } from "@/sdk/backend-v2";

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get("refresh_token")?.value;

    if (!refreshToken) {
      return NextResponse.json({ error: "No refresh token" }, { status: 401 });
    }

    const { data, error } = await authControllerRefresh({ body: { refreshToken } });

    if (error || !data) {
      return NextResponse.json({ error: "Token refresh failed" }, { status: 401 });
    }

    const res = NextResponse.json({ accessToken: data.accessToken, expiresIn: data.expiresIn });
    res.cookies.set("access_token", data.accessToken, { path: "/", maxAge: data.expiresIn });
    res.cookies.set("refresh_token", data.refreshToken, { path: "/", maxAge: 60 * 60 * 24 * 7 });
    return res;
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
