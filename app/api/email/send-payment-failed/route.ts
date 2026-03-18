import { NextRequest, NextResponse } from 'next/server';
import { dispatchPaymentFailedEmail } from '@/lib/email/walletDispatcher';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userEmail, amount, paymentMethod, errorDescription } = body;

    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: userEmail' },
        { status: 400 },
      );
    }

    const result = await dispatchPaymentFailedEmail({
      userEmail,
      amount: amount ? Number(amount) : undefined,
      paymentMethod,
      errorDescription,
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('[Email] send-payment-failed route error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
