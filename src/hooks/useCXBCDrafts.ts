import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BookingDraft {
  id: string;
  partner_id: string;
  shipment_type: string;
  destination_country: string | null;
  weight_grams: number | null;
  declared_value: number | null;
  profit_margin: number | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  customer_address: string | null;
  customer_city: string | null;
  customer_state: string | null;
  customer_pincode: string | null;
  notes: string | null;
  payment_method: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

export interface DraftFormData {
  shipment_type: string;
  destination_country?: string;
  weight_grams?: number;
  declared_value?: number;
  profit_margin?: number;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_address?: string;
  customer_city?: string;
  customer_state?: string;
  customer_pincode?: string;
  notes?: string;
  payment_method?: string;
}

export const useCXBCDrafts = (partnerId: string | undefined) => {
  const queryClient = useQueryClient();

  const { data: drafts, isLoading } = useQuery({
    queryKey: ['cxbc-drafts', partnerId],
    queryFn: async () => {
      if (!partnerId) return [];
      
      const { data, error } = await supabase
        .from('cxbc_booking_drafts')
        .select('*')
        .eq('partner_id', partnerId)
        .gt('expires_at', new Date().toISOString())
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as BookingDraft[];
    },
    enabled: !!partnerId,
  });

  const saveDraft = useMutation({
    mutationFn: async ({ draftId, data }: { draftId?: string; data: DraftFormData }) => {
      if (!partnerId) throw new Error('Partner ID required');

      if (draftId) {
        // Update existing draft
        const { error } = await supabase
          .from('cxbc_booking_drafts')
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', draftId);

        if (error) throw error;
        return draftId;
      } else {
        // Create new draft
        const { data: newDraft, error } = await supabase
          .from('cxbc_booking_drafts')
          .insert({
            partner_id: partnerId,
            ...data,
          })
          .select()
          .single();

        if (error) throw error;
        return newDraft.id;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cxbc-drafts', partnerId] });
      toast.success('Draft saved successfully');
    },
    onError: (error) => {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft');
    },
  });

  const deleteDraft = useMutation({
    mutationFn: async (draftId: string) => {
      const { error } = await supabase
        .from('cxbc_booking_drafts')
        .delete()
        .eq('id', draftId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cxbc-drafts', partnerId] });
      toast.success('Draft deleted');
    },
    onError: (error) => {
      console.error('Error deleting draft:', error);
      toast.error('Failed to delete draft');
    },
  });

  return {
    drafts: drafts || [],
    isLoading,
    saveDraft,
    deleteDraft,
  };
};
