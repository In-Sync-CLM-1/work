import { useState } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  CheckCircle2, AlertTriangle, Zap, ListTodo, TrendingUp, Users,
  Trophy, Target, Timer, ArrowUp, Flame, Star, Sparkles,
  AlertOctagon, Lightbulb,
} from 'lucide-react';
import { useTaskStats } from '@/hooks/useTaskStats';
import { useAuth } from '@/lib/auth-context';
import type { AIInsight, UserCompletionStat } from '@/types/task';

const fadeUp = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

const MEMBER_COLORS = [
  { gradient: 'from-sky-500 to-blue-600',       bg: 'from-sky-500/10 to-blue-500/5',         ring: 'ring-sky-500/20',       text: 'text-sky-600' },
  { gradient: 'from-emerald-500 to-green-600',  bg: 'from-emerald-500/10 to-green-500/5',    ring: 'ring-emerald-500/20',   text: 'text-emerald-600' },
  { gradient: 'from-violet-500 to-purple-600',  bg: 'from-violet-500/10 to-purple-500/5',    ring: 'ring-violet-500/20',    text: 'text-violet-600' },
  { gradient: 'from-amber-500 to-orange-600',   bg: 'from-amber-500/10 to-orange-500/5',     ring: 'ring-amber-500/20',     text: 'text-amber-600' },
  { gradient: 'from-rose-500 to-pink-600',      bg: 'from-rose-500/10 to-pink-500/5',        ring: 'ring-rose-500/20',      text: 'text-rose-600' },
  { gradient: 'from-cyan-500 to-teal-600',      bg: 'from-cyan-500/10 to-teal-500/5',        ring: 'ring-cyan-500/20',      text: 'text-cyan-600' },
  { gradient: 'from-fuchsia-500 to-pink-600',   bg: 'from-fuchsia-500/10 to-pink-500/5',     ring: 'ring-fuchsia-500/20',   text: 'text-fuchsia-600' },
  { gradient: 'from-indigo-500 to-blue-600',    bg: 'from-indigo-500/10 to-blue-500/5',      ring: 'ring-indigo-500/20',    text: 'text-indigo-600' },
];

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#6b7280'];

const INSIGHT_THEMES: Record<AIInsight['type'], {
  icon: React.ElementType;
  accent: string;
  pill: string;
  pillText: string;
  iconBg: string;
  border: string;
  label: string;
}> = {
  critical: {
    icon: AlertOctagon,
    accent: 'from-red-500 to-rose-600',
    pill: 'bg-red-500/15',
    pillText: 'text-red-700 dark:text-red-300',
    iconBg: 'from-red-500 to-rose-600',
    border: 'border-red-500/30',
    label: 'Critical',
  },
  warning: {
    icon: AlertTriangle,
    accent: 'from-amber-500 to-orange-600',
    pill: 'bg-amber-500/15',
    pillText: 'text-amber-700 dark:text-amber-300',
    iconBg: 'from-amber-500 to-orange-600',
    border: 'border-amber-500/30',
    label: 'Warning',
  },
  success: {
    icon: TrendingUp,
    accent: 'from-emerald-500 to-green-600',
    pill: 'bg-emerald-500/15',
    pillText: 'text-emerald-700 dark:text-emerald-300',
    iconBg: 'from-emerald-500 to-green-600',
    border: 'border-emerald-500/30',
    label: 'On track',
  },
  info: {
    icon: Lightbulb,
    accent: 'from-sky-500 to-blue-600',
    pill: 'bg-sky-500/15',
    pillText: 'text-sky-700 dark:text-sky-300',
    iconBg: 'from-sky-500 to-blue-600',
    border: 'border-sky-500/30',
    label: 'Info',
  },
};

