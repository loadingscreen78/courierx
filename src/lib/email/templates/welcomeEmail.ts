import { getEmailWrapper } from './shared';

export interface WelcomeEmailData {
  email: string;
  fullName?: string;
}

export function renderWelcomeEmail(data: WelcomeEmailData): string {
  const greeting = data.fullName ? data.fullName : 'Explorer';

  const content = `
    <!-- Hero Section -->
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:64px;line-height:1;margin-bottom:16px;">📦✈️🌍</div>
      <h2 style="margin:0 0 8px 0;font-family:'Courier Prime',Courier,monospace;font-size:24px;color:#262626;">
        Welcome aboard, ${greeting}!
      </h2>
      <p style="margin:0;color:#666;font-size:15px;line-height:1.5;">
        Your passport to international shipping is ready.<br/>
        The world just got a little smaller.
      </p>
    </div>

    <div style="border-top:1px solid #E5E5E5;margin-bottom:28px;"></div>

    <!-- Fun Stats Banner -->
    <div style="background:linear-gradient(135deg, #FFF5F5 0%, #FFF0E6 100%);border-radius:12px;padding:24px;margin-bottom:28px;text-align:center;">
      <p style="margin:0 0 4px;font-size:13px;color:#999;text-transform:uppercase;letter-spacing:1px;">You just joined</p>
      <p style="margin:0 0 4px;font-size:28px;font-weight:bold;color:#F40000;font-family:'Courier Prime',Courier,monospace;">CourierX</p>
      <p style="margin:0;font-size:13px;color:#666;">India's friendliest international courier</p>
    </div>

    <!-- What You Can Do -->
    <h3 style="margin:0 0 16px;font-family:'Courier Prime',Courier,monospace;font-size:16px;color:#262626;">Here's what you can ship:</h3>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:14px 16px;background-color:#FAFAF8;border-radius:8px;border-left:4px solid #16A34A;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:40px;font-size:24px;vertical-align:top;">💊</td>
              <td>
                <p style="margin:0 0 2px;font-weight:bold;font-size:14px;color:#262626;">Medicines</p>
                <p style="margin:0;color:#666;font-size:13px;">Send life-saving meds to loved ones abroad</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr><td style="height:8px;"></td></tr>
      <tr>
        <td style="padding:14px 16px;background-color:#FAFAF8;border-radius:8px;border-left:4px solid #F97316;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:40px;font-size:24px;vertical-align:top;">📄</td>
              <td>
                <p style="margin:0 0 2px;font-weight:bold;font-size:14px;color:#262626;">Documents</p>
                <p style="margin:0;color:#666;font-size:13px;">Important papers, delivered with care</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr><td style="height:8px;"></td></tr>
      <tr>
        <td style="padding:14px 16px;background-color:#FAFAF8;border-radius:8px;border-left:4px solid #E31837;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:40px;font-size:24px;vertical-align:top;">🎁</td>
              <td>
                <p style="margin:0 0 2px;font-weight:bold;font-size:14px;color:#262626;">Gifts</p>
                <p style="margin:0;color:#666;font-size:13px;">Surprise someone special across borders</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Quick Start Steps -->
    <div style="background-color:#262626;border-radius:12px;padding:24px;margin-bottom:28px;color:#FFFFFF;">
      <h3 style="margin:0 0 16px;font-family:'Courier Prime',Courier,monospace;font-size:15px;color:#FFFFFF;">⚡ Quick start in 3 steps:</h3>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:6px 0;">
            <span style="display:inline-block;width:24px;height:24px;line-height:24px;text-align:center;background-color:#F40000;border-radius:50%;font-size:12px;font-weight:bold;color:#FFF;margin-right:10px;">1</span>
            <span style="font-size:14px;color:#E5E5E5;">Complete your profile</span>
          </td>
        </tr>
        <tr>
          <td style="padding:6px 0;">
            <span style="display:inline-block;width:24px;height:24px;line-height:24px;text-align:center;background-color:#F40000;border-radius:50%;font-size:12px;font-weight:bold;color:#FFF;margin-right:10px;">2</span>
            <span style="font-size:14px;color:#E5E5E5;">Recharge your wallet</span>
          </td>
        </tr>
        <tr>
          <td style="padding:6px 0;">
            <span style="display:inline-block;width:24px;height:24px;line-height:24px;text-align:center;background-color:#F40000;border-radius:50%;font-size:12px;font-weight:bold;color:#FFF;margin-right:10px;">3</span>
            <span style="font-size:14px;color:#E5E5E5;">Book your first shipment 🚀</span>
          </td>
        </tr>
      </table>
    </div>

    <!-- CTA Button -->
    <div style="text-align:center;margin:28px 0;">
      <a href="https://courierx.in/dashboard" style="display:inline-block;padding:14px 40px;background-color:#F40000;color:#FFFFFF;text-decoration:none;border-radius:8px;font-weight:bold;font-size:15px;font-family:'Courier Prime',Courier,monospace;">Get Started →</a>
    </div>

    <!-- Fun Footer -->
    <div style="border-top:1px solid #E5E5E5;padding-top:24px;margin-top:8px;text-align:center;">
      <p style="margin:0 0 8px;font-size:13px;color:#999;">
        You're now part of the CourierX family 🎉
      </p>
      <p style="margin:0 0 4px;color:#999;font-size:12px;">Need help? We're always here.</p>
      <p style="margin:0;font-size:12px;">
        <a href="mailto:support@courierx.in" style="color:#F40000;text-decoration:none;">support@courierx.in</a>
        &nbsp;·&nbsp;
        <a href="https://courierx.in" style="color:#F40000;text-decoration:none;">courierx.in</a>
      </p>
    </div>
  `;

  return getEmailWrapper(content);
}
