import { ShipmentStatus } from './types';

/**
 * Maps raw Nimbus API status strings to internal ShipmentStatus values.
 * Unknown statuses return null — no transition is triggered.
 * Raw provider strings are never stored or exposed directly.
 *
 * Covers all known NimbusPost domestic tracking status strings.
 */
export const NIMBUS_STATUS_MAP: Record<string, ShipmentStatus> = {
  // Pickup
  'Picked Up': 'PICKED_UP',
  'Shipment Picked Up': 'PICKED_UP',
  'Pickup Done': 'PICKED_UP',
  'Pickup Successful': 'PICKED_UP',

  // In Transit
  'In Transit': 'IN_TRANSIT',
  'Shipment In Transit': 'IN_TRANSIT',
  'Reached Hub': 'IN_TRANSIT',
  'Reached Destination Hub': 'IN_TRANSIT',
  'Dispatched': 'IN_TRANSIT',
  'Shipment Dispatched': 'IN_TRANSIT',
  'Forwarded': 'IN_TRANSIT',
  'Shipment Forwarded': 'IN_TRANSIT',
  'Arrived At Hub': 'IN_TRANSIT',
  'Arrived At Destination Hub': 'IN_TRANSIT',
  'Bag Received': 'IN_TRANSIT',
  'Bag Dispatched': 'IN_TRANSIT',
  'Misrouted': 'IN_TRANSIT',
  'Shipment Misrouted': 'IN_TRANSIT',

  // Out for Delivery
  'Out for Delivery': 'OUT_FOR_DELIVERY',
  'Out For Delivery': 'OUT_FOR_DELIVERY',
  'Shipment Out For Delivery': 'OUT_FOR_DELIVERY',
  'With Delivery Boy': 'OUT_FOR_DELIVERY',

  // Delivered
  'Delivered': 'DELIVERED',
  'Shipment Delivered': 'DELIVERED',
  'Delivery Done': 'DELIVERED',
  'Delivery Successful': 'DELIVERED',
};

export function mapNimbusStatus(rawStatus: string): ShipmentStatus | null {
  // Exact match first
  if (Object.hasOwn(NIMBUS_STATUS_MAP, rawStatus)) {
    return NIMBUS_STATUS_MAP[rawStatus];
  }
  // Case-insensitive fallback
  const lower = rawStatus.toLowerCase();
  for (const [key, val] of Object.entries(NIMBUS_STATUS_MAP)) {
    if (key.toLowerCase() === lower) return val;
  }
  return null;
}
