import { NextResponse } from "next/server";
import { postAuthRefresh } from "@/sdk/auth-and-crm/sdk.gen";
import { getRefreshToken, setTokens } from "@/lib/cookies";

export async function POST() {
  try {
    const refreshToken = await getRefreshToken();

    if (!refreshToken) {
      return NextResponse.json({ error: "No refresh token" }, { status: 401 });
    }

    const { data, error } = await postAuthRefresh({ body: { refreshToken } });

    if (error || !data) {
      return NextResponse.json(
        { error: "Token refresh failed" },
        { status: 401 },
      );
    }

    await setTokens(
      { accessToken: data.accessToken, refreshToken: data.refreshToken },
      { accessTokenOptions: { maxAge: data.expiresIn } },
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
