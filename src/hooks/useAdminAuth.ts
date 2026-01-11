import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useAdminAuth = () => {
  const { user, isLoading: authLoading } = useAuth();

  const { data: isAdmin, isLoading: roleLoading } = useQuery({
    queryKey: ['admin-role', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      const { data, error } = await supabase
        .rpc('has_role', { _user_id: user.id, _role: 'admin' });
      
      if (error) {
        console.error('Error checking admin role:', error);
        return false;
      }
      
      return data === true;
    },
    enabled: !!user?.id,
  });

  return {
    isAdmin: isAdmin ?? false,
    isLoading: authLoading || roleLoading,
    user,
  };
};
