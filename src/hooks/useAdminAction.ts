import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type AdminActionType = 'quality_check' | 'package' | 'approve_dispatch';

export interface ActionResult {
  success: boolean;
  error?: string;
  errorCode?: string;
  retryAfterMs?: number;
  shipment?: Record<string, unknown>;
}

export function useAdminAction() {
  const [loading, setLoading] = useState(false);
  const [rateLimitedUntil, setRateLimitedUntil] = useState<number | null>(null);

  const getAuthHeader = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  };

  const handleResponse = async (res: Response): Promise<ActionResult> => {
    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get('Retry-After') ?? '60', 10);
      const retryAfterMs = retryAfter * 1000;
      setRateLimitedUntil(Date.now() + retryAfterMs);
      return { success: false, error: 'Too many requests. Please wait.', retryAfterMs };
    }

    const data = await res.json();

    if (res.status === 409) {
      return {
        success: false,
        error: data.error ?? 'This shipment was updated by another process.',
        errorCode: data.errorCode ?? 'VERSION_CONFLICT',
      };
    }

    if (res.status === 400) {
      return {
        success: false,
        error: data.error ?? 'Invalid transition.',
        errorCode: data.errorCode ?? 'INVALID_TRANSITION',
      };
    }

    if (!res.ok) {
      return {
        success: false,
        error: data.error ?? 'Something went wrong. Please try again.',
        errorCode: data.errorCode,
      };
    }

    return { success: true, shipment: data.shipment };
  };

  const performAction = async (
    shipmentId: string,
    action: AdminActionType,
    expectedVersion: number,
  ): Promise<ActionResult> => {
    const token = await getAuthHeader();
    if (!token) return { success: false, error: 'Not authenticated' };

    setLoading(true);
    try {
      const res = await fetch('/api/shipments/admin-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ shipmentId, action, expectedVersion }),
      });
      return await handleResponse(res);
    } finally {
      setLoading(false);
    }
  };

  const performDispatch = async (
    shipmentId: string,
    expectedVersion: number,
  ): Promise<ActionResult> => {
    const token = await getAuthHeader();
    if (!token) return { success: false, error: 'Not authenticated' };

    setLoading(true);
    try {
      const res = await fetch('/api/shipments/dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ shipmentId, expectedVersion }),
      });
      return await handleResponse(res);
    } finally {
      setLoading(false);
    }
  };

  return { performAction, performDispatch, loading, rateLimitedUntil };
}
