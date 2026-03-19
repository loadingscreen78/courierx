import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/resend';
import { renderWelcomeEmail } from '@/lib/email/templates/welcomeEmail';

const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || '';

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

    console.log(`[Welcome Email] Sending to ${userEmail}`);

    const html = renderWelcomeEmail({ email: userEmail, fullName });

    const result = await sendEmail({
      to: userEmail,
      subject: '🎉 Welcome to CourierX — Your Shipping Passport is Ready!',
      html,
    });

    if (!result.success) {
      console.error('[Welcome Email] Failed:', result.error);
      return NextResponse.json({ success: false, error: result.error }, { status: 200 });
    }

    console.log(`[Welcome Email] Sent to ${userEmail} - ID: ${result.id}`);

    // Also notify admin of new signup
    if (ADMIN_EMAIL) {
      sendEmail({
        to: ADMIN_EMAIL,
        subject: `[Admin] New Signup: ${userEmail}`,
        html,
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, messageId: result.id });
  } catch (error) {
    console.error('[Welcome Email] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 200 },
    );
  }
}
