import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/resend';
import { renderAuthEmail } from '@/lib/email/templates/authEmail';

/**
 * Custom email handler for Supabase Auth using Resend
 * This endpoint is called by Supabase Auth when it needs to send emails
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Support both GoTrue hook payload format and our direct format
    // GoTrue hook sends: { user: { email }, email_data: { token_hash, email_action_type, redirect_to, ... } }
    // Our direct format: { email, type, token_hash, redirect_to }
    let email: string;
    let type: string;
    let token_hash: string;
    let redirect_to: string | undefined;

    if (body.email_data) {
      // GoTrue hook format
      email = body.user?.email || body.email;
      type = body.email_data.email_action_type;
      token_hash = body.email_data.token_hash;
      redirect_to = body.email_data.redirect_to;
    } else {
      // Direct format
      email = body.email;
      type = body.type;
      token_hash = body.token_hash;
      redirect_to = body.redirect_to;
    }
    
    if (!email || !type || !token_hash) {
      return NextResponse.json(
        { error: 'Missing required fields: email, type, token_hash' },
        { status: 400 }
      );
    }

    // Build confirmation URL
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://supabase.courierx.in';
    const siteUrl = process.env.SITE_URL || 'https://courierx.in';
    
    // Construct the confirmation URL based on type
    let confirmationUrl: string;
    
    switch (type) {
      case 'signup':
      case 'invite':
        confirmationUrl = `${baseUrl}/auth/v1/verify?token=${token_hash}&type=signup${redirect_to ? `&redirect_to=${encodeURIComponent(redirect_to)}` : ''}`;
        break;
      case 'recovery':
        confirmationUrl = `${siteUrl}/auth/reset-password?token_hash=${token_hash}&type=recovery`;
        break;
      case 'email_change':
        confirmationUrl = `${baseUrl}/auth/v1/verify?token=${token_hash}&type=email_change${redirect_to ? `&redirect_to=${encodeURIComponent(redirect_to)}` : ''}`;
        break;
      default:
        return NextResponse.json(
          { error: `Unsupported email type: ${type}` },
          { status: 400 }
        );
    }

    // Render email HTML
    const html = renderAuthEmail({
      type: type as 'signup' | 'recovery' | 'email_change' | 'invite',
      confirmationUrl,
      email,
    });

    // Get subject based on type
    const subjects = {
      signup: 'Verify your email - CourierX',
      recovery: 'Reset your password - CourierX',
      email_change: 'Confirm your email change - CourierX',
      invite: 'You\'ve been invited to CourierX',
    };

    // Send email via Resend
    const result = await sendEmail({
      to: email,
      subject: subjects[type as keyof typeof subjects] || 'CourierX Notification',
      html,
    });

    if (!result.success) {
      console.error('[Auth Email] Failed to send:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }

    console.log(`[Auth Email] Sent ${type} email to ${email} - ID: ${result.id}`);
    
    return NextResponse.json({
      success: true,
      messageId: result.id,
    });
  } catch (error: any) {
    console.error('[Auth Email] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
