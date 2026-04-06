// ─── Read access_token cookie (works in both server and client) ───────────────

export async function getToken(): Promise<string> {
  // SERVER — Next.js App Router (server components, route handlers, middleware)
  if (typeof window === "undefined") {
    try {
      // dynamic import so this never breaks in client bundles
      const { cookies } = await import("next/headers");
      return (await cookies()).get("access_token")?.value ?? "";
    } catch {
      return "";
    }
  }

  // CLIENT — browser
  const match = document.cookie.match(/(?:^|;\s*)access_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : "";
}

// ─── Write cookies (client only; server writes happen in route handler) ───────

export function setTokenCookie(name: string, value: string, maxAge: number) {
  if (typeof window === "undefined") return;
  document.cookie = [
    `${name}=${encodeURIComponent(value)}`,
    `path=/`,
    `max-age=${maxAge}`,
    `SameSite=Lax`,
    process.env.NODE_ENV === "production" ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

// ─── Store both tokens after login (call from client only) ───────────────────

export function storeAuthTokens(
  accessToken: string,
  refreshToken: string,
  expiresIn: number,
) {
  setTokenCookie("access_token", accessToken, expiresIn);
  setTokenCookie("refresh_token", refreshToken, 60 * 60 * 24 * 6.5); // 6.5 days
}

// ─── Refresh — calls /api/auth/refresh-token, queues concurrent callers ───────

let refreshPromise: Promise<string> | null = null;

export async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = fetch("/api/auth/refresh", {
    method: "POST",
    credentials: "include",
  })
    .then(async (res) => {
      if (!res.ok) throw new Error("Token refresh failed");
      const { access_token, expires_in } = await res.json();
      setTokenCookie("access_token", access_token, expires_in ?? 3600);
      return access_token as string;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}
