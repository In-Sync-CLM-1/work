import { useQuery } from '@tanstack/react-query';
import type { Profile } from '@/types/task';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

/** Active people in the organisation being worked in — the assignee list. */
export function useProfiles() {
  const { orgId } = useAuth();

  const { data: profiles = [], isLoading } = useQuery<Profile[]>({
    queryKey: ['profiles', orgId],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*')
        .eq('is_active', true)
        .order('full_name', { ascending: true });

      // Scope to the organisation being worked in. Without this a platform
      // admin, who may read every organisation, would get every tenant's
      // people offered as assignees.
      if (orgId) query = query.eq('org_id', orgId);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  return { profiles, isLoading };
}
