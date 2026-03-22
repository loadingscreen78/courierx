import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/shipment-lifecycle/supabaseAdmin';
import { sendEmail } from '@/lib/email/resend';
import { getOtpStore } from '@/lib/admin/walletOtpStore';

const ADMIN_EMAIL = 'courierx.in@gmail.com';
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const MAX_SENDS_PER_24H = 2;

async function requireAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const supabase = getServiceRoleClient();
  const { data: { user }, error } = await supabase.auth.getUser(authHeader.slice(7));
  if (error || !user) return null;
  const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
  if (!roles?.some((r: any) => r.role === 'admin')) return null;
  return user;
}

/**
 * POST /api/admin/wallet-otp/send
 * Sends a 6-digit OTP to the admin email via Resend.
 * Rate limited: max 2 sends per 24 hours.
 */
export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const otpStore = getOtpStore();
    const existing = otpStore.get(admin.id);
    const now = Date.now();

    // Check 24-hour send limit
    if (existing) {
      const hoursSinceFirst = (now - existing.firstSendAt) / (1000 * 60 * 60);
      if (hoursSinceFirst < 24 && existing.sendCount >= MAX_SENDS_PER_24H) {
        const hoursLeft = Math.ceil(24 - hoursSinceFirst);
        return NextResponse.json(
          { error: `OTP send limit reached. You can request a new OTP in ${hoursLeft} hour(s).` },
          { status: 429 }
        );
      }
      // Reset counter if 24h has passed
      if (hoursSinceFirst >= 24) {
        otpStore.delete(admin.id);
      }
    }

    // Generate 6-digit OTP
    const code = String(Math.floor(100000 + Math.random() * 900000));

    // Send via Resend
    const emailResult = await sendEmail({
      to: ADMIN_EMAIL,
      subject: `CourierX Admin Verification: ${code}`,
      html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #111; margin-bottom: 8px;">Wallet Adjustment Verification</h2>
          <p style="color: #555; font-size: 14px; margin-bottom: 20px;">
            Use this OTP to confirm the wallet adjustment. It expires in 10 minutes.
          </p>
          <div style="background: #f4f4f5; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px;">
            <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #111;">${code}</span>
          </div>
          <p style="color: #999; font-size: 12px;">
            If you didn't request this, please ignore this email.
          </p>
        </div>
      `,
    });

    if (!emailResult.success) {
      console.error('[wallet-otp/send] Email send failed:', emailResult.error);
      return NextResponse.json({ error: 'Failed to send OTP email' }, { status: 500 });
    }

    // Store OTP
    const prev = otpStore.get(admin.id);
    otpStore.set(admin.id, {
      code,
      expiresAt: now + OTP_EXPIRY_MS,
      attempts: 0,
      sendCount: (prev && (now - prev.firstSendAt) < 24 * 60 * 60 * 1000) ? prev.sendCount + 1 : 1,
      firstSendAt: (prev && (now - prev.firstSendAt) < 24 * 60 * 60 * 1000) ? prev.firstSendAt : now,
    });

    const storedOtp = otpStore.get(admin.id)!;
    const sendsRemaining = MAX_SENDS_PER_24H - storedOtp.sendCount;

    return NextResponse.json({
      success: true,
      message: `OTP sent to admin email`,
      sendsRemaining,
    });
  } catch (err) {
    console.error('[wallet-otp/send] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
