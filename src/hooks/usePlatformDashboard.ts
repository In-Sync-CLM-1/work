import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { fetchAllRows } from '@/lib/fetchAllRows';

interface Org {
  id: string;
  name: string;
  plan: string;
  trial_ends_at: string | null;
  created_at: string;
}

interface PlatformProfile {
  id: string;
  full_name: string | null;
  org_id: string | null;
  is_active: boolean | null;
  created_at: string;
}

interface PlatformTask {
  id: string;
  org_id: string | null;
  status: string;
  due_date: string;
  created_at: string;
  updated_at: string;
}

interface PlatformRole {
  user_id: string;
  org_id: string | null;
  role: string;
  is_active: boolean | null;
}

export interface OrgRow {
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
  lastActivity: string | null;
}

export interface PlatformSummary {
  totalOrgs: number;
  totalUsers: number;
  totalTasks: number;
  activeTasks: number;
  overdueTasks: number;
  completionRate: number;
}

export interface TaskTrendPoint {
  date: string;
  created: number;
  completed: number;
}

export interface RecentActivity {
  type: 'org_created' | 'task_completed' | 'user_joined';
  description: string;
  timestamp: string;
}

export function usePlatformDashboard() {
  return useQuery({
    queryKey: ['platform-dashboard'],
    queryFn: async () => {
      // Platform-wide rollups span every org, so they cross PostgREST's
      // 1,000-row response cap sooner than any single org does. Paged, or the
      // per-org task counts on this dashboard are simply wrong.
      const [orgs, profiles, tasks, roles] = await Promise.all([
        fetchAllRows<Org>(() =>
          supabase.from('organizations').select('id, name, plan, trial_ends_at, created_at'),
        ),
        fetchAllRows<PlatformProfile>(() =>
          supabase.from('profiles').select('id, full_name, org_id, is_active, created_at'),
        ),
        fetchAllRows<PlatformTask>(() =>
          supabase.from('tasks').select('id, org_id, status, due_date, created_at, updated_at'),
        ),
        fetchAllRows<PlatformRole>(() =>
          supabase.from('user_roles').select('user_id, org_id, role, is_active').neq('role', 'platform_admin'),
        ),
      ]);

      const now = new Date();

      // Build org rows
      const orgRows: OrgRow[] = orgs.map((org) => {
        const orgMembers = roles.filter((r) => r.org_id === org.id && r.is_active);
        const orgTasks = tasks.filter((t) => t.org_id === org.id);
        const completed = orgTasks.filter((t) => t.status === 'completed' || t.status === 'closed');
        const active = orgTasks.filter((t) => t.status === 'pending' || t.status === 'in_progress');
        const overdue = orgTasks.filter(
          (t) => t.due_date && new Date(t.due_date) < now && t.status !== 'completed' && t.status !== 'closed' && t.status !== 'cancelled'
        );
        const lastTask = orgTasks.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0];

        const trialEndsAt = (org as { trial_ends_at?: string }).trial_ends_at ?? null;
        const trialDaysLeft = trialEndsAt
          ? Math.ceil((new Date(trialEndsAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : 0;

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
          lastActivity: lastTask?.updated_at ?? org.created_at,
        };
      });

      // Summary
      const totalCompleted = tasks.filter((t) => t.status === 'completed' || t.status === 'closed').length;
      const totalActive = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').length;
      const totalOverdue = tasks.filter(
        (t) => t.due_date && new Date(t.due_date) < now && t.status !== 'completed' && t.status !== 'closed' && t.status !== 'cancelled'
      ).length;
      const activeUsers = profiles.filter((p) => p.is_active && p.org_id).length;

      const summary: PlatformSummary = {
        totalOrgs: orgs.length,
        totalUsers: activeUsers,
        totalTasks: tasks.length,
        activeTasks: totalActive,
        overdueTasks: totalOverdue,
        completionRate: tasks.length > 0 ? Math.round((totalCompleted / tasks.length) * 100) : 0,
      };

      // Task trend (last 4 weeks)
      const trend: TaskTrendPoint[] = [];
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (i * 7 + weekStart.getDay()));
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const created = tasks.filter((t) => {
          const d = new Date(t.created_at);
          return d >= weekStart && d < weekEnd;
        }).length;
        const completed = tasks.filter((t) => {
          if (t.status !== 'completed' && t.status !== 'closed') return false;
          const d = new Date(t.updated_at);
          return d >= weekStart && d < weekEnd;
        }).length;

        const label = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        trend.push({ date: label, created, completed });
      }

      // Recent activity
      const recentActivity: RecentActivity[] = [];

      // Recent org creations
      orgs
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 3)
        .forEach((org) => {
          recentActivity.push({
            type: 'org_created',
            description: `Organization "${org.name}" registered`,
            timestamp: org.created_at,
          });
        });

      // Recent user registrations
      profiles
        .filter((p) => p.org_id && p.is_active)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .forEach((p) => {
          recentActivity.push({
            type: 'user_joined',
            description: `${p.full_name || 'User'} joined`,
            timestamp: p.created_at,
          });
        });

      // Sort all activity by time
      recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return { summary, orgRows, trend, recentActivity: recentActivity.slice(0, 10) };
    },
    staleTime: 1000 * 60 * 2,
  });
}
