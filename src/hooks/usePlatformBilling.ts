import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface PlatformPaymentRow {
  id: string;
  orgId: string;
  orgName: string;
  amount: number;
  currency: string;
  method: string;
  referenceNo: string | null;
  notes: string | null;
  planTarget: string;
  createdAt: string;
}

export interface MonthlyRevenuePoint {
  month: string;
  revenue: number;
  payments: number;
}

export interface PlatformBillingSummary {
  totalRevenue: number;
  thisMonthRevenue: number;
  lastMonthRevenue: number;
  totalPayments: number;
  payingOrgs: number;
  trialOrgs: number;
  teamOrgs: number;
  businessOrgs: number;
  conversionRate: number;
  arpu: number;
  monthly: MonthlyRevenuePoint[];
  methodBreakdown: { method: string; amount: number; count: number }[];
}

export function usePlatformBilling() {
  return useQuery({
    queryKey: ['platform-billing'],
    queryFn: async () => {
      const [orgsRes, paymentsRes] = await Promise.all([
        supabase.from('organizations').select('id, name, plan'),
        supabase
          .from('payments')
          .select('id, org_id, amount, currency, method, reference_no, notes, plan_target, created_at')
          .order('created_at', { ascending: false }),
      ]);

      const orgs = orgsRes.data ?? [];
      const paymentsRaw = paymentsRes.data ?? [];

      const orgById = new Map(orgs.map((o) => [o.id, o]));

      const payments: PlatformPaymentRow[] = paymentsRaw.map((p) => ({
        id: p.id,
        orgId: p.org_id,
        orgName: orgById.get(p.org_id)?.name ?? 'Unknown',
        amount: Number(p.amount || 0),
        currency: p.currency,
        method: p.method,
        referenceNo: p.reference_no,
        notes: p.notes,
        planTarget: p.plan_target,
        createdAt: p.created_at,
      }));

      const now = new Date();
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
      const thisMonthRevenue = payments
        .filter((p) => new Date(p.createdAt) >= startOfThisMonth)
        .reduce((sum, p) => sum + p.amount, 0);
      const lastMonthRevenue = payments
        .filter((p) => {
          const d = new Date(p.createdAt);
          return d >= startOfLastMonth && d < startOfThisMonth;
        })
        .reduce((sum, p) => sum + p.amount, 0);

      const payingOrgIds = new Set(payments.map((p) => p.orgId));
      const trialOrgs = orgs.filter((o) => o.plan === 'trial').length;
      const teamOrgs = orgs.filter((o) => o.plan === 'team').length;
      const businessOrgs = orgs.filter((o) => o.plan === 'business').length;
      const paid = teamOrgs + businessOrgs;
      const conversionRate = orgs.length > 0 ? Math.round((paid / orgs.length) * 100) : 0;
      const arpu = paid > 0 ? Math.round(totalRevenue / paid) : 0;

      // Monthly trend (last 6 months)
      const monthly: MonthlyRevenuePoint[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        const inMonth = payments.filter((p) => {
          const d = new Date(p.createdAt);
          return d >= monthStart && d < monthEnd;
        });
        monthly.push({
          month: monthStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          revenue: inMonth.reduce((sum, p) => sum + p.amount, 0),
          payments: inMonth.length,
        });
      }

      // Method breakdown
      const methodMap = new Map<string, { amount: number; count: number }>();
      payments.forEach((p) => {
        const cur = methodMap.get(p.method) ?? { amount: 0, count: 0 };
        cur.amount += p.amount;
        cur.count += 1;
        methodMap.set(p.method, cur);
      });
      const methodBreakdown = Array.from(methodMap.entries()).map(([method, v]) => ({
        method,
        amount: v.amount,
        count: v.count,
      }));

      const summary: PlatformBillingSummary = {
        totalRevenue,
        thisMonthRevenue,
        lastMonthRevenue,
        totalPayments: payments.length,
        payingOrgs: payingOrgIds.size,
        trialOrgs,
        teamOrgs,
        businessOrgs,
        conversionRate,
        arpu,
        monthly,
        methodBreakdown,
      };

      return { summary, payments };
    },
    staleTime: 1000 * 60,
  });
}
