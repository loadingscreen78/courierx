import { formatCurrency, getEmailWrapper } from './shared';

export interface InvoiceEmailData {
  invoiceNumber: string;
  invoiceDate: string;
  paymentStatus: string;
  trackingNumber: string;
  shipmentType: 'medicine' | 'document' | 'gift';
  recipientName: string;
  destinationCountry: string;
  originAddress: string;
  destinationAddress: string;
  subtotal: number;
  gstAmount: number;
  totalAmount: number;
}

export function renderInvoiceEmail(data: InvoiceEmailData): string {
  const content = `
    <h2 style="margin:0 0 24px 0;font-family:'Courier Prime',Courier,monospace;font-size:20px;color:#262626;">Invoice Confirmation</h2>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:8px 0;color:#666;font-size:14px;">Invoice Number</td>
        <td style="padding:8px 0;text-align:right;font-weight:bold;font-size:14px;">${data.invoiceNumber}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#666;font-size:14px;">Invoice Date</td>
        <td style="padding:8px 0;text-align:right;font-size:14px;">${data.invoiceDate}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#666;font-size:14px;">Payment Status</td>
        <td style="padding:8px 0;text-align:right;font-size:14px;">${data.paymentStatus}</td>
      </tr>
    </table>

    <div style="border-top:1px solid #E5E5E5;margin-bottom:24px;"></div>

    <h3 style="margin:0 0 16px 0;font-family:'Courier Prime',Courier,monospace;font-size:16px;color:#262626;">Shipment Details</h3>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:8px 0;color:#666;font-size:14px;">Tracking Number</td>
        <td style="padding:8px 0;text-align:right;font-weight:bold;font-size:14px;">${data.trackingNumber}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#666;font-size:14px;">Shipment Type</td>
        <td style="padding:8px 0;text-align:right;font-size:14px;">${data.shipmentType}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#666;font-size:14px;">Recipient</td>
        <td style="padding:8px 0;text-align:right;font-size:14px;">${data.recipientName}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#666;font-size:14px;">Destination</td>
        <td style="padding:8px 0;text-align:right;font-size:14px;">${data.destinationCountry}</td>
      </tr>
    </table>

    <h3 style="margin:0 0 16px 0;font-family:'Courier Prime',Courier,monospace;font-size:16px;color:#262626;">Addresses</h3>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:8px 0;color:#666;font-size:14px;">Origin</td>
        <td style="padding:8px 0;text-align:right;font-size:14px;">${data.originAddress}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#666;font-size:14px;">Destination</td>
        <td style="padding:8px 0;text-align:right;font-size:14px;">${data.destinationAddress}</td>
      </tr>
    </table>

    <div style="border-top:1px solid #E5E5E5;margin-bottom:24px;"></div>

    <h3 style="margin:0 0 16px 0;font-family:'Courier Prime',Courier,monospace;font-size:16px;color:#262626;">Cost Breakdown</h3>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:8px 0;color:#666;font-size:14px;">Subtotal</td>
        <td style="padding:8px 0;text-align:right;font-size:14px;">${formatCurrency(data.subtotal)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#666;font-size:14px;">GST</td>
        <td style="padding:8px 0;text-align:right;font-size:14px;">${formatCurrency(data.gstAmount)}</td>
      </tr>
      <tr>
        <td style="padding:12px 0;border-top:2px solid #262626;font-weight:bold;font-size:16px;">Total</td>
        <td style="padding:12px 0;border-top:2px solid #262626;text-align:right;font-weight:bold;font-size:16px;color:#F40000;">${formatCurrency(data.totalAmount)}</td>
      </tr>
    </table>

    <div style="border-top:1px solid #E5E5E5;padding-top:24px;margin-top:8px;text-align:center;color:#999;font-size:12px;">
      <p style="margin:0 0 4px 0;">Need help? Contact CourierX Support</p>
      <p style="margin:0;">support@courierx.com</p>
    </div>
  `;

  return getEmailWrapper(content);
}