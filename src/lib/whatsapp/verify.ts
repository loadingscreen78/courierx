import { getTwilioClient } from './client';

const PHONE_REGEX = /^\+\d{10,15}$/;

/**
 * Sends an OTP via Twilio Verify.
 * Tries WhatsApp first; if Twilio rejects it (e.g. sandbox not opted-in,
 * or no approved WhatsApp Business sender), falls back to SMS automatically.
 * Phone must be in E.164 format (e.g. +91XXXXXXXXXX).
 */
export async function sendWhatsAppOtp(
  phone: string
): Promise<{ success: boolean; error?: string; channel?: string }> {
  if (!PHONE_REGEX.test(phone)) {
    return { success: false, error: `Invalid phone number format: ${phone}. Use E.164 format (e.g. +91XXXXXXXXXX)` };
  }

  const serviceId = process.env.TWILIO_VERIFY_SERVICE_ID;
  if (!serviceId) {
    throw new Error('[WhatsApp] TWILIO_VERIFY_SERVICE_ID is not set. Add it to your .env.local file.');
  }

  const client = getTwilioClient();

  // Try WhatsApp first
  try {
    const verification = await client.verify.v2
      .services(serviceId)
      .verifications.create({
        to: phone,
        channel: 'whatsapp',
      });
    console.log(`[OTP] Sent via WhatsApp to ${phone} - Status: ${verification.status}`);
    return { success: true, channel: 'whatsapp' };
  } catch (whatsappErr: unknown) {
    const whatsappMsg = whatsappErr instanceof Error ? whatsappErr.message : 'Unknown error';
    console.warn(`[OTP] WhatsApp failed for ${phone}: ${whatsappMsg}. Falling back to SMS...`);
  }

  // Fallback to SMS
  try {
    const verification = await client.verify.v2
      .services(serviceId)
      .verifications.create({
        to: phone,
        channel: 'sms',
      });
    console.log(`[OTP] Sent via SMS to ${phone} - Status: ${verification.status}`);
    return { success: true, channel: 'sms' };
  } catch (smsErr: unknown) {
    const message = smsErr instanceof Error ? smsErr.message : 'Unknown error';
    console.error(`[OTP] SMS also failed for ${phone}:`, message);
    return { success: false, error: message };
  }
}

/**
 * Verifies a WhatsApp OTP code via Twilio Verify.
 * Returns success if the code is valid, failure otherwise.
 */
export async function verifyWhatsAppOtp(
  phone: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  if (!PHONE_REGEX.test(phone)) {
    return { success: false, error: `Invalid phone number format: ${phone}` };
  }

  if (!code || code.length !== 6) {
    return { success: false, error: 'OTP code must be 6 digits' };
  }

  const serviceId = process.env.TWILIO_VERIFY_SERVICE_ID;
  if (!serviceId) {
    throw new Error('[WhatsApp] TWILIO_VERIFY_SERVICE_ID is not set.');
  }

  try {
    const client = getTwilioClient();
    const check = await client.verify.v2
      .services(serviceId)
      .verificationChecks.create({
        to: phone,
        code,
      });

    if (check.status === 'approved') {
      console.log(`[WhatsApp OTP] Verified for ${phone}`);
      return { success: true };
    }

    console.warn(`[WhatsApp OTP] Verification failed for ${phone}: ${check.status}`);
    return { success: false, error: `Verification failed: ${check.status}` };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[WhatsApp OTP] Verification error for ${phone}:`, message);
    return { success: false, error: message };
  }
}
