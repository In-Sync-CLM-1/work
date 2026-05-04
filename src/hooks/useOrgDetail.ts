import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { AppRole } from '@/types/user';

export interface OrgDetailData {
  org: {
    id: string;
    name: string;
    plan: string;
    trialEndsAt: string | null;
    trialDaysLeft: number;
    createdAt: string;
    logoUrl: string | null;
  };
  members: {
    userId: string;
    roleId: string;
    fullName: string;
    email: string | null;
    phone: string | null;
    role: AppRole;
    isActive: boolean;
    designation: string | null;
    createdAt: string;
  }[];
  tasks: {
    id: string;
    taskNumber: string | null;
    taskName: string;
    status: string;
    priority: string;
    dueDate: string;
    assignedToName: string;
    assignedByName: string;
    completionPercentage: number;
    createdAt: string;
    updatedAt: string;
  }[];
  payments: {
    id: string;
    amount: number;
    method: string;
    planTarget: string;
    referenceNo: string | null;
    notes: string | null;
    createdAt: string;
  }[];
  designations: {
    id: string;
    name: string;
    role: AppRole;
  }[];
  summary: {
    totalTasks: number;
    activeTasks: number;
    overdueTasks: number;
    completedTasks: number;
    completionRate: number;
    totalRevenue: number;
    activeMembers: number;
    inactiveMembers: number;
    lastActivity: string | null;
  };
}

export function useOrgDetail(orgId: string | null) {
  return useQuery({
    queryKey: ['org-detail', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      if (!orgId) return null;

      const [orgRes, profilesRes, rolesRes, tasksRes, paymentsRes, designationsRes] =
        await Promise.all([
          supabase
            .from('organizations')
            .select('id, name, plan, trial_ends_at, created_at, logo_url')
            .eq('id', orgId)
            .single(),
          supabase
            .from('profiles')
            .select('id, full_name, email, phone, designation_id, created_at')
            .eq('org_id', orgId),
          supabase
            .from('user_roles')
            .select('id, user_id, role, is_active, created_at')
            .eq('org_id', orgId),
          supabase
            .from('tasks')
            .select('id, task_number, task_name, status, priority, due_date, assigned_to, assigned_by, completion_percentage, created_at, updated_at')
            .eq('org_id', orgId)
            .order('updated_at', { ascending: false })
            .limit(50),
          supabase
            .from('payments')
            .select('id, amount, method, plan_target, reference_no, notes, created_at')
            .eq('org_id', orgId)
            .order('created_at', { ascending: false }),
          supabase
            .from('designations')
            .select('id, name, role')
            .eq('org_id', orgId),
        ]);

      if (orgRes.error || !orgRes.data) throw orgRes.error ?? new Error('Org not found');

      const orgRow = orgRes.data;
      const profiles = profilesRes.data ?? [];
      const roles = rolesRes.data ?? [];
      const tasksRaw = tasksRes.data ?? [];
      const payments = paymentsRes.data ?? [];
      const designations = designationsRes.data ?? [];

      const profileById = new Map(profiles.map((p) => [p.id, p]));
      const designationById = new Map(designations.map((d) => [d.id, d]));

      const members = roles
        .filter((r) => r.role !== 'platform_admin')
        .map((r) => {
          const profile = profileById.get(r.user_id);
          const desig = profile?.designation_id ? designationById.get(profile.designation_id) : null;
          return {
            userId: r.user_id,
            roleId: r.id,
            fullName: profile?.full_name ?? 'Unknown',
            email: profile?.email ?? null,
            phone: profile?.phone ?? null,
            role: r.role as AppRole,
            isActive: r.is_active,
            designation: desig?.name ?? null,
            createdAt: r.created_at,
          };
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const tasks = tasksRaw.map((t) => ({
        id: t.id,
        taskNumber: t.task_number,
        taskName: t.task_name,
        status: t.status,
        priority: t.priority,
        dueDate: t.due_date,
        assignedToName: profileById.get(t.assigned_to)?.full_name ?? 'Unknown',
        assignedByName: profileById.get(t.assigned_by)?.full_name ?? 'Unknown',
        completionPercentage: t.completion_percentage,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      }));

      const now = new Date();
      const trialDaysLeft = orgRow.trial_ends_at
        ? Math.ceil((new Date(orgRow.trial_ends_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      const completed = tasks.filter((t) => t.status === 'completed' || t.status === 'closed').length;
      const active = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').length;
      const overdue = tasks.filter(
        (t) =>
          t.dueDate &&
          new Date(t.dueDate) < now &&
          t.status !== 'completed' &&
          t.status !== 'closed' &&
          t.status !== 'cancelled',
      ).length;
      const totalRevenue = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
      const activeMembers = members.filter((m) => m.isActive).length;
      const inactiveMembers = members.filter((m) => !m.isActive).length;
      const lastActivity = tasks[0]?.updatedAt ?? orgRow.created_at;

      const data: OrgDetailData = {
        org: {
          id: orgRow.id,
          name: orgRow.name,
          plan: orgRow.plan ?? 'trial',
          trialEndsAt: orgRow.trial_ends_at,
          trialDaysLeft,
          createdAt: orgRow.created_at,
          logoUrl: orgRow.logo_url,
        },
        members,
        tasks,
        payments: payments.map((p) => ({
          id: p.id,
          amount: Number(p.amount),
          method: p.method,
          planTarget: p.plan_target,
          referenceNo: p.reference_no,
          notes: p.notes,
          createdAt: p.created_at,
        })),
        designations: designations.map((d) => ({ id: d.id, name: d.name, role: d.role as AppRole })),
        summary: {
          totalTasks: tasks.length,
          activeTasks: active,
          overdueTasks: overdue,
          completedTasks: completed,
          completionRate: tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0,
          totalRevenue,
          activeMembers,
          inactiveMembers,
          lastActivity,
        },
      };
      return data;
    },
    staleTime: 1000 * 30,
  });
}
