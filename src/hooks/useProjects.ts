import { useQuery } from '@tanstack/react-query';
import type { ProjectRef } from '@/types/task';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

/**
 * The organisation's projects, as a reference list for the task project picker.
 * Newest first, matching how the picker is ordered in RMPL.
 */
export function useProjects() {
  const { user, orgId } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['projects', orgId],
    enabled: !!user && !!orgId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, org_id, project_number, project_name, status')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as ProjectRef[];
    },
  });

  return { projects: data ?? [], isLoading };
}
