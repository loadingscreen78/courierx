export type ShipmentStatus =
  // Legacy lowercase (kept for backward compatibility)
  | 'confirmed'
  | 'picked_up'
  | 'at_warehouse'
  | 'qc_passed'
  | 'qc_failed'
  | 'in_transit'
  | 'customs_clearance'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  // Lifecycle uppercase statuses (from state machine)
  | 'PENDING'
  | 'BOOKING_CONFIRMED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'ARRIVED_AT_WAREHOUSE'
  | 'QUALITY_CHECKED'
  | 'PACKAGED'
  | 'DISPATCH_APPROVED'
  | 'DISPATCHED'
  | 'IN_INTERNATIONAL_TRANSIT'
  | 'CUSTOMS_CLEARANCE'
  | 'INTL_OUT_FOR_DELIVERY'
  | 'INTL_DELIVERED'
  | 'FAILED';

export interface StatusConfig {
  label: string;
  message: string;
  color: string;
  icon: string;
}

const STATUS_CONFIG_MAP: Record<string, StatusConfig> = {
  // Legacy lowercase
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

  // Lifecycle uppercase
  PENDING:                  { label: 'Pending',                   message: 'Your shipment booking is being processed.',                              color: '#F97316', icon: '⏳' },
  BOOKING_CONFIRMED:        { label: 'Booking Confirmed',         message: 'Your shipment has been confirmed and pickup is scheduled.',               color: '#16A34A', icon: '✅' },
  PICKED_UP:                { label: 'Picked Up',                 message: 'Your shipment has been picked up by our domestic courier.',               color: '#F97316', icon: '📦' },
  IN_TRANSIT:               { label: 'In Transit',                message: 'Your shipment is in transit to our warehouse.',                          color: '#F97316', icon: '🚛' },
  OUT_FOR_DELIVERY:         { label: 'Out for Delivery',          message: 'Your shipment is out for delivery to our warehouse.',                    color: '#F97316', icon: '🚚' },
  DELIVERED:                { label: 'Delivered to Warehouse',    message: 'Your shipment has been delivered to our processing warehouse.',          color: '#16A34A', icon: '📬' },
  ARRIVED_AT_WAREHOUSE:     { label: 'Arrived at Warehouse',     message: 'Your shipment has arrived at our warehouse and is being processed.',     color: '#F97316', icon: '🏭' },
  QUALITY_CHECKED:          { label: 'Quality Check Passed',     message: 'Your shipment has passed quality control and is ready for packaging.',   color: '#16A34A', icon: '✅' },
  PACKAGED:                 { label: 'Packaged',                  message: 'Your shipment has been packaged and is ready for international dispatch.', color: '#F97316', icon: '📦' },
  DISPATCH_APPROVED:        { label: 'Dispatch Approved',         message: 'Your shipment has been approved for international dispatch.',             color: '#16A34A', icon: '✈️' },
  DISPATCHED:               { label: 'Dispatched',                message: 'Your shipment has been dispatched internationally.',                     color: '#F97316', icon: '🛫' },
  IN_INTERNATIONAL_TRANSIT: { label: 'In International Transit', message: 'Your shipment is in transit to the destination country.',                color: '#F97316', icon: '✈️' },
  CUSTOMS_CLEARANCE:        { label: 'Customs Clearance',        message: 'Your shipment is undergoing customs clearance at the destination.',      color: '#F97316', icon: '🛃' },
  INTL_OUT_FOR_DELIVERY:    { label: 'Out for Delivery',         message: 'Your shipment is out for final delivery to the recipient.',              color: '#F97316', icon: '🚚' },
  INTL_DELIVERED:           { label: 'Delivered',                 message: 'Your shipment has been delivered successfully to the recipient.',        color: '#16A34A', icon: '🎉' },
  FAILED:                   { label: 'Failed',                    message: 'Your shipment booking could not be completed. Please contact support.',  color: '#F40000', icon: '❌' },
};

// Keep the old export name for backward compatibility
export const STATUS_CONFIG = STATUS_CONFIG_MAP as Record<ShipmentStatus, StatusConfig>;

export function getStatusConfig(status: ShipmentStatus | string): StatusConfig {
  return STATUS_CONFIG_MAP[status] || {
    label: status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    message: `Your shipment status has been updated to ${status}.`,
    color: '#F97316',
    icon: '📋',
  };
}

export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function getEmailWrapper(content: string): string {
  return '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>CourierX Notification</title>\n</head>\n<body style="margin:0;padding:0;background-color:#FAFAF8;font-family:\'Courier Prime\',Courier,monospace;color:#262626;">\n  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAFAF8;">\n    <tr>\n      <td align="center" style="padding:24px 16px;">\n        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#FFFFFF;border-radius:8px;overflow:hidden;">\n          <tr>\n            <td style="background-color:#F40000;padding:24px 32px;">\n              <h1 style="margin:0;font-family:\'Courier Prime\',Courier,monospace;font-size:24px;font-weight:bold;color:#FFFFFF;">CourierX</h1>\n            </td>\n          </tr>\n          <tr>\n            <td style="padding:32px;">\n              ' + content + '\n            </td>\n          </tr>\n        </table>\n      </td>\n    </tr>\n  </table>\n</body>\n</html>';
}
