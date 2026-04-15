import { NextResponse } from 'next/server';
import { authControllerMe } from '@/sdk/backend-v2';

export async function GET() {
  try {
    const { data, error } = await authControllerMe();

    if (error) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
