export type ShipmentLike = { status: string };

export function filterActiveShipments<T extends ShipmentLike>(shipments: T[]): T[] {
  return shipments.filter((s) => !['delivered', 'cancelled'].includes(s.status));
}

export function filterDeliveredShipments<T extends ShipmentLike>(shipments: T[]): T[] {
  return shipments.filter((s) => s.status === 'delivered');
}

export function filterCancelledShipments<T extends ShipmentLike>(shipments: T[]): T[] {
  return shipments.filter((s) => s.status === 'cancelled');
}
