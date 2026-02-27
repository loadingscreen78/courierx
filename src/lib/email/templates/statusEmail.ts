import { ShipmentStatus, getEmailWrapper } from './shared';

export interface StatusEmailData {
  trackingNumber: string;
  recipientName: string;
  shipmentType: 'medicine' | 'document' | 'gift';
  status: ShipmentStatus;
  statusLabel: string;
  statusMessage: string;
  statusColor: string;
  timestamp: string;
  destinationCountry: string;
}

export function renderStatusEmail(data: StatusEmailData): string {
  const content = `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;width:64px;height:64px;line-height:64px;border-radius:50%;background-color:${data.statusColor}20;font-size:32px;text-align:center;">
        &#8203;
      </div>
      <h2 style="margin:16px 0 8px 0;font-family:'Courier Prime',Courier,monospace;font-size:20px;color:${data.statusColor};">${data.statusLabel}</h2>
      <p style="margin:0;color:#666;font-size:14px;">${data.statusMessage}</p>
    </div>

    <div style="border-top:1px solid #E5E5E5;margin-bottom:24px;"></div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:8px 0;color:#666;font-size:14px;">Tracking Number</td>
        <td style="padding:8px 0;text-align:right;font-weight:bold;font-size:14px;">${data.trackingNumber}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#666;font-size:14px;">Recipient</td>
        <td style="padding:8px 0;text-align:right;font-size:14px;">${data.recipientName}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#666;font-size:14px;">Shipment Type</td>
        <td style="padding:8px 0;text-align:right;font-size:14px;">${data.shipmentType}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#666;font-size:14px;">Destination</td>
        <td style="padding:8px 0;text-align:right;font-size:14px;">${data.destinationCountry}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#666;font-size:14px;">Updated At</td>
        <td style="padding:8px 0;text-align:right;font-size:14px;">${data.timestamp}</td>
      </tr>
    </table>

    <div style="border-top:1px solid #E5E5E5;padding-top:24px;margin-top:8px;text-align:center;color:#999;font-size:12px;">
      <p style="margin:0 0 4px 0;">Need help? Contact CourierX Support</p>
      <p style="margin:0;">support@courierx.com</p>
    </div>
  `;

  return getEmailWrapper(content);
}
