import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServiceRoleClient } from '@/lib/shipment-lifecycle/supabaseAdmin';
import { sendEmail } from '@/lib/email/resend';
import { renderAuthEmail } from '@/lib/email/templates/authEmail';

export async function POST(request: NextRequest) {
  try {
    const { email, panel } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const siteUrl = process.env.SITE_URL || 'https://courierx.in';
    const redirectTo = `${siteUrl}/auth/reset-password`;

    console.log(`[ForgotPassword] email=${email} panel=${panel} siteUrl=${siteUrl}`);

    // Strategy 1: Use admin generateLink to get the token, then send via Resend ourselves
    // This bypasses Supabase's email sending entirely
    const supabaseAdmin = getServiceRoleClient();

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo },
    });

    if (!linkError && linkData?.properties) {
      const tokenHash = linkData.properties.hashed_token;
      const actionLink = linkData.properties.action_link;

      let resetUrl: string;
      if (tokenHash) {
        resetUrl = `${redirectTo}?token_hash=${tokenHash}&type=recovery`;
      } else if (actionLink) {
        resetUrl = actionLink;
      } else {
        console.error('[ForgotPassword] generateLink succeeded but no token/link in response');
        return NextResponse.json({ success: true });
      }

      console.log('[ForgotPassword] generateLink succeeded, sending via Resend');
      await sendResetEmail(email, resetUrl);

      if (panel === 'customer') {
        await trySendWhatsApp(supabaseAdmin, email, resetUrl);
      }

      return NextResponse.json({ success: true });
    }

    // Strategy 2: generateLink failed (common on self-hosted VPS Supabase)
    // Fall back to resetPasswordForEmail which triggers Supabase's own email hook
    console.warn('[ForgotPassword] generateLink failed:', linkError?.message);
    console.log('[ForgotPassword] Falling back to resetPasswordForEmail...');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
    const anonClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error: resetError } = await anonClient.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (resetError) {
      console.error('[ForgotPassword] resetPasswordForEmail error:', resetError.message);
      // Still return success to avoid user enumeration
      return NextResponse.json({ success: true });
    }

    console.log('[ForgotPassword] resetPasswordForEmail triggered successfully');
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('[ForgotPassword] Unhandled error:', error?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function sendResetEmail(email: string, resetUrl: string) {
  const html = renderAuthEmail({ type: 'recovery', confirmationUrl: resetUrl, email });
  const result = await sendEmail({
    to: email,
    subject: 'Reset your password - CourierX',
    html,
  });
  console.log('[ForgotPassword] Resend result:', JSON.stringify(result));
}

async function trySendWhatsApp(supabaseAdmin: any, email: string, resetUrl: string) {
  try {
    const { data: profileData } = await supabaseAdmin
      .from('profiles')
      .select('phone_number')
      .eq('email', email)
      .maybeSingle();

    if (profileData?.phone_number) {
      await sendWhatsAppResetLink(profileData.phone_number, resetUrl);
      console.log('[ForgotPassword] WhatsApp sent to', profileData.phone_number);
    }
  } catch (e) {
    console.warn('[ForgotPassword] WhatsApp send failed:', e);
  }
}

async function sendWhatsAppResetLink(phone: string, resetUrl: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

  if (!accountSid || !authToken) return;

  const body = `CourierX: Reset your password:\n${resetUrl}\n\nExpires in 1 hour. Ignore if you didn't request this.`;

  await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ From: from, To: `whatsapp:${phone}`, Body: body }).toString(),
  });
}
