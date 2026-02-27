import { ShipmentStatus } from './types';

/**
 * Maps raw Nimbus API status strings to internal ShipmentStatus values.
 * Unknown statuses return null — no transition is triggered.
 * Raw provider strings are never stored or exposed directly.
 */
export const NIMBUS_STATUS_MAP: Record<string, ShipmentStatus> = {
  'Picked Up': 'PICKED_UP',
  'In Transit': 'IN_TRANSIT',
  'Out for Delivery': 'OUT_FOR_DELIVERY',
  'Delivered': 'DELIVERED',
};

export function mapNimbusStatus(rawStatus: string): ShipmentStatus | null {
  if (Object.hasOwn(NIMBUS_STATUS_MAP, rawStatus)) {
    return NIMBUS_STATUS_MAP[rawStatus];
  }
  return null;
}
