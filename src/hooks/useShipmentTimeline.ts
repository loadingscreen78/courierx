import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TimelineEntry } from '@/lib/shipment-lifecycle/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export function useShipmentTimeline(shipmentId: string | undefined) {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const knownIdsRef = useRef<Set<string>>(new Set());

  const fetchTimeline = useCallback(async () => {
    if (!shipmentId) return;
    const { data } = await db
      .from('shipment_timeline')
      .select('*')
      .eq('shipment_id', shipmentId)
      .order('created_at', { ascending: true });
    const fetched = (data as unknown as TimelineEntry[]) ?? [];
    knownIdsRef.current = new Set(fetched.map(e => e.id));
    setEntries(fetched);
    setLoading(false);
  }, [shipmentId]);

  useEffect(() => {
    if (!shipmentId) {
      setEntries([]);
      setLoading(false);
      knownIdsRef.current.clear();
      return;
    }

    setLoading(true);
    fetchTimeline();

    // Realtime subscription for new timeline entries with reconnection handling
    const channel = db
      .channel(`timeline-${shipmentId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'shipment_timeline',
        filter: `shipment_id=eq.${shipmentId}`,
      }, (payload) => {
        const newEntry = payload.new as unknown as TimelineEntry;
        // Ignore duplicates that may arrive after reconnection
        if (knownIdsRef.current.has(newEntry.id)) return;
        knownIdsRef.current.add(newEntry.id);
        setEntries(prev => [...prev, newEntry]);
      })
      .subscribe((status) => {
        // On reconnection, perform a full refresh to catch any missed entries
        if (status === 'CHANNEL_ERROR') {
          console.warn('[useShipmentTimeline] Channel error, will refresh on reconnect');
        }
        if (status === 'SUBSCRIBED') {
          // Re-fetch to catch entries that may have been missed during disconnection
          fetchTimeline();
        }
      });

    return () => {
      db.removeChannel(channel);
    };
  }, [shipmentId, fetchTimeline]);

  return { entries, loading };
}
