import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { fetchAllRows } from '@/lib/fetchAllRows';

interface OrgListRow {
  id: string;
  name: string;
  plan: string;
  trial_ends_at: string | null;
  created_at: string;
}

interface OrgTaskRow {
  id: string;
  org_id: string | null;
  status: string;
  due_date: string;
  created_at: string;
  updated_at: string;
}

export interface PlatformOrgRow {
  id: string;
  name: string;
  plan: string;
  trialEndsAt: string | null;
  trialDaysLeft: number;
  members: number;
  totalTasks: number;
  activeTasks: number;
  overdueTasks: number;
  completedTasks: number;
  completionRate: number;
  createdAt: string;
  lastActivity: string | null;
  totalRevenue: number;
}

export function usePlatformOrgs() {
  return useQuery({
    queryKey: ['platform-orgs'],
    queryFn: async () => {
      // Paged: these span every org, so they hit PostgREST's 1,000-row
      // response cap before any single org's own list does.
      const [orgs, roles, tasks, payments] = await Promise.all([
        fetchAllRows<OrgListRow>(() =>
          supabase.from('organizations').select('id, name, plan, trial_ends_at, created_at'),
        ),
        fetchAllRows<{ org_id: string | null; is_active: boolean | null }>(() =>
          supabase.from('user_roles').select('org_id, is_active').neq('role', 'platform_admin'),
        ),
        fetchAllRows<OrgTaskRow>(() =>
          supabase.from('tasks').select('id, org_id, status, due_date, created_at, updated_at'),
        ),
        fetchAllRows<{ org_id: string | null; amount: number }>(() =>
          supabase.from('payments').select('org_id, amount'),
        ),
      ]);

      const now = new Date();

      const rows: PlatformOrgRow[] = orgs.map((org) => {
        const orgMembers = roles.filter((r) => r.org_id === org.id && r.is_active);
        const orgTasks = tasks.filter((t) => t.org_id === org.id);
        const completed = orgTasks.filter((t) => t.status === 'completed' || t.status === 'closed');
        const active = orgTasks.filter((t) => t.status === 'pending' || t.status === 'in_progress');
        const overdue = orgTasks.filter(
          (t) =>
            t.due_date &&
            new Date(t.due_date) < now &&
            t.status !== 'completed' &&
            t.status !== 'closed' &&
            t.status !== 'cancelled'
        );
        const lastTask = orgTasks
          .slice()
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0];

        const trialEndsAt = (org as { trial_ends_at?: string | null }).trial_ends_at ?? null;
        const trialDaysLeft = trialEndsAt
          ? Math.ceil((new Date(trialEndsAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : 0;

        const totalRevenue = payments
          .filter((p) => p.org_id === org.id)
          .reduce((sum, p) => sum + Number(p.amount || 0), 0);

        return {
          id: org.id,
          name: org.name,
          plan: (org as { plan?: string }).plan ?? 'trial',
          trialEndsAt,
          trialDaysLeft,
          members: orgMembers.length,
          totalTasks: orgTasks.length,
          activeTasks: active.length,
          overdueTasks: overdue.length,
          completedTasks: completed.length,
          completionRate: orgTasks.length > 0 ? Math.round((completed.length / orgTasks.length) * 100) : 0,
          createdAt: org.created_at,
          lastActivity: lastTask?.updated_at ?? org.created_at,
          totalRevenue,
        };
      });

      rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return rows;
    },
    staleTime: 1000 * 60,
  });
}

export function useDeleteOrg() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orgId: string) => {
      const { error } = await supabase.from('organizations').delete().eq('id', orgId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform-orgs'] });
      qc.invalidateQueries({ queryKey: ['platform-dashboard'] });
      qc.invalidateQueries({ queryKey: ['platform-users'] });
      qc.invalidateQueries({ queryKey: ['platform-billing'] });
    },
  });
}
