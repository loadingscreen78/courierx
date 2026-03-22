/**
 * In-memory OTP store for admin wallet adjustment verification.
 * Key: admin user_id
 */
export interface OtpEntry {
  code: string;
  expiresAt: number;
  attempts: number;
  sendCount: number;
  firstSendAt: number;
}

const store = new Map<string, OtpEntry>();

export function getOtpStore() {
  return store;
}
