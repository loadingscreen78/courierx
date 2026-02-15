import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type AddressType = 'pickup' | 'delivery';
export type AddressLabel = 'home' | 'office' | 'other';

export interface Address {
  id: string;
  user_id: string;
  type: AddressType;
  label: AddressLabel;
  full_name: string;
  phone: string;
  address_line_1: string;
  address_line_2?: string | null;
  city: string;
  state?: string | null;
  pincode?: string | null;
  zipcode?: string | null;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export type AddressInsert = Omit<Address, 'id' | 'created_at' | 'updated_at'>;
export type AddressUpdate = Partial<AddressInsert>;

export const useAddresses = () => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAddresses = async () => {
    if (!user) {
      setAddresses([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await (supabase
        .from('addresses') as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAddresses((data as Address[]) || []);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      toast.error('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  const addAddress = async (addressData: Omit<AddressInsert, 'user_id'>) => {
    if (!user) {
      toast.error('Please sign in to add an address');
      return null;
    }

    try {
      // If this is set as default, unset other defaults of same type
      if (addressData.is_default) {
        await supabase
          .from('addresses')
          .update({ is_default: false } as any)
          .eq('user_id', user.id)
          .eq('type', addressData.type);
      }

      const { data, error } = await supabase
        .from('addresses')
        .insert([{ ...addressData, user_id: user.id }] as any)
        .select()
        .single();

      if (error) throw error;
      
      setAddresses(prev => [data as Address, ...prev]);
      toast.success('Address added successfully');
      return data as Address;
    } catch (error) {
      console.error('Error adding address:', error);
      toast.error('Failed to add address');
      return null;
    }
  };

  const updateAddress = async (id: string, updates: AddressUpdate) => {
    if (!user) return false;

    try {
      // If setting as default, unset other defaults of same type
      if (updates.is_default) {
        const address = addresses.find(a => a.id === id);
        if (address) {
          await (supabase
            .from('addresses') as any)
            .update({ is_default: false })
            .eq('user_id', user.id)
            .eq('type', address.type);
        }
      }

      const { error } = await (supabase
        .from('addresses') as any)
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setAddresses(prev => prev.map(a => 
        a.id === id ? { ...a, ...updates } as Address : a
      ));
      toast.success('Address updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating address:', error);
      toast.error('Failed to update address');
      return false;
    }
  };

  const deleteAddress = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await (supabase
        .from('addresses') as any)
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setAddresses(prev => prev.filter(a => a.id !== id));
      toast.success('Address deleted');
      return true;
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error('Failed to delete address');
      return false;
    }
  };

  const setDefaultAddress = async (id: string, type: AddressType) => {
    return updateAddress(id, { is_default: true });
  };

  useEffect(() => {
    fetchAddresses();
  }, [user]);

  return {
    addresses,
    loading,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    refetch: fetchAddresses,
  };
};
