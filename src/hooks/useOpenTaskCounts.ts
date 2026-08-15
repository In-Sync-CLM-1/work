import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { fetchAllRows } from '@/lib/fetchAllRows';
import { useAuth } from '@/lib/auth-context';
import { useTaskDepartments } from '@/hooks/useTaskDepartments';

interface OpenRow {
  department_id: string | null;
  status: 'pending' | 'in_progress';
  assigned_to: string;
  assigned_by: string;
}

export interface OpenCounts {
  pending: number;
  in_progress: number;
}

/**
 * Pending and in-progress counts for the sidebar, per department plus an
 * organisation-wide total.
 *
 * Only unfinished work is fetched — a few dozen rows even for an org with
 * thousands of tasks — so this stays cheap enough to sit in the layout on
 * every page.
 *
 * A department whose list shows only your own tasks ('mine' visibility, e.g.
 * General) is counted the same way, so the badge always matches what you will
 * actually see when you open it.
 */
export function useOpenTaskCounts() {
  const { user, orgId } = useAuth();
  const { departments } = useTaskDepartments();

  const { data: rows = [] } = useQuery({
    queryKey: ['open-task-counts', orgId],
    enabled: !!user && !!orgId,
    staleTime: 30_000,
    queryFn: async () =>
      fetchAllRows<OpenRow>(() => {
        const q = supabase
          .from('tasks')
          .select('department_id, status, assigned_to, assigned_by')
          .in('status', ['pending', 'in_progress']);
        // Scope to the organisation being worked in — see useTasks.
        return orgId ? q.eq('org_id', orgId) : q;
      }),
  });

  const tally = (subset: OpenRow[]): OpenCounts => ({
    pending: subset.filter((r) => r.status === 'pending').length,
    in_progress: subset.filter((r) => r.status === 'in_progress').length,
  });

  const mine = (r: OpenRow) => r.assigned_to === user?.id || r.assigned_by === user?.id;

  const byDepartmentKey: Record<string, OpenCounts> = {};
  for (const d of departments) {
    const inDept = rows.filter((r) => r.department_id === d.id);
    byDepartmentKey[d.key] = tally(d.visibility === 'mine' ? inDept.filter(mine) : inDept);
  }

  return { total: tally(rows), byDepartmentKey };
}
