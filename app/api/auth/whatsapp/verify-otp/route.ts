import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyWhatsAppOtp } from '@/lib/whatsapp/verify';
import { getServiceRoleClient } from '@/lib/shipment-lifecycle/supabaseAdmin';

const verifyOtpSchema = z.object({
  phone: z.string().regex(/^\+\d{10,15}$/, 'Phone must be in E.164 format'),
  code: z.string().length(6, 'OTP must be 6 digits'),
});

/** Build a deterministic synthetic email from a phone number */
function syntheticEmail(phone: string): string {
  return `${phone.replace(/\D/g, '')}@phone.courierx.local`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = verifyOtpSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.issues.map((i) => ({
            field: i.path.join('.'),
            message: i.message,
          })),
        },
        { status: 400 }
      );
    }

    const { phone, code } = validation.data;

    // 1. Verify OTP with Twilio
    const verifyResult = await verifyWhatsAppOtp(phone, code);

    if (!verifyResult.success) {
      return NextResponse.json(
        { success: false, error: verifyResult.error || 'OTP verification failed' },
        { status: 401 }
      );
    }

    // 2. Create or retrieve Supabase user
    const supabase = getServiceRoleClient();
    const email = syntheticEmail(phone);

    // Look up by phone first, then by synthetic email
    const { data: listData } = await supabase.auth.admin.listUsers();
    const users = listData?.users ?? [];
    let existingUser = users.find(
      (u: { phone?: string }) => u.phone === phone
    );
    if (!existingUser) {
      existingUser = users.find(
        (u: { email?: string }) => u.email === email
      );
    }

    let userId: string;
    let isNewUser = false;

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // Create new user with BOTH email and phone so Supabase doesn't reject it
      const tempPassword = crypto.randomUUID();
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        phone,
        password: tempPassword,
        phone_confirm: true,
        email_confirm: true,
        user_metadata: { phone_number: phone, registered_via: 'whatsapp' },
      });

      if (createError || !newUser?.user) {
        console.error('[WhatsApp Auth] Failed to create user:', createError?.message);
        return NextResponse.json(
          { success: false, error: createError?.message || 'Failed to create user account' },
          { status: 500 }
        );
      }

      userId = newUser.user.id;
      isNewUser = true;

      // Create a profile row for the new user
      await supabase.from('profiles').upsert({
        user_id: userId,
        phone_number: phone,
        email,
        preferred_otp_method: 'whatsapp',
      }, { onConflict: 'user_id' });
    }

    // 3. Generate a magic link and extract the token to create a real session
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });

    if (linkError || !linkData) {
      console.error('[WhatsApp Auth] generateLink failed:', linkError?.message);
      return NextResponse.json(
        { success: false, error: 'Failed to generate session' },
        { status: 500 }
      );
    }

    // The admin generateLink returns properties.hashed_token which we can
    // use with verifyOtp on the server to mint a real session.
    const hashedToken = linkData.properties?.hashed_token;

    if (!hashedToken) {
      console.error('[WhatsApp Auth] No hashed_token in generateLink response');
      return NextResponse.json(
        { success: false, error: 'Failed to generate session token' },
        { status: 500 }
      );
    }

    // Verify the magic link token server-side to get access + refresh tokens
    const { data: sessionData, error: sessionError } = await supabase.auth.verifyOtp({
      type: 'magiclink',
      token_hash: hashedToken,
    });

    if (sessionError || !sessionData?.session) {
      console.error('[WhatsApp Auth] verifyOtp session failed:', sessionError?.message);
      return NextResponse.json(
        { success: false, error: 'Failed to create session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      verified: true,
      userId,
      isNewUser,
      session: {
        access_token: sessionData.session.access_token,
        refresh_token: sessionData.session.refresh_token,
      },
    });
  } catch (error) {
    console.error('[WhatsApp Auth] verify-otp error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
