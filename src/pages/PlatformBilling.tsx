import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  IndianRupee, TrendingUp, Receipt, Download, Search, CreditCard, Building2,
  ArrowUpRight, ArrowDownRight, Wallet, Sparkles, Crown,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { usePlatformBilling } from '@/hooks/usePlatformBilling';
import { cn } from '@/lib/utils';

const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };

const METHOD_COLORS = ['#8b5cf6', '#3b82f6', '#22c55e', '#eab308', '#ec4899', '#06b6d4'];
const METHOD_LABELS: Record<string, string> = {
  upi: 'UPI',
  bank_transfer: 'Bank Transfer',
  card: 'Card',
  cash: 'Cash',
  manual: 'Manual',
};
const PLAN_BADGE: Record<string, string> = {
  team: 'bg-violet-100 text-violet-700',
  business: 'bg-emerald-100 text-emerald-700',
};

function fmtINRFull(amount: number) {
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function fmtINRCompact(amount: number) {
  if (amount >= 1_00_00_000) return `₹${(amount / 1_00_00_000).toFixed(2)}Cr`;
  if (amount >= 1_00_000) return `₹${(amount / 1_00_000).toFixed(2)}L`;
  if (amount >= 1_000) return `₹${(amount / 1_000).toFixed(1)}K`;
  return `₹${Math.round(amount)}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function exportCsv(rows: Record<string, unknown>[], filename: string) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = String(v ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function PlatformBilling() {
  const { data, isLoading } = usePlatformBilling();
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    if (!data) return [];
    let rows = data.payments;
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (p) =>
          p.orgName.toLowerCase().includes(q) ||
          (p.referenceNo ?? '').toLowerCase().includes(q),
      );
    }
    if (methodFilter !== 'all') rows = rows.filter((p) => p.method === methodFilter);
    if (planFilter !== 'all') rows = rows.filter((p) => p.planTarget === planFilter);
    return rows;
  }, [data, search, methodFilter, planFilter]);

  if (isLoading || !data) {
    return <div className="text-center py-12 text-muted-foreground">Loading billing data…</div>;
  }

  const { summary, payments } = data;
  const monthDelta = summary.lastMonthRevenue > 0
    ? Math.round(((summary.thisMonthRevenue - summary.lastMonthRevenue) / summary.lastMonthRevenue) * 100)
    : summary.thisMonthRevenue > 0 ? 100 : 0;

  const handleExport = () => {
    exportCsv(
      filtered.map((p) => ({
        Date: formatDate(p.createdAt),
        Organisation: p.orgName,
        Amount: p.amount,
        Currency: p.currency,
        Method: METHOD_LABELS[p.method] ?? p.method,
        Plan: p.planTarget,
        Reference: p.referenceNo ?? '',
        Notes: p.notes ?? '',
      })),
      `platform-billing-${new Date().toISOString().slice(0, 10)}.csv`,
    );
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={fadeUp} className="mb-6 flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="h-6 w-6 text-fuchsia-500" />
            <span className="bg-gradient-to-r from-fuchsia-500 via-pink-500 to-rose-500 bg-clip-text text-transparent">
              Platform Billing
            </span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Revenue, payments, and conversion across all organisations
          </p>
        </div>
        <Button onClick={handleExport} variant="outline" disabled={filtered.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </motion.div>

      {/* Hero revenue card + KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        {/* Hero card */}
        <motion.div variants={fadeUp} className="lg:col-span-1 relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600 p-6 text-white shadow-xl">
          <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/80 font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              Total Revenue
            </div>
            <p className="text-4xl font-extrabold mt-2 tracking-tight">{fmtINRCompact(summary.totalRevenue)}</p>
            <p className="text-xs text-white/70 mt-1">{fmtINRFull(summary.totalRevenue)}</p>
            <div className="mt-4 flex items-center gap-2 text-xs">
              <span className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold',
                monthDelta >= 0 ? 'bg-emerald-400/20 text-emerald-100' : 'bg-rose-400/20 text-rose-100'
              )}>
                {monthDelta >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(monthDelta)}%
              </span>
              <span className="text-white/70">vs last month</span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg bg-white/10 backdrop-blur p-2.5">
                <p className="text-white/70 mb-0.5">This month</p>
                <p className="font-bold text-base">{fmtINRCompact(summary.thisMonthRevenue)}</p>
              </div>
              <div className="rounded-lg bg-white/10 backdrop-blur p-2.5">
                <p className="text-white/70 mb-0.5">Last month</p>
                <p className="font-bold text-base">{fmtINRCompact(summary.lastMonthRevenue)}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* KPI grid */}
        <motion.div variants={fadeUp} className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-3">
          <KpiCard label="Paying Orgs" value={summary.payingOrgs} icon={Building2} gradient="from-violet-500 to-purple-600" />
          <KpiCard label="Conversion" value={`${summary.conversionRate}%`} icon={TrendingUp} gradient="from-emerald-500 to-green-600" />
          <KpiCard label="ARPU" value={fmtINRCompact(summary.arpu)} icon={IndianRupee} gradient="from-pink-500 to-rose-600" />
          <KpiCard label="Team Plans" value={summary.teamOrgs} icon={Crown} gradient="from-sky-500 to-blue-600" />
          <KpiCard label="Business Plans" value={summary.businessOrgs} icon={Crown} gradient="from-amber-500 to-orange-500" />
          <KpiCard label="Payments" value={summary.totalPayments} icon={Receipt} gradient="from-cyan-500 to-teal-600" />
        </motion.div>
      </div>

      {/* Charts row */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        {/* Monthly revenue area chart */}
        <div className="lg:col-span-2 rounded-xl border bg-card p-4">
          <h3 className="font-semibold text-xs mb-2 text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5" /> Revenue Trend (6 months)
          </h3>
          {summary.monthly.some((m) => m.revenue > 0) ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={summary.monthly}>
                <defs>
                  <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={50} tickFormatter={fmtINRCompact} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0].payload as { month: string; revenue: number; payments: number };
                    return (
                      <div className="rounded-lg border bg-card px-3 py-2 shadow-lg text-xs">
                        <p className="font-semibold mb-1">{label}</p>
                        <p>Revenue: <span className="font-medium">{fmtINRFull(p.revenue)}</span></p>
                        <p>Payments: <span className="font-medium">{p.payments}</span></p>
                      </div>
                    );
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#ec4899" strokeWidth={2.5} fill="url(#gRevenue)" name="Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-muted-foreground text-xs">No revenue data yet</div>
          )}
        </div>

        {/* Method breakdown */}
        <div className="rounded-xl border bg-card p-4">
          <h3 className="font-semibold text-xs mb-2 text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <CreditCard className="h-3.5 w-3.5" /> Payment Methods
          </h3>
          {summary.methodBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={summary.methodBreakdown}
                  dataKey="amount"
                  nameKey="method"
                  cx="50%"
                  cy="45%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={2}
                >
                  {summary.methodBreakdown.map((_, i) => (
                    <Cell key={i} fill={METHOD_COLORS[i % METHOD_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0].payload as { method: string; amount: number; count: number };
                    return (
                      <div className="rounded-lg border bg-card px-3 py-2 shadow-lg text-xs">
                        <p className="font-semibold mb-0.5">{METHOD_LABELS[p.method] ?? p.method}</p>
                        <p>{fmtINRFull(p.amount)} · {p.count} txn</p>
                      </div>
                    );
                  }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11 }}
                  formatter={(value) => METHOD_LABELS[value as string] ?? value}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-muted-foreground text-xs">No payments yet</div>
          )}
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeUp} className="rounded-xl border bg-card p-3 mb-4 flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search organisation, reference…"
            className="pl-8 h-9"
          />
        </div>
        <Select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} className="h-9 w-[150px]">
          <option value="all">All methods</option>
          <option value="upi">UPI</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="card">Card</option>
          <option value="cash">Cash</option>
          <option value="manual">Manual</option>
        </Select>
        <Select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} className="h-9 w-[120px]">
          <option value="all">All plans</option>
          <option value="team">Team</option>
          <option value="business">Business</option>
        </Select>
        <div className="text-xs text-muted-foreground ml-auto">
          {filtered.length} of {payments.length}
        </div>
      </motion.div>

      {/* Payments table */}
      <motion.div variants={fadeUp} className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="border-b">
                <th className="py-3 pl-4 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                <th className="py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Organisation</th>
                <th className="py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Amount</th>
                <th className="py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Method</th>
                <th className="py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Plan</th>
                <th className="py-3 pr-4 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Reference</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, idx) => (
                <motion.tr
                  key={p.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.015 }}
                  className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                >
                  <td className="py-3 pl-4 text-xs text-muted-foreground whitespace-nowrap">{formatDate(p.createdAt)}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-md bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-semibold text-[10px]">
                        {p.orgName.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-medium">{p.orgName}</span>
                    </div>
                  </td>
                  <td className="py-3 text-right">
                    <span className="font-bold text-emerald-700">{fmtINRFull(p.amount)}</span>
                  </td>
                  <td className="py-3 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-foreground">
                      {METHOD_LABELS[p.method] ?? p.method}
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold', PLAN_BADGE[p.planTarget] ?? 'bg-muted')}>
                      {p.planTarget.charAt(0).toUpperCase() + p.planTarget.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-xs text-muted-foreground font-mono">{p.referenceNo || '—'}</td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Receipt className="h-8 w-8 opacity-30" />
                      <p className="text-sm">No payments match your filters</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}

interface KpiProps { label: string; value: string | number; icon: typeof IndianRupee; gradient: string }

function KpiCard({ label, value, icon: Icon, gradient }: KpiProps) {
  return (
    <div className={cn('relative overflow-hidden rounded-xl bg-gradient-to-br p-4 text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md', gradient)}>
      <p className="text-2xl font-bold leading-none">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wider mt-1 text-white/80">{label}</p>
      <Icon className="absolute bottom-2 right-2 h-8 w-8 opacity-[0.08]" strokeWidth={1.5} />
    </div>
  );
}
