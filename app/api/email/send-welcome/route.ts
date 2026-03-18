import { NextRequest, NextResponse } from 'next/server';
import { dispatchWelcomeEmail } from '@/lib/email/walletDispatcher';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userEmail, fullName } = body;

    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: userEmail' },
        { status: 400 },
      );
    }

    const result = await dispatchWelcomeEmail({ userEmail, fullName });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('[Email] send-welcome route error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
