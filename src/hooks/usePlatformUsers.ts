import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { AppRole } from '@/types/user';

export interface PlatformUserRow {
  userId: string;
  roleId: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: AppRole;
  orgId: string | null;
  orgName: string;
  orgPlan: string;
  isActive: boolean;
  createdAt: string;
}

export function usePlatformUsers() {
  return useQuery({
    queryKey: ['platform-users'],
    queryFn: async () => {
      const [orgsRes, profilesRes, rolesRes] = await Promise.all([
        supabase.from('organizations').select('id, name, plan'),
        supabase.from('profiles').select('id, full_name, email, phone, created_at'),
        supabase.from('user_roles').select('id, user_id, org_id, role, is_active, created_at').neq('role', 'platform_admin'),
      ]);

      const orgs = orgsRes.data ?? [];
      const profiles = profilesRes.data ?? [];
      const roles = rolesRes.data ?? [];

      const orgById = new Map(orgs.map((o) => [o.id, o]));
      const profileById = new Map(profiles.map((p) => [p.id, p]));

      const rows: PlatformUserRow[] = roles.map((r) => {
        const profile = profileById.get(r.user_id);
        const org = r.org_id ? orgById.get(r.org_id) : null;
        return {
          userId: r.user_id,
          roleId: r.id,
          fullName: profile?.full_name ?? 'Unknown User',
          email: profile?.email ?? null,
          phone: profile?.phone ?? null,
          role: r.role as AppRole,
          orgId: r.org_id,
          orgName: org?.name ?? '—',
          orgPlan: org?.plan ?? 'trial',
          isActive: r.is_active,
          createdAt: r.created_at,
        };
      });

      rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return rows;
    },
    staleTime: 1000 * 60,
  });
}

export function useToggleUserActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ roleId, isActive }: { roleId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('user_roles')
        .update({ is_active: isActive })
        .eq('id', roleId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform-users'] });
      qc.invalidateQueries({ queryKey: ['platform-dashboard'] });
    },
  });
}
