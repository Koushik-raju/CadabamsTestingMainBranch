import { NextResponse } from 'next/server';
import { getPatientsMe } from '@/sdk/auth-and-crm/sdk.gen';

export async function GET() {
  try {
    const { data, error } = await getPatientsMe();

    if (error) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
