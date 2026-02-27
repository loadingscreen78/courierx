import { ShipmentLeg, ShipmentStatus } from './types';

export const ALLOWED_TRANSITIONS: Record<ShipmentLeg, Partial<Record<ShipmentStatus, ShipmentStatus[]>>> = {
  DOMESTIC: {
    PENDING: ['BOOKING_CONFIRMED', 'FAILED'],
    BOOKING_CONFIRMED: ['PICKED_UP'],
    PICKED_UP: ['IN_TRANSIT'],
    IN_TRANSIT: ['OUT_FOR_DELIVERY'],
    OUT_FOR_DELIVERY: ['DELIVERED'],
  },
  COUNTER: {
    ARRIVED_AT_WAREHOUSE: ['QUALITY_CHECKED'],
    QUALITY_CHECKED: ['PACKAGED'],
    PACKAGED: ['DISPATCH_APPROVED'],
  },
  INTERNATIONAL: {
    DISPATCHED: ['IN_INTERNATIONAL_TRANSIT'],
    IN_INTERNATIONAL_TRANSIT: ['CUSTOMS_CLEARANCE'],
    CUSTOMS_CLEARANCE: ['INTL_OUT_FOR_DELIVERY'],
    INTL_OUT_FOR_DELIVERY: ['INTL_DELIVERED'],
  },
  COMPLETED: {},
};

export function isTransitionAllowed(
  leg: ShipmentLeg,
  fromStatus: ShipmentStatus,
  toStatus: ShipmentStatus
): boolean {
  const legTransitions = ALLOWED_TRANSITIONS[leg];
  const allowed = legTransitions?.[fromStatus];
  return allowed?.includes(toStatus) ?? false;
}
