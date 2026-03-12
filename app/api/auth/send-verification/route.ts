import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email/resend';
import { renderAuthEmail } from '@/lib/email/templates/authEmail';

/**
 * Send email verification link using Resend
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, userId } = body;

    if (!email || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: email, userId' },
        { status: 400 }
      );
    }

    // Create Supabase admin client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Generate email verification token
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email,
      password: Math.random().toString(36).slice(-12), // Temporary password for link generation
    });

    if (error || !data.properties?.action_link) {
      console.error('[Verification Email] Failed to generate link:', error);
      return NextResponse.json(
        { error: 'Failed to generate verification link' },
        { status: 500 }
      );
    }

    // Extract the confirmation URL
    const confirmationUrl = data.properties.action_link;

    // Render email HTML
    const html = renderAuthEmail({
      type: 'signup',
      confirmationUrl,
      email,
    });

    // Send email via Resend
    const result = await sendEmail({
      to: email,
      subject: 'Verify your email - CourierX',
      html,
    });

    if (!result.success) {
      console.error('[Verification Email] Failed to send:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }

    console.log(`[Verification Email] Sent to ${email} - ID: ${result.id}`);

    return NextResponse.json({
      success: true,
      messageId: result.id,
    });
  } catch (error: any) {
    console.error('[Verification Email] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
