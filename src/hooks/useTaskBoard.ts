import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Task, TaskMilestone, TaskStatus } from '@/types/task';
import { supabase } from '@/lib/supabase';
import { fetchAllRows } from '@/lib/fetchAllRows';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';

export interface BoardFilters {
  priority?: string;
  assigned_to?: string;
  search?: string;
}

/**
 * Flat (un-paginated) task fetch + milestones, for the Board (Kanban) and
 * Timeline (Gantt) views, which need the whole book of work at once rather than
 * the paginated list. Also exposes a status mutation for drag-and-drop moves.
 */
export function useTaskBoard(filters: BoardFilters = {}) {
  const queryClient = useQueryClient();
  const { user, orgId } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['task-board', filters, orgId],
    enabled: !!user,
    queryFn: async () => {
      // Live work only. A flat 500-row cap quietly hid tasks once an org had
      // more than that; carrying years of finished history made it worse. The
      // Board and Timeline are for work in flight, so closed, cancelled and
      // completed tasks are excluded rather than competing for the cap — the
      // list view is where history is browsed.
      const tasks = await fetchAllRows<Task>(() => {
        let query = supabase
          .from('tasks')
          .select('*, assigned_user:profiles!tasks_assigned_to_fkey(id,full_name,email,avatar_url)')
          .in('status', ['pending', 'in_progress'])
          .order('due_date', { ascending: true });

        // Scope to the organisation being worked in — see useTasks.
        if (orgId) query = query.eq('org_id', orgId);

        if (filters.priority && filters.priority !== 'all') query = query.eq('priority', filters.priority);
        if (filters.assigned_to) query = query.eq('assigned_to', filters.assigned_to);
        if (filters.search) {
          query = query.or(`task_name.ilike.%${filters.search}%,task_number.ilike.%${filters.search}%`);
        }
        return query;
      });

      const ms = await fetchAllRows<TaskMilestone>(() =>
        supabase.from('task_milestones').select('*'),
      );
      const milestonesByTask: Record<string, TaskMilestone[]> = {};
      for (const m of ms) {
        (milestonesByTask[m.task_id] ??= []).push(m);
      }

      return { tasks, milestonesByTask };
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
      const { error } = await supabase.from('tasks').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-board'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-stats'] });
    },
    onError: (e: Error) => toast.error(`Couldn't move task: ${e.message}`),
  });

  return {
    tasks: data?.tasks ?? [],
    milestonesByTask: data?.milestonesByTask ?? {},
    isLoading,
    updateStatus,
  };
}
