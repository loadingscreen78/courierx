import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Shipment } from './useShipments';

export interface UseCXBCShipmentsReturn {
  shipments: Shipment[];
  activeShipments: Shipment[];
  deliveredShipments: Shipment[];
  failedShipments: Shipment[];
  todayShipments: Shipment[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useCXBCShipments(partnerId: string | undefined): UseCXBCShipmentsReturn {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const versionMapRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (!partnerId) {
      setShipments([]);
      setLoading(false);
      return;
    }

    fetchShipments();

    // Set up real-time subscription with reconnection handling
    const subscription = supabase
      .channel(`cxbc_shipments_${partnerId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'shipments',
          filter: `cxbc_partner_id=eq.${partnerId}`,
        },
        (payload: any) => {
          handleRealtimeEvent(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'shipments',
          filter: `cxbc_partner_id=eq.${partnerId}`,
        },
        (payload: any) => {
          handleRealtimeEvent(payload);
        }
      )
      .subscribe((status: string) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('[useCXBCShipments] Channel error, will refresh on reconnect');
        }
        if (status === 'SUBSCRIBED') {
          // Re-fetch on reconnection to catch missed events
          fetchShipments();
        }
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [partnerId]);

  function handleRealtimeEvent(payload: any) {
    // Version-based stale event filtering
    if (payload.new && typeof payload.new.version === 'number') {
      const id = payload.new.id;
      const incomingVersion = payload.new.version;
      const knownVersion = versionMapRef.current.get(id);
      if (knownVersion !== undefined && incomingVersion < knownVersion) return;
    }
    fetchShipments();
  }

  async function fetchShipments() {
    if (!partnerId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('shipments')
        .select('*')
        .eq('cxbc_partner_id', partnerId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const fetched = (data as unknown as Shipment[]) || [];
      setShipments(fetched);

      // Track known versions for stale event filtering
      for (const s of fetched) {
        if (s.id && typeof s.version === 'number') {
          versionMapRef.current.set(s.id, s.version);
        }
      }
    } catch (err) {
      console.error('[useCXBCShipments] Error fetching shipments:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch shipments');
    } finally {
      setLoading(false);
    }
  }

  // Computed properties using lifecycle fields
  const activeShipments = useMemo(
    () => shipments.filter((s) => s.current_leg !== 'COMPLETED' && s.current_status !== 'FAILED'),
    [shipments]
  );

  const deliveredShipments = useMemo(
    () => shipments.filter((s) => s.current_leg === 'COMPLETED'),
    [shipments]
  );

  const failedShipments = useMemo(
    () => shipments.filter((s) => s.current_status === 'FAILED'),
    [shipments]
  );

  const todayShipments = useMemo(() => {
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    return shipments.filter((s) => new Date(s.created_at) >= todayMidnight);
  }, [shipments]);

  return {
    shipments,
    activeShipments,
    deliveredShipments,
    failedShipments,
    todayShipments,
    loading,
    error,
    refetch: fetchShipments,
  };
}
