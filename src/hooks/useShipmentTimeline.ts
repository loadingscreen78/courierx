import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TimelineEntry } from '@/lib/shipment-lifecycle/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export function useShipmentTimeline(
  shipmentId: string | undefined,
  fallbackStatus?: string,
  fallbackCreatedAt?: string,
) {
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
    let fetched = (data as unknown as TimelineEntry[]) ?? [];

    // If no entries exist (old shipment pre-lifecycle migration), synthesise one
    // from the shipment's current_status so the UI never shows "No timeline entries"
    if (fetched.length === 0 && fallbackStatus) {
      fetched = [{
        id: `synthetic-${shipmentId}`,
        shipment_id: shipmentId,
        status: fallbackStatus,
        leg: 'COUNTER',
        source: 'SYSTEM',
        metadata: {},
        created_at: fallbackCreatedAt ?? new Date().toISOString(),
      } as unknown as TimelineEntry];
    }

    knownIdsRef.current = new Set(fetched.map(e => e.id));
    setEntries(fetched);
    setLoading(false);
  }, [shipmentId, fallbackStatus, fallbackCreatedAt]);

  useEffect(() => {
    if (!shipmentId) {
      setEntries([]);
      setLoading(false);
      knownIdsRef.current.clear();
      return;
    }

    setLoading(true);
    fetchTimeline();

    const channel = db
      .channel(`timeline-${shipmentId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'shipment_timeline',
        filter: `shipment_id=eq.${shipmentId}`,
      }, (payload: any) => {
        const newEntry = payload.new as unknown as TimelineEntry;
        if (knownIdsRef.current.has(newEntry.id)) return;
        knownIdsRef.current.add(newEntry.id);
        // Remove any synthetic entry when a real one arrives
        setEntries(prev => [
          ...prev.filter(e => !e.id.startsWith('synthetic-')),
          newEntry,
        ]);
      })
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          fetchTimeline();
        }
      });

    return () => {
      db.removeChannel(channel);
    };
  }, [shipmentId, fetchTimeline]);

  return { entries, loading };
}
