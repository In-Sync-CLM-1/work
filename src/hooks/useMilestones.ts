import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TaskMilestone, CreateMilestoneInput, UpdateMilestoneInput } from '@/types/task';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';

export function useMilestones(taskId: string) {
  const queryClient = useQueryClient();
  const { user, orgId } = useAuth();

  const { data: milestones = [], isLoading } = useQuery<TaskMilestone[]>({
    queryKey: ['task-milestones', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_milestones')
        .select('*')
        .eq('task_id', taskId)
        .order('sort_order', { ascending: true })
        .order('target_date', { ascending: true });

      if (error) throw error;
      return data as TaskMilestone[];
    },
    enabled: !!taskId,
  });

  useEffect(() => {
    if (!taskId) return;
    const channel = supabase
      .channel(`task-milestones-${taskId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_milestones', filter: `task_id=eq.${taskId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['task-milestones', taskId] });
          queryClient.invalidateQueries({ queryKey: ['task', taskId] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId, queryClient]);

  const addMilestone = useMutation({
    mutationFn: async (input: CreateMilestoneInput) => {
      const nextOrder = milestones.length > 0 ? Math.max(...milestones.map((m) => m.sort_order)) + 1 : 0;
      const { data, error } = await supabase
        .from('task_milestones')
        .insert({
          task_id: taskId,
          title: input.title,
          target_date: input.target_date,
          sort_order: input.sort_order ?? nextOrder,
          org_id: orgId,
          created_by: user!.id,
        })
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-milestones', taskId] });
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      toast.success('Milestone added');
    },
    onError: (error: Error) => toast.error(`Failed to add milestone: ${error.message}`),
  });

  const updateMilestone = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateMilestoneInput }) => {
      const { data, error } = await supabase
        .from('task_milestones')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-milestones', taskId] });
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
    },
    onError: (error: Error) => toast.error(`Failed to update milestone: ${error.message}`),
  });

  const deleteMilestone = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('task_milestones').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-milestones', taskId] });
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      toast.success('Milestone deleted');
    },
    onError: (error: Error) => toast.error(`Failed to delete milestone: ${error.message}`),
  });

  return {
    milestones,
    isLoading,
    addMilestone,
    updateMilestone,
    deleteMilestone,
  };
}
