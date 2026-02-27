import type { Shipment } from '@/hooks/useShipments';

export function filterActiveShipments(shipments: Shipment[]): Shipment[] {
  return shipments.filter((shipment) => shipment.current_leg !== 'COMPLETED');
}

export function filterDeliveredShipments(shipments: Shipment[]): Shipment[] {
  return shipments.filter((shipment) => shipment.current_leg === 'COMPLETED');
}