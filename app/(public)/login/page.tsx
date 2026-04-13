import { redirect } from 'next/navigation';

export default function LoginRedirect({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (v) params.set(k, Array.isArray(v) ? v[0] : v);
  }
  const qs = params.toString();
  redirect(`/auth/login${qs ? `?${qs}` : ''}`);
}
