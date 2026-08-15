import { useQuery } from '@tanstack/react-query';
import type { TaskDepartment, TaskSubcategory } from '@/types/task';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

/**
 * Departments and their sub-category lists for the current organisation.
 *
 * Organisations that have none configured get an empty list, and the UI falls
 * back to a single combined task list — which is what every org except
 * Redefine Marcom sees today.
 */
export function useTaskDepartments() {
  const { user, orgId } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['task-departments', orgId],
    enabled: !!user && !!orgId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      // Scoped explicitly to the organisation being worked in — a platform
      // admin can read every organisation's departments, and merging them
      // would put another tenant's teams in this sidebar.
      const [deptRes, subRes] = await Promise.all([
        supabase
          .from('task_departments')
          .select('*')
          .eq('org_id', orgId!)
          .eq('is_active', true)
          .order('sort_order'),
        supabase
          .from('task_subcategories')
          .select('*')
          .eq('org_id', orgId!)
          .eq('is_active', true)
          .order('sort_order'),
      ]);

      if (deptRes.error) throw deptRes.error;
      if (subRes.error) throw subRes.error;

      const subs = (subRes.data ?? []) as TaskSubcategory[];
      return ((deptRes.data ?? []) as TaskDepartment[]).map((d) => ({
        ...d,
        subcategories: subs.filter((s) => s.department_id === d.id),
      }));
    },
  });

  const departments = data ?? [];

  return {
    departments,
    isLoading,
    // Only show department UI once an org actually has them configured.
    hasDepartments: departments.length > 0,
    byKey: (key: string) => departments.find((d) => d.key === key),
    byId: (id: string | null | undefined) =>
      id ? departments.find((d) => d.id === id) : undefined,
  };
}
