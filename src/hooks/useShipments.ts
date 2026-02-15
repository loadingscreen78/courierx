import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Shipment {
  id: string;
  tracking_number: string;
  shipment_type: 'medicine' | 'document' | 'gift';
  status: string;
  origin_address: string;
  destination_address: string;
  destination_country: string;
  recipient_name: string;
  recipient_phone: string | null;
  recipient_email: string | null;
  declared_value: number;
  shipping_cost: number;
  gst_amount: number;
  total_amount: number;
  weight_kg: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  pickup_address?: any;
  consignee_address?: any;
}

export interface ShipmentWithItems extends Shipment {
  medicine_items?: any[];
  shipment_documents?: any[];
  shipment_addons?: any[];
}

export function useShipments() {
  const { user } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setShipments([]);
      setLoading(false);
      return;
    }

    fetchShipments();

    // Set up real-time subscription
    const subscription = supabase
      .channel('shipments_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shipments',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchShipments();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  async function fetchShipments() {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('shipments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setShipments(data || []);
    } catch (err) {
      console.error('[useShipments] Error fetching shipments:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch shipments');
    } finally {
      setLoading(false);
    }
  }

  // Get active shipments (not delivered or cancelled)
  const activeShipments = shipments.filter(
    (s) => !['delivered', 'cancelled'].includes(s.status)
  );

  // Get delivered shipments
  const deliveredShipments = shipments.filter((s) => s.status === 'delivered');

  // Get shipments by status
  const getShipmentsByStatus = (status: string) =>
    shipments.filter((s) => s.status === status);

  // Get shipment count by type
  const getCountByType = (type: 'medicine' | 'document' | 'gift') =>
    shipments.filter((s) => s.shipment_type === type).length;

  return {
    shipments,
    activeShipments,
    deliveredShipments,
    loading,
    error,
    refetch: fetchShipments,
    getShipmentsByStatus,
    getCountByType,
  };
}

export async function getShipmentDetails(shipmentId: string): Promise<ShipmentWithItems | null> {
  try {
    // Get shipment
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .select('*')
      .eq('id', shipmentId)
      .single();

    if (shipmentError) throw shipmentError;

    // Get medicine items if medicine shipment
    let medicine_items = [];
    if (shipment.shipment_type === 'medicine') {
      const { data: items } = await supabase
        .from('medicine_items')
        .select('*')
        .eq('shipment_id', shipmentId);
      medicine_items = items || [];
    }

    // Get documents
    const { data: documents } = await supabase
      .from('shipment_documents')
      .select('*')
      .eq('shipment_id', shipmentId);

    // Get addons
    const { data: addons } = await supabase
      .from('shipment_addons')
      .select('*')
      .eq('shipment_id', shipmentId);

    return {
      ...shipment,
      medicine_items,
      shipment_documents: documents || [],
      shipment_addons: addons || [],
    };
  } catch (error) {
    console.error('[getShipmentDetails] Error:', error);
    return null;
  }
}
