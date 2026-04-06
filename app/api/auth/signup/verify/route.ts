import { NextRequest, NextResponse } from "next/server";
import { postAuthPatientSignupVerify } from "@/sdk/auth-and-crm/sdk.gen";
import { setTokens } from "@/lib/cookies";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data, error } = await postAuthPatientSignupVerify({ body });

    if (error || !data) {
      const status = (error as { status?: number }).status ?? 401;
      return NextResponse.json(
        { error: "Signup verification failed" },
        { status },
      );
    }

    await setTokens(
      { accessToken: data.accessToken, refreshToken: data.refreshToken },
      { accessTokenOptions: { maxAge: data.expiresIn } },
    );

    // Strip tokens — never sent to the client
    const {
      accessToken: _a,
      refreshToken: _r,
      expiresIn: _e,
      ...userInfo
    } = data;
    return NextResponse.json(userInfo);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
