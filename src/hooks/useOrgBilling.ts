import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface OrgBillingData {
  members: number;
  payments: {
    id: string;
    amount: number;
    method: string;
    planTarget: string;
    referenceNo: string | null;
    notes: string | null;
    createdAt: string;
  }[];
}

export function useOrgBilling(orgId: string | null) {
  return useQuery({
    queryKey: ['org-billing', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const [rolesRes, paymentsRes] = await Promise.all([
        supabase
          .from('user_roles')
          .select('id')
          .eq('org_id', orgId!)
          .eq('is_active', true)
          .neq('role', 'platform_admin'),
        supabase
          .from('payments')
          .select('id, amount, method, plan_target, reference_no, notes, created_at')
          .eq('org_id', orgId!)
          .eq('status', 'paid')
          .order('created_at', { ascending: false }),
      ]);
      const data: OrgBillingData = {
        members: rolesRes.data?.length ?? 0,
        payments: (paymentsRes.data ?? []).map((p) => ({
          id: p.id,
          amount: Number(p.amount),
          method: p.method,
          planTarget: p.plan_target,
          referenceNo: p.reference_no,
          notes: p.notes,
          createdAt: p.created_at,
        })),
      };
      return data;
    },
    staleTime: 1000 * 60,
  });
}
