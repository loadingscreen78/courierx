import type { Shipment } from '@/hooks/useShipments';

const FINAL_STATUSES = ['delivered', 'cancelled'] as const;

export function filterActiveShipments(shipments: Shipment[]): Shipment[] {
  return shipments.filter((shipment) => !FINAL_STATUSES.includes(shipment.status as typeof FINAL_STATUSES[number]));
}

export function filterDeliveredShipments(shipments: Shipment[]): Shipment[] {
  return shipments.filter((shipment) => shipment.status === 'delivered');
}