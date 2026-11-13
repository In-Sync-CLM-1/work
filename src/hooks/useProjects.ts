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
    staleTime: 60 * 1000,
    queryFn: async () => {
      // Scoped explicitly — see useTaskDepartments. PostgREST caps a response at
      // 1000 rows and the list is now larger, so page through it or the oldest
      // projects silently vanish from the picker.
      const PAGE = 1000;
      const all: ProjectRef[] = [];
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await supabase
          .from('projects')
          .select('id, org_id, project_number, project_name, status')
          .eq('org_id', orgId!)
          .order('created_at', { ascending: false })
          .order('id')
          .range(from, from + PAGE - 1);

        if (error) throw error;
        all.push(...((data ?? []) as ProjectRef[]));
        if (!data || data.length < PAGE) break;
      }
      return all;
    },
  });

  return { projects: data ?? [], isLoading };
}
