import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type CXBCPartner = Database['public']['Tables']['cxbc_partners']['Row'];

export interface UseCXBCAuthReturn {
  isLoading: boolean;
  isApprovedPartner: boolean;
  partner: CXBCPartner | null;
  applicationStatus: 'pending' | 'under_review' | 'rejected' | null;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useCXBCAuth = (): UseCXBCAuthReturn => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isApprovedPartner, setIsApprovedPartner] = useState(false);
  const [partner, setPartner] = useState<CXBCPartner | null>(null);
  const [applicationStatus, setApplicationStatus] = useState<'pending' | 'under_review' | 'rejected' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPartnerStatus = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      setIsApprovedPartner(false);
      setPartner(null);
      setApplicationStatus(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Step 1: Query by user_id first
      const { data: byUserId, error: userIdError } = await supabase
        .from('cxbc_partners')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .maybeSingle();

      if (userIdError) {
        console.error('Error fetching partner by user_id:', userIdError);
        setError(userIdError.message);
        setIsApprovedPartner(false);
        setPartner(null);
        setApplicationStatus(null);
        return;
      }

      if (byUserId) {
        // Found by user_id — no linking needed
        setIsApprovedPartner(true);
        setPartner(byUserId);
        setApplicationStatus(null);
        return;
      }

      // Step 2: Fallback — query by email if no match by user_id
      if (user.email) {
        const { data: byEmail, error: emailError } = await supabase
          .from('cxbc_partners')
          .select('*')
          .eq('email', user.email)
          .eq('status', 'approved')
          .maybeSingle();

        if (emailError) {
          console.error('Error fetching partner by email:', emailError);
          setError(emailError.message);
          setIsApprovedPartner(false);
          setPartner(null);
          setApplicationStatus(null);
          return;
        }

        if (byEmail) {
          // Step 3: Auto-link — update user_id if null or mismatched
          if (!byEmail.user_id || byEmail.user_id !== user.id) {
            const { error: updateError } = await supabase
              .from('cxbc_partners')
              .update({ user_id: user.id })
              .eq('id', byEmail.id);

            if (updateError) {
              console.error('Error auto-linking partner user_id:', updateError);
              // Still grant access even if linking fails — the partner is approved
            } else {
              byEmail.user_id = user.id;
            }
          }

          setIsApprovedPartner(true);
          setPartner(byEmail);
          setApplicationStatus(null);
          return;
        }
      }

      // Step 4: No approved partner found — check applications by email
      setIsApprovedPartner(false);
      setPartner(null);

      if (user.email) {
        const { data: applications, error: appError } = await supabase
          .from('cxbc_partner_applications')
          .select('status, created_at')
          .eq('email', user.email)
          .in('status', ['pending', 'under_review', 'rejected'])
          .order('created_at', { ascending: false })
          .limit(1);

        if (appError) {
          console.error('Error fetching partner applications:', appError);
          // Don't set error — application status is supplementary info
          setApplicationStatus(null);
          return;
        }

        if (applications && applications.length > 0) {
          const latestStatus = applications[0].status as 'pending' | 'under_review' | 'rejected';
          setApplicationStatus(latestStatus);
        } else {
          setApplicationStatus(null);
        }
      } else {
        setApplicationStatus(null);
      }
    } catch (err) {
      console.error('Error in useCXBCAuth:', err);
      setError('Failed to verify partner status');
      setIsApprovedPartner(false);
      setPartner(null);
      setApplicationStatus(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPartnerStatus();
  }, [fetchPartnerStatus]);

  return {
    isLoading,
    isApprovedPartner,
    partner,
    applicationStatus,
    error,
    refetch: fetchPartnerStatus,
  };
};
