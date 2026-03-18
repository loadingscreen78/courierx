import { getEmailWrapper } from './shared';

export interface WelcomeEmailData {
  email: string;
  fullName?: string;
}

export function renderWelcomeEmail(data: WelcomeEmailData): string {
  const greeting = data.fullName ? `Hi ${data.fullName}` : 'Welcome';

  const content = `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;width:64px;height:64px;line-height:64px;border-radius:50%;background-color:#16A34A20;font-size:32px;text-align:center;">🎉</div>
      <h2 style="margin:16px 0 8px 0;font-family:'Courier Prime',Courier,monospace;font-size:20px;color:#262626;">${greeting}!</h2>
      <p style="margin:0;color:#666;font-size:14px;">Your CourierX account has been created successfully.</p>
    </div>

    <div style="border-top:1px solid #E5E5E5;margin-bottom:24px;"></div>

    <p style="margin:0 0 16px;color:#262626;font-size:14px;line-height:1.6;">
      You can now ship medicines, documents, and gifts internationally from India with ease. Here's what you can do:
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:12px 16px;background-color:#FAFAF8;border-radius:6px;margin-bottom:8px;">
          <p style="margin:0 0 4px;font-weight:bold;font-size:14px;color:#262626;">📦 Book a Shipment</p>
          <p style="margin:0;color:#666;font-size:13px;">Send medicines, documents, or gifts to 200+ countries.</p>
        </td>
      </tr>
      <tr><td style="height:8px;"></td></tr>
      <tr>
        <td style="padding:12px 16px;background-color:#FAFAF8;border-radius:6px;margin-bottom:8px;">
          <p style="margin:0 0 4px;font-weight:bold;font-size:14px;color:#262626;">💰 Recharge Wallet</p>
          <p style="margin:0;color:#666;font-size:13px;">Add funds via UPI, cards, or net banking for quick bookings.</p>
        </td>
      </tr>
      <tr><td style="height:8px;"></td></tr>
      <tr>
        <td style="padding:12px 16px;background-color:#FAFAF8;border-radius:6px;">
          <p style="margin:0 0 4px;font-weight:bold;font-size:14px;color:#262626;">📍 Track in Real-Time</p>
          <p style="margin:0;color:#666;font-size:13px;">Follow your shipment from pickup to delivery.</p>
        </td>
      </tr>
    </table>

    <div style="text-align:center;margin:24px 0;">
      <a href="https://courierx.in/dashboard" style="display:inline-block;padding:12px 32px;background-color:#F40000;color:#FFFFFF;text-decoration:none;border-radius:6px;font-weight:bold;font-size:14px;">Go to Dashboard</a>
    </div>

    <div style="border-top:1px solid #E5E5E5;padding-top:24px;margin-top:8px;text-align:center;color:#999;font-size:12px;">
      <p style="margin:0 0 4px 0;">Need help? Contact CourierX Support</p>
      <p style="margin:0;">support@courierx.com</p>
    </div>
  `;

  return getEmailWrapper(content);
}
