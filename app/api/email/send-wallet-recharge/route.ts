import { NextRequest, NextResponse } from 'next/server';
import { dispatchWalletRechargeEmail } from '@/lib/email/walletDispatcher';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userEmail, amount, paymentMethod, paymentId, bonusAmount, couponCode } = body;

    if (!userEmail || !amount || !paymentMethod || !paymentId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: userEmail, amount, paymentMethod, paymentId' },
        { status: 400 },
      );
    }

    const result = await dispatchWalletRechargeEmail({
      userEmail,
      amount: Number(amount),
      paymentMethod,
      paymentId,
      bonusAmount: bonusAmount ? Number(bonusAmount) : undefined,
      couponCode,
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('[Email] send-wallet-recharge route error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
