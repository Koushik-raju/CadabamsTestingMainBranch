import { NextRequest, NextResponse } from 'next/server';
import { authControllerSendPatientOtp } from '@/sdk/backend-v2';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data, error } = await authControllerSendPatientOtp({ body });

    if (error) {
      console.error('[send-otp] backend error:', error);
      return NextResponse.json(
        { error: 'Failed to send OTP' },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
