export type ShipmentStatus =
  | 'confirmed'
  | 'picked_up'
  | 'at_warehouse'
  | 'qc_passed'
  | 'qc_failed'
  | 'in_transit'
  | 'customs_clearance'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface StatusConfig {
  label: string;
  message: string;
  color: string;
  icon: string;
}

export const STATUS_CONFIG: Record<ShipmentStatus, StatusConfig> = {
  confirmed:         { label: 'Confirmed',         message: 'Your shipment has been confirmed and is being processed.',          color: '#16A34A', icon: '✅' },
  picked_up:         { label: 'Picked Up',         message: 'Your shipment has been picked up by our courier.',                 color: '#F97316', icon: '📦' },
  at_warehouse:      { label: 'At Warehouse',      message: 'Your shipment has arrived at our warehouse for processing.',       color: '#F97316', icon: '🏭' },
  qc_passed:         { label: 'QC Passed',         message: 'Your shipment has passed quality control checks.',                 color: '#16A34A', icon: '✅' },
  qc_failed:         { label: 'QC Failed',         message: 'Your shipment did not pass quality control. We will contact you.', color: '#F40000', icon: '❌' },
  in_transit:        { label: 'In Transit',        message: 'Your shipment is on its way to the destination.',                  color: '#F97316', icon: '✈️' },
  customs_clearance: { label: 'Customs Clearance', message: 'Your shipment is undergoing customs clearance.',                   color: '#F97316', icon: '🛃' },
  out_for_delivery:  { label: 'Out for Delivery',  message: 'Your shipment is out for delivery to the recipient.',              color: '#F97316', icon: '🚚' },
  delivered:         { label: 'Delivered',          message: 'Your shipment has been delivered successfully.',                   color: '#16A34A', icon: '🎉' },
  cancelled:         { label: 'Cancelled',          message: 'Your shipment has been cancelled.',                                color: '#F40000', icon: '🚫' },
};

export function getStatusConfig(status: ShipmentStatus): StatusConfig {
  return STATUS_CONFIG[status];
}

export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function getEmailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CourierX Notification</title>
</head>
<body style="margin:0;padding:0;background-color:#FAFAF8;font-family:'Courier Prime',Courier,monospace;color:#262626;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAFAF8;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#FFFFFF;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="background-color:#F40000;padding:24px 32px;">
              <h1 style="margin:0;font-family:'Courier Prime',Courier,monospace;font-size:24px;font-weight:bold;color:#FFFFFF;">CourierX</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
