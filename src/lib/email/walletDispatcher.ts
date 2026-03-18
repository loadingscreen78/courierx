import { sendEmail } from './resend';
import { renderWalletRechargeEmail, renderPaymentFailedEmail } from './templates/walletEmail';
import { renderWelcomeEmail } from './templates/welcomeEmail';

const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || '';

export interface WalletEmailResult {
  userEmailSent: boolean;
  adminEmailSent: boolean;
  errors: string[];
}

/**
 * Send wallet recharge success email to user + admin.
 */
export async function dispatchWalletRechargeEmail(params: {
  userEmail: string;
  amount: number;
  paymentMethod: string;
  paymentId: string;
  bonusAmount?: number;
  couponCode?: string;
}): Promise<WalletEmailResult> {
  const result: WalletEmailResult = { userEmailSent: false, adminEmailSent: false, errors: [] };

  const html = renderWalletRechargeEmail({
    amount: params.amount,
    paymentMethod: params.paymentMethod,
    paymentId: params.paymentId,
    bonusAmount: params.bonusAmount,
    couponCode: params.couponCode,
    timestamp: new Date().toLocaleString('en-IN'),
  });

  const subject = `Wallet Recharged - ${params.paymentMethod.toUpperCase()} ₹${params.amount.toLocaleString('en-IN')}`;

  // Send to user
  if (params.userEmail) {
    const userResult = await sendEmail({ to: params.userEmail, subject, html });
    result.userEmailSent = userResult.success;
    if (!userResult.success) {
      result.errors.push(`User email failed: ${userResult.error}`);
    }
  }

  // Send to admin
  if (ADMIN_EMAIL) {
    const adminResult = await sendEmail({ to: ADMIN_EMAIL, subject: `[Admin] ${subject}`, html });
    result.adminEmailSent = adminResult.success;
    if (!adminResult.success) {
      result.errors.push(`Admin email failed: ${adminResult.error}`);
    }
  }

  return result;
}

/**
 * Send payment failed email to user.
 */
export async function dispatchPaymentFailedEmail(params: {
  userEmail: string;
  amount?: number;
  paymentMethod?: string;
  errorDescription?: string;
}): Promise<WalletEmailResult> {
  const result: WalletEmailResult = { userEmailSent: false, adminEmailSent: false, errors: [] };

  const html = renderPaymentFailedEmail({
    amount: params.amount,
    paymentMethod: params.paymentMethod,
    errorDescription: params.errorDescription,
    timestamp: new Date().toLocaleString('en-IN'),
  });

  const subject = 'Payment Failed - CourierX Wallet Recharge';

  if (params.userEmail) {
    const userResult = await sendEmail({ to: params.userEmail, subject, html });
    result.userEmailSent = userResult.success;
    if (!userResult.success) {
      result.errors.push(`User email failed: ${userResult.error}`);
    }
  }

  // Notify admin of failed payments too
  if (ADMIN_EMAIL) {
    const adminResult = await sendEmail({ to: ADMIN_EMAIL, subject: `[Admin] ${subject}`, html });
    result.adminEmailSent = adminResult.success;
    if (!adminResult.success) {
      result.errors.push(`Admin email failed: ${adminResult.error}`);
    }
  }

  return result;
}

/**
 * Send welcome email to newly registered user.
 */
export async function dispatchWelcomeEmail(params: {
  userEmail: string;
  fullName?: string;
}): Promise<WalletEmailResult> {
  const result: WalletEmailResult = { userEmailSent: false, adminEmailSent: false, errors: [] };

  const html = renderWelcomeEmail({
    email: params.userEmail,
    fullName: params.fullName,
  });

  const subject = 'Welcome to CourierX - Your Account is Ready!';

  if (params.userEmail) {
    const userResult = await sendEmail({ to: params.userEmail, subject, html });
    result.userEmailSent = userResult.success;
    if (!userResult.success) {
      result.errors.push(`User email failed: ${userResult.error}`);
    }
  }

  // Notify admin of new signup
  if (ADMIN_EMAIL) {
    const adminResult = await sendEmail({
      to: ADMIN_EMAIL,
      subject: `[Admin] New Signup: ${params.userEmail}`,
      html,
    });
    result.adminEmailSent = adminResult.success;
    if (!adminResult.success) {
      result.errors.push(`Admin email failed: ${adminResult.error}`);
    }
  }

  return result;
}