export function DashboardPage() {
  const now = new Date();
  const [monthStart, setMonthStart] = useState(format(startOfMonth(now), 'yyyy-MM-dd'));
  const [monthEnd, setMonthEnd]     = useState(format(endOfMonth(now),   'yyyy-MM-dd'));

  const { isAdmin, isPlatformAdmin, user, orgName } = useAuth();
  const isOrgAdmin = isAdmin || isPlatformAdmin;
  const { stats, isLoading } = useTaskStats(monthStart, monthEnd, isOrgAdmin, user?.id ?? '');

  const members         = stats?.userCompletionStats ?? [];
  const totalTasks      = stats?.totalTasks ?? 0;
  const completedCount  = stats?.statusDistribution?.find(s => s.name === 'completed')?.value   ?? 0;
  const inProgressCount = stats?.statusDistribution?.find(s => s.name === 'in_progress')?.value ?? 0;
  const pendingCount    = stats?.statusDistribution?.find(s => s.name === 'pending')?.value     ?? 0;
  const overdueCount    = stats?.overdueTasks ?? 0;
  const completionRate  = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
  const insights        = stats?.aiInsights ?? [];

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [yr, mo] = e.target.value.split('-').map(Number);
    const d = new Date(yr, mo - 1, 1);
    setMonthStart(format(startOfMonth(d), 'yyyy-MM-dd'));
    setMonthEnd(format(endOfMonth(d),     'yyyy-MM-dd'));
  };

  const statusPieData = [
    { name: 'Completed',   value: completedCount  },
    { name: 'In Progress', value: inProgressCount },
    { name: 'Pending',     value: pendingCount    },
    { name: 'Overdue',     value: overdueCount    },
  ].filter(d => d.value > 0);

  const memberChartData = members.map(m => ({
    name: m.userName?.split(' ')[0] || '?',
    Completed: m.completed,
    'In Progress': m.inProgress,
    Pending: m.pending,
    Overdue: m.overdue,
  }));

  const topPerformer: UserCompletionStat | null = members.length > 0 ? members[0] : null;
  const hasTrend = stats?.weeklyTrend?.some(w => w.created > 0 || w.completed > 0);

  if (isLoading) {
    return (
      <div className="p-6 space-y-5">
        <div className="h-10 w-64 rounded-lg bg-muted animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 h-80 rounded-2xl bg-muted animate-pulse" />
          <div className="h-80 rounded-2xl bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 space-y-5">

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent">
              {orgName || 'Work-Sync'}
            </span>{' '}
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            <Users className="h-3.5 w-3.5" />
            {isOrgAdmin
              ? `${members.length} team member${members.length !== 1 ? 's' : ''} · ${format(new Date(monthStart), 'MMMM yyyy')}`
              : `My tasks · ${format(new Date(monthStart), 'MMMM yyyy')}`}
          </p>
        </div>
        <input
          type="month"
          value={monthStart.slice(0, 7)}
          onChange={handleMonthChange}
          className="text-sm px-3 py-2 rounded-lg border border-border bg-card text-foreground outline-none focus:ring-2 focus:ring-primary/30 w-44"
        />
      </div>

      {/* ── AI INSIGHTS (PROMINENT) ──────────────────────────────────── */}
      {insights.length > 0 && (
        <motion.section
          variants={fadeUp} initial="hidden" animate="visible"
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/5 via-fuchsia-500/5 to-pink-500/5 p-5 md:p-6"
        >
          <div className="dashboard-card-accent bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 animate-gradient-shift" />
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center shadow-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight">AI Insights</h2>
                <p className="text-xs text-muted-foreground">
                  {insights.length} insight{insights.length !== 1 ? 's' : ''} from your team activity
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {insights.map((ins, i) => {
              const cfg = INSIGHT_THEMES[ins.type];
              const Icon = cfg.icon;
              return (
                <div
                  key={i}
                  className={`relative overflow-hidden rounded-xl border ${cfg.border} bg-card p-4 hover:shadow-md hover:-translate-y-0.5 transition-all`}
                >
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${cfg.accent}`} />
                  <div className="flex items-start gap-3">
                    <div className={`h-9 w-9 shrink-0 rounded-lg bg-gradient-to-br ${cfg.iconBg} flex items-center justify-center shadow-md`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <span className={`inline-block text-[10px] font-bold uppercase tracking-wider ${cfg.pillText} ${cfg.pill} px-2 py-0.5 rounded-full mb-1.5`}>
                        {cfg.label}
                      </span>
                      <p className="text-sm font-bold leading-snug">{ins.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{ins.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>
      )}

      {/* ── KPI ROW ───────────────────────────────────────────────────── */}
      <motion.div
        variants={fadeUp} initial="hidden" animate="visible"
        transition={{ delay: 0.05, duration: 0.5 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <KpiCard
          label="Total Tasks"
          value={totalTasks}
          icon={ListTodo}
          gradient="from-sky-500/15 via-blue-500/10 to-cyan-500/5"
          border="border-sky-500/30"
          accent="from-sky-500 to-blue-600"
          subtitle={`${stats?.myOpenTasks ?? 0} assigned to you`}
        />
        <KpiCard
          label="Completed"
          value={completedCount}
          icon={CheckCircle2}
          gradient="from-emerald-500/15 via-green-500/10 to-teal-500/5"
          border="border-emerald-500/30"
          accent="from-emerald-500 to-green-600"
          subtitle={`${completionRate}% completion rate`}
        />
        <KpiCard
          label="In Progress"
          value={inProgressCount}
          icon={Zap}
          gradient="from-amber-500/15 via-orange-500/10 to-yellow-500/5"
          border="border-amber-500/30"
          accent="from-amber-500 to-orange-600"
          subtitle="Currently active"
        />
        <KpiCard
          label="Overdue"
          value={overdueCount}
          icon={AlertTriangle}
          gradient={overdueCount > 0 ? 'from-red-500/15 via-rose-500/10 to-pink-500/5' : 'from-emerald-500/15 via-green-500/10 to-teal-500/5'}
          border={overdueCount > 0 ? 'border-red-500/30' : 'border-emerald-500/30'}
          accent={overdueCount > 0 ? 'from-red-500 to-rose-600' : 'from-emerald-500 to-green-600'}
          subtitle={overdueCount > 0 ? 'Needs attention' : 'All on track!'}
        />
      </motion.div>

      {/* ── CHARTS ROW ────────────────────────────────────────────────── */}
      <motion.div
        variants={fadeUp} initial="hidden" animate="visible"
        transition={{ delay: 0.1, duration: 0.5 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-4"
      >
        {/* Member Performance — admin only */}
        {isOrgAdmin && (
          <div className="lg:col-span-2 dashboard-card">
            <div className="dashboard-card-accent bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 animate-gradient-shift" />
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-md">
                  <Target className="h-4 w-4 text-white" />
                </div>
                Member Performance
              </h2>
            </div>
            {memberChartData.length === 0 ? (
              <div className="flex items-center justify-center h-[260px] text-muted-foreground">
                <div className="text-center">
                  <Users className="mx-auto mb-2 h-8 w-8 opacity-30" />
                  <p className="text-sm">No data yet</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={memberChartData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', fontSize: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                  <Bar dataKey="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="In Progress" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Overdue" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        {/* Status Pie */}
        <div className={`dashboard-card ${isOrgAdmin ? '' : 'lg:col-span-3'}`}>
          <div className="dashboard-card-accent bg-gradient-to-r from-emerald-500 via-cyan-400 to-sky-500 animate-gradient-shift" />
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center shadow-md">
                <CheckCircle2 className="h-4 w-4 text-white" />
              </div>
              Status Split
            </h2>
          </div>
          {statusPieData.length === 0 ? (
            <div className="flex items-center justify-center h-[260px] text-muted-foreground">
              <p className="text-sm">No data</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    dataKey="value"
                    stroke="none"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {statusPieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-2xl font-bold">
                    {completionRate}%
                  </text>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {statusPieData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-[11px]">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                    <span className="text-muted-foreground">{d.name}</span>
                    <span className="font-semibold">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── WEEKLY TREND ──────────────────────────────────────────────── */}
      {hasTrend && (
        <motion.div
          variants={fadeUp} initial="hidden" animate="visible"
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          <div className="dashboard-card">
            <div className="dashboard-card-accent bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 animate-gradient-shift" />
            <h2 className="text-base font-bold flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              Weekly Trend
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats!.weeklyTrend} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="created"   name="Created"   fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* ── TOP PERFORMER + LEADERBOARD — admin only ───────────────── */}
      {isOrgAdmin && (
        <motion.div
          variants={fadeUp} initial="hidden" animate="visible"
          transition={{ delay: 0.2, duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-4"
        >
          {topPerformer && (
            <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-orange-500/5 p-6">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 animate-gradient-shift" style={{ backgroundSize: '200% 200%' }} />
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-600">Top Performer</p>
                  <p className="text-xl font-extrabold">{topPerformer.userName}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 rounded-xl bg-white/50 dark:bg-white/5">
                  <p className="text-2xl font-extrabold text-emerald-600">{topPerformer.completed}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">Done</p>
                </div>
                <div className="text-center p-2 rounded-xl bg-white/50 dark:bg-white/5">
                  <p className="text-2xl font-extrabold text-sky-600">{topPerformer.onTime}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">On Time</p>
                </div>
                <div className="text-center p-2 rounded-xl bg-white/50 dark:bg-white/5">
                  <p className="text-2xl font-extrabold text-violet-600">{topPerformer.avgCompletionDays ?? '-'}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">Avg Days</p>
                </div>
              </div>
              <div className="absolute bottom-0 right-0 opacity-[0.06]">
                <Star className="h-28 w-28 -mb-6 -mr-6" />
              </div>
            </div>
          )}

          <div className="lg:col-span-2 dashboard-card">
            <div className="dashboard-card-accent bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 animate-gradient-shift" />
            <h2 className="text-base font-bold flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-md">
                <Flame className="h-4 w-4 text-white" />
              </div>
              Team Leaderboard
            </h2>
            {members.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <p className="text-sm">No members yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {members.map((m, idx) => {
                  const color = MEMBER_COLORS[idx % MEMBER_COLORS.length];
                  const pct = m.total > 0 ? Math.round((m.completed / m.total) * 100) : 0;
                  return (
                    <div
                      key={m.userId}
                      className={`flex items-center justify-between p-3 rounded-xl bg-gradient-to-r ${color.bg} border ${color.ring} hover:scale-[1.01] transition-all`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${color.gradient} flex items-center justify-center text-white text-xs font-bold shadow-md`}>
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{m.userName}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {m.total} tasks · {pct}% done
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-block bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold px-2 py-0.5 rounded-full ring-1 ring-emerald-500/20">
                          {m.completed} done
                        </span>
                        {m.overdue > 0 && (
                          <span className="inline-block bg-red-500/10 text-red-700 dark:text-red-300 text-[10px] font-semibold px-2 py-0.5 rounded-full ring-1 ring-red-500/20">
                            {m.overdue} overdue
                          </span>
                        )}
                        {m.avgCompletionDays != null && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground border border-border px-2 py-0.5 rounded-full">
                            <Timer className="h-3 w-3" />
                            {m.avgCompletionDays}d avg
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ── INDIVIDUAL MEMBER CARDS — admin only ─────────────────────── */}
      {isOrgAdmin && members.length > 0 && (
        <motion.div
          variants={fadeUp} initial="hidden" animate="visible"
          transition={{ delay: 0.25, duration: 0.5 }}
        >
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            Individual Breakdown
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {members.map((m, idx) => {
              const color = MEMBER_COLORS[idx % MEMBER_COLORS.length];
              const pct = m.total > 0 ? Math.round((m.completed / m.total) * 100) : 0;
              const onTimePct = m.completed > 0 ? Math.round((m.onTime / m.completed) * 100) : 0;
              return (
                <div
                  key={m.userId}
                  className={`relative overflow-hidden rounded-2xl border ${color.ring} bg-gradient-to-br ${color.bg} p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300`}
                >
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${color.gradient}`} />
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${color.gradient} flex items-center justify-center text-white font-bold shadow-md`}>
                      {m.userName?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{m.userName}</p>
                      <p className="text-[10px] text-muted-foreground">{m.total} total tasks</p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-muted-foreground">Completion</span>
                      <span className="font-semibold">{pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${color.gradient} transition-all duration-700`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-1.5 rounded-lg bg-white/50 dark:bg-white/5">
                      <p className={`text-lg font-extrabold ${color.text}`}>{m.completed}</p>
                      <p className="text-[9px] text-muted-foreground">Done</p>
                    </div>
                    <div className="p-1.5 rounded-lg bg-white/50 dark:bg-white/5">
                      <p className="text-lg font-extrabold text-blue-600">{m.inProgress}</p>
                      <p className="text-[9px] text-muted-foreground">Active</p>
                    </div>
                    <div className="p-1.5 rounded-lg bg-white/50 dark:bg-white/5">
                      <p className={`text-lg font-extrabold ${m.overdue > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{m.overdue}</p>
                      <p className="text-[9px] text-muted-foreground">Overdue</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <ArrowUp className="h-3 w-3 text-emerald-500" />
                      {onTimePct}% on-time
                    </span>
                    <span className="flex items-center gap-1">
                      <Timer className="h-3 w-3" />
                      {m.avgCompletionDays ?? '-'}d avg
                    </span>
                    {m.highPriority > 0 && (
                      <span className="flex items-center gap-1 text-orange-600 font-medium">
                        <Flame className="h-3 w-3" />
                        {m.highPriority} critical
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── MY STATS — non-admin view ────────────────────────────────── */}
      {!isOrgAdmin && (
        <motion.div
          variants={fadeUp} initial="hidden" animate="visible"
          transition={{ delay: 0.2, duration: 0.5 }}
          className="dashboard-card"
        >
          <div className="dashboard-card-accent bg-gradient-to-r from-sky-500 to-blue-600" />
          <h2 className="text-base font-bold flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-md">
              <Target className="h-4 w-4 text-white" />
            </div>
            My Snapshot
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Assigned',    value: stats?.myOpenTasks ?? 0, accent: 'text-sky-600' },
              { label: 'Completed',   value: completedCount,           accent: 'text-emerald-600' },
              { label: 'In Progress', value: inProgressCount,          accent: 'text-amber-600' },
              { label: 'Overdue',     value: overdueCount,             accent: overdueCount > 0 ? 'text-red-600' : 'text-emerald-600' },
            ].map(r => (
              <div key={r.label} className="rounded-xl border border-border p-4 text-center bg-card">
                <p className={`text-2xl font-extrabold ${r.accent}`}>{r.value}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{r.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

    </div>
  );
}

/* ── KPI Card ──────────────────────────────────────────────────────── */
function KpiCard({ label, value, icon: Icon, gradient, border, accent, subtitle }: {
  label: string;
  value: number;
  icon: React.ElementType;
  gradient: string;
  border: string;
  accent: string;
  subtitle: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} border ${border} p-5 hover:shadow-xl hover:-translate-y-1.5 hover:scale-[1.02] transition-all duration-300`}>
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accent}`} />
      <div className="flex items-center gap-1.5 mb-2">
        <div className={`p-1.5 rounded-lg bg-gradient-to-br ${accent} shadow-md`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <p className="text-3xl font-extrabold">{value.toLocaleString()}</p>
      <p className="text-[11px] text-muted-foreground mt-1">{subtitle}</p>
    </div>
  );
}
