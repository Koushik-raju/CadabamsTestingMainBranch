import { NextResponse } from "next/server";
import { authControllerLogout } from "@/sdk/backend-v2";
import { getRefreshToken, clearTokens } from "@/lib/cookies";

export async function POST() {
  try {
    const refreshToken = await getRefreshToken();

    if (refreshToken) {
      // Best-effort — clear cookies regardless of backend response
      await authControllerLogout({ body: { refreshToken } });
    }

    await clearTokens();
    return NextResponse.json({ success: true });
  } catch {
    // Still clear local cookies even if backend call fails
    await clearTokens();
    return NextResponse.json({ success: true });
  }
}
