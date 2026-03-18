import { formatCurrency, getEmailWrapper } from './shared';

export interface WalletRechargeEmailData {
  amount: number;
  paymentMethod: string;
  paymentId: string;
  bonusAmount?: number;
  couponCode?: string;
  timestamp: string;
}

export function renderWalletRechargeEmail(data: WalletRechargeEmailData): string {
  const totalCredited = data.amount + (data.bonusAmount || 0);

  const bonusRow = data.bonusAmount
    ? `<tr>
        <td style="padding:8px 0;color:#666;font-size:14px;">Coupon Bonus${data.couponCode ? ` (${data.couponCode})` : ''}</td>
        <td style="padding:8px 0;text-align:right;font-size:14px;color:#16A34A;">+${formatCurrency(data.bonusAmount)}</td>
      </tr>`
    : '';

  const content = `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;width:64px;height:64px;line-height:64px;border-radius:50%;background-color:#16A34A20;font-size:32px;text-align:center;">💰</div>
      <h2 style="margin:16px 0 8px 0;font-family:'Courier Prime',Courier,monospace;font-size:20px;color:#16A34A;">Wallet Recharged</h2>
      <p style="margin:0;color:#666;font-size:14px;">Your CourierX wallet has been credited successfully.</p>
    </div>

    <div style="border-top:1px solid #E5E5E5;margin-bottom:24px;"></div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:8px 0;color:#666;font-size:14px;">Amount Paid</td>
        <td style="padding:8px 0;text-align:right;font-weight:bold;font-size:14px;">${formatCurrency(data.amount)}</td>
      </tr>
      ${bonusRow}
      <tr>
        <td style="padding:8px 0;color:#666;font-size:14px;">Payment Method</td>
        <td style="padding:8px 0;text-align:right;font-size:14px;">${data.paymentMethod.toUpperCase()}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#666;font-size:14px;">Transaction ID</td>
        <td style="padding:8px 0;text-align:right;font-size:14px;word-break:break-all;">${data.paymentId}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#666;font-size:14px;">Date</td>
        <td style="padding:8px 0;text-align:right;font-size:14px;">${data.timestamp}</td>
      </tr>
      <tr>
        <td style="padding:12px 0;border-top:2px solid #262626;font-weight:bold;font-size:16px;">Total Credited</td>
        <td style="padding:12px 0;border-top:2px solid #262626;text-align:right;font-weight:bold;font-size:16px;color:#16A34A;">${formatCurrency(totalCredited)}</td>
      </tr>
    </table>

    <div style="border-top:1px solid #E5E5E5;padding-top:24px;margin-top:8px;text-align:center;color:#999;font-size:12px;">
      <p style="margin:0 0 4px 0;">Need help? Contact CourierX Support</p>
      <p style="margin:0;">support@courierx.com</p>
    </div>
  `;

  return getEmailWrapper(content);
}

export interface PaymentFailedEmailData {
  amount?: number;
  paymentMethod?: string;
  errorDescription?: string;
  timestamp: string;
}

export function renderPaymentFailedEmail(data: PaymentFailedEmailData): string {
  const content = `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;width:64px;height:64px;line-height:64px;border-radius:50%;background-color:#F4000020;font-size:32px;text-align:center;">❌</div>
      <h2 style="margin:16px 0 8px 0;font-family:'Courier Prime',Courier,monospace;font-size:20px;color:#F40000;">Payment Failed</h2>
      <p style="margin:0;color:#666;font-size:14px;">Your wallet recharge could not be completed.</p>
    </div>

    <div style="border-top:1px solid #E5E5E5;margin-bottom:24px;"></div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      ${data.amount ? `<tr>
        <td style="padding:8px 0;color:#666;font-size:14px;">Amount</td>
        <td style="padding:8px 0;text-align:right;font-size:14px;">${formatCurrency(data.amount)}</td>
      </tr>` : ''}
      ${data.paymentMethod ? `<tr>
        <td style="padding:8px 0;color:#666;font-size:14px;">Payment Method</td>
        <td style="padding:8px 0;text-align:right;font-size:14px;">${data.paymentMethod.toUpperCase()}</td>
      </tr>` : ''}
      ${data.errorDescription ? `<tr>
        <td style="padding:8px 0;color:#666;font-size:14px;">Reason</td>
        <td style="padding:8px 0;text-align:right;font-size:14px;color:#F40000;">${data.errorDescription}</td>
      </tr>` : ''}
      <tr>
        <td style="padding:8px 0;color:#666;font-size:14px;">Date</td>
        <td style="padding:8px 0;text-align:right;font-size:14px;">${data.timestamp}</td>
      </tr>
    </table>

    <p style="margin:0 0 16px;color:#666;font-size:14px;line-height:1.5;">
      No amount has been deducted from your account. If you see a deduction, it will be refunded within 5-7 business days. Please try again or use a different payment method.
    </p>

    <div style="text-align:center;margin:24px 0;">
      <a href="https://courierx.in/dashboard" style="display:inline-block;padding:12px 32px;background-color:#F40000;color:#FFFFFF;text-decoration:none;border-radius:6px;font-weight:bold;font-size:14px;">Try Again</a>
    </div>

    <div style="border-top:1px solid #E5E5E5;padding-top:24px;margin-top:8px;text-align:center;color:#999;font-size:12px;">
      <p style="margin:0 0 4px 0;">Need help? Contact CourierX Support</p>
      <p style="margin:0;">support@courierx.com</p>
    </div>
  `;

  return getEmailWrapper(content);
}
