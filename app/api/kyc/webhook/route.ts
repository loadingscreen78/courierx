import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/kyc/webhook
 * Cashfree Secure ID webhook endpoint.
 * Receives DigiLocker verification status updates.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[kyc/webhook] Received:', JSON.stringify(body));
    // Acknowledge receipt — actual verification is done via polling in verify-otp route
    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json({ success: true }, { status: 200 });
  }
}

// Cashfree may also send GET to verify the endpoint
export async function GET() {
  return NextResponse.json({ success: true }, { status: 200 });
}
