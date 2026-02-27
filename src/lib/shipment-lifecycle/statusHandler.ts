import { ShipmentRow, ShipmentStatus, ShipmentLeg } from './types';
import { getServiceRoleClient } from './supabaseAdmin';

const WAREHOUSE_ADDRESS = process.env.WAREHOUSE_ADDRESS ?? 'CourierX Warehouse';

/**
 * Dispatches side effects after a successful status update.
 * Called by updateShipmentStatus after the DB transaction commits.
 */
export async function handleStatusChange(
  shipment: ShipmentRow,
  newStatus: ShipmentStatus,
  newLeg: ShipmentLeg
): Promise<void> {
  // DELIVERED on DOMESTIC leg + warehouse address match → transition to COUNTER
  if (newStatus === 'DELIVERED' && newLeg === 'DOMESTIC') {
    if (shipment.destination_address.includes(WAREHOUSE_ADDRESS)) {
      const { updateShipmentStatus } = await import('./stateMachine');
      await updateShipmentStatus({
        shipmentId: shipment.id,
        newStatus: 'ARRIVED_AT_WAREHOUSE',
        newLeg: 'COUNTER',
        source: 'SYSTEM',
        metadata: { trigger: 'domestic_delivered_warehouse_match' },
        expectedVersion: shipment.version,
      });
    }
    return;
  }

  // INTL_OUT_FOR_DELIVERY → send SMS notification, set alert_sent=true
  if (newStatus === 'INTL_OUT_FOR_DELIVERY') {
    if (!shipment.alert_sent) {
      console.log(
        `[statusHandler] SMS notification: Shipment ${shipment.id} is out for international delivery. ` +
        `Recipient: ${shipment.recipient_name}, Phone: ${shipment.recipient_phone}`
      );

      const supabase = getServiceRoleClient();
      await supabase
        .from('shipments')
        .update({ alert_sent: true })
        .eq('id', shipment.id);
    }

    return;
  }

  // INTL_DELIVERED on INTERNATIONAL leg → transition to COMPLETED
  if (newStatus === 'INTL_DELIVERED' && newLeg === 'INTERNATIONAL') {
    const { updateShipmentStatus } = await import('./stateMachine');
    await updateShipmentStatus({
      shipmentId: shipment.id,
      newStatus: 'INTL_DELIVERED',
      newLeg: 'COMPLETED',
      source: 'SYSTEM',
      metadata: { trigger: 'international_delivered_completion' },
      expectedVersion: shipment.version,
    });
    return;
  }
}
