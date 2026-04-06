import { NextResponse } from "next/server";
import { postAuthLogout } from "@/sdk/auth-and-crm/sdk.gen";
import { getRefreshToken, clearTokens } from "@/lib/cookies";

export async function POST() {
  try {
    const refreshToken = await getRefreshToken();

    if (refreshToken) {
      // Best-effort — clear cookies regardless of backend response
      await postAuthLogout({ body: { refreshToken } });
    }

    await clearTokens();
    return NextResponse.json({ success: true });
  } catch {
    // Still clear local cookies even if backend call fails
    await clearTokens();
    return NextResponse.json({ success: true });
  }
}
