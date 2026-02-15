import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type AppRole = 'admin' | 'warehouse_operator' | 'user';

interface AdminAuthState {
  isAdmin: boolean;
  isWarehouseOperator: boolean;
  hasAdminAccess: boolean;
  isLoading: boolean;
  roles: AppRole[];
}

export const useAdminAuth = (): AdminAuthState => {
  const { user } = useAuth();
  const [state, setState] = useState<AdminAuthState>({
    isAdmin: false,
    isWarehouseOperator: false,
    hasAdminAccess: false,
    isLoading: true,
    roles: [],
  });

  useEffect(() => {
    const checkRoles = async () => {
      if (!user) {
        setState({
          isAdmin: false,
          isWarehouseOperator: false,
          hasAdminAccess: false,
          isLoading: false,
          roles: [],
        });
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (error) throw error;

        const roles = (data || []).map(r => r.role as AppRole);
        const isAdmin = roles.includes('admin');
        const isWarehouseOperator = roles.includes('warehouse_operator');

        setState({
          isAdmin,
          isWarehouseOperator,
          hasAdminAccess: isAdmin || isWarehouseOperator,
          isLoading: false,
          roles,
        });
      } catch (error) {
        console.error('Error checking admin roles:', error);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    checkRoles();
  }, [user]);

  return state;
};
