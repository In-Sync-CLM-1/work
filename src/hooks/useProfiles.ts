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
      // A single read returns at most 1,000 rows, so page through until done.
      const PAGE = 1000;
      const all: Profile[] = [];
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await supabase.rpc('org_members', { p_term: null, p_limit: PAGE, p_offset: from });
        if (error) throw error;
        all.push(...(data as Profile[]));
        if (!data || data.length < PAGE) break;
      }
      return all;
    },
  });

  return { profiles, isLoading };
}
