import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type CXBCPartner = Database['public']['Tables']['cxbc_partners']['Row'];

interface UseCXBCAuthReturn {
  isLoading: boolean;
  isApprovedPartner: boolean;
  partner: CXBCPartner | null;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useCXBCAuth = (): UseCXBCAuthReturn => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isApprovedPartner, setIsApprovedPartner] = useState(false);
  const [partner, setPartner] = useState<CXBCPartner | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPartnerStatus = async () => {
    if (!user) {
      setIsLoading(false);
      setIsApprovedPartner(false);
      setPartner(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('cxbc_partners')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching partner status:', fetchError);
        setError(fetchError.message);
        setIsApprovedPartner(false);
        setPartner(null);
      } else if (data) {
        setIsApprovedPartner(true);
        setPartner(data);
      } else {
        setIsApprovedPartner(false);
        setPartner(null);
      }
    } catch (err) {
      console.error('Error in useCXBCAuth:', err);
      setError('Failed to verify partner status');
      setIsApprovedPartner(false);
      setPartner(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPartnerStatus();
  }, [user]);

  return {
    isLoading,
    isApprovedPartner,
    partner,
    error,
    refetch: fetchPartnerStatus,
  };
};
