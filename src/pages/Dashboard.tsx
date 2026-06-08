import { useState } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  CheckCircle2, AlertTriangle, Zap, ListTodo, TrendingUp, Users,
  Trophy, Target, Timer, ArrowUp, Flame, Sparkles,
  AlertOctagon, Lightbulb,
} from 'lucide-react';
import { useTaskStats } from '@/hooks/useTaskStats';
import { useAuth } from '@/lib/auth-context';
import type { AIInsight, UserCompletionStat } from '@/types/task';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#6b7280'];

const INSIGHT_THEMES: Record<AIInsight['type'], {
  icon: React.ElementType;
  iconClass: string;
  bar: string;
  label: string;
}> = {
  critical: { icon: AlertOctagon, iconClass: 'bg-red-500/10 text-red-600', bar: 'bg-red-500', label: 'Critical' },
  warning: { icon: AlertTriangle, iconClass: 'bg-amber-500/10 text-amber-600', bar: 'bg-amber-500', label: 'Warning' },
  success: { icon: TrendingUp, iconClass: 'bg-emerald-500/10 text-emerald-600', bar: 'bg-emerald-500', label: 'On track' },
  info: { icon: Lightbulb, iconClass: 'bg-sky-500/10 text-sky-600', bar: 'bg-sky-500', label: 'Info' },
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
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            {orgName || 'Work-Sync'} <span className="text-primary">Dashboard</span>
          </h1>
          <div className="flex items-center gap-4 mt-1.5">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Live data
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              {isOrgAdmin
                ? `${members.length} team member${members.length !== 1 ? 's' : ''} · ${format(new Date(monthStart), 'MMMM yyyy')}`
                : `My tasks · ${format(new Date(monthStart), 'MMMM yyyy')}`}
            </span>
          </div>
        </div>
        <input
          type="month"
          value={monthStart.slice(0, 7)}
          onChange={handleMonthChange}
          className="text-sm px-3 py-2 rounded-lg border border-border bg-card text-foreground outline-none focus:ring-2 focus:ring-primary/30 w-44"
        />
      </div>

      {/* ── KPI ROW ───────────────────────────────────────────────────── */}
      <motion.div
        variants={fadeUp} initial="hidden" animate="visible" transition={{ duration: 0.4 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <KpiCard
          label="Total Tasks" value={totalTasks} icon={ListTodo}
          gradient="from-sky-500/10 to-sky-500/5" border="border-sky-500/20" iconClass="text-sky-500"
          subtitle={`${stats?.myOpenTasks ?? 0} assigned to you`}
        />
        <KpiCard
          label="Completed" value={completedCount} icon={CheckCircle2}
          gradient="from-emerald-500/10 to-emerald-500/5" border="border-emerald-500/20" iconClass="text-emerald-500"
          subtitle={`${completionRate}% completion rate`}
        />
        <KpiCard
          label="In Progress" value={inProgressCount} icon={Zap}
          gradient="from-amber-500/10 to-amber-500/5" border="border-amber-500/20" iconClass="text-amber-500"
          subtitle="Currently active"
        />
        <KpiCard
          label="Overdue" value={overdueCount} icon={AlertTriangle}
          gradient={overdueCount > 0 ? 'from-red-500/10 to-red-500/5' : 'from-emerald-500/10 to-emerald-500/5'}
          border={overdueCount > 0 ? 'border-red-500/20' : 'border-emerald-500/20'}
          iconClass={overdueCount > 0 ? 'text-red-500' : 'text-emerald-500'}
          subtitle={overdueCount > 0 ? 'Needs attention' : 'All on track'}
        />
      </motion.div>

      {/* ── AI INSIGHTS ──────────────────────────────────────────────── */}
      {insights.length > 0 && (
        <motion.section
          variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.05, duration: 0.4 }}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">AI Insights</h2>
              <p className="text-[11px] text-muted-foreground">
                {insights.length} insight{insights.length !== 1 ? 's' : ''} from your team activity
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {insights.map((ins, i) => {
              const cfg = INSIGHT_THEMES[ins.type];
              const Icon = cfg.icon;
              return (
                <div key={i} className="relative overflow-hidden rounded-xl border border-border bg-background p-4 hover:border-primary/30 transition-colors">
                  <div className={`absolute top-0 left-0 bottom-0 w-1 ${cfg.bar}`} />
                  <div className="flex items-start gap-3 pl-1.5">
                    <div className={`h-9 w-9 shrink-0 rounded-lg flex items-center justify-center ${cfg.iconClass}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                        {cfg.label}
                      </span>
                      <p className="text-sm font-bold leading-snug text-foreground">{ins.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{ins.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>
      )}

      {/* ── CHARTS ROW ────────────────────────────────────────────────── */}
      <motion.div
        variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.1, duration: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-4"
      >
        {isOrgAdmin && (
          <Card className="lg:col-span-2">
            <CardHeading icon={Target} title="Member Performance" />
            {memberChartData.length === 0 ? (
              <EmptyChart icon={Users} text="No data yet" />
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
          </Card>
        )}

        <Card className={isOrgAdmin ? '' : 'lg:col-span-3'}>
          <CardHeading icon={CheckCircle2} title="Status Split" />
          {statusPieData.length === 0 ? (
            <EmptyChart icon={CheckCircle2} text="No data" />
          ) : (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" stroke="none" startAngle={90} endAngle={-270}>
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
                    <span className="font-semibold text-foreground">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </motion.div>

      {/* ── WEEKLY TREND ──────────────────────────────────────────────── */}
      {hasTrend && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.15, duration: 0.4 }}>
          <Card>
            <CardHeading icon={TrendingUp} title="Weekly Trend" />
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
          </Card>
        </motion.div>
      )}

      {/* ── TOP PERFORMER + LEADERBOARD — admin only ───────────────── */}
      {isOrgAdmin && (
        <motion.div
          variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.2, duration: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-4"
        >
          {topPerformer && (
            <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-amber-500/5 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-11 w-11 rounded-xl bg-amber-500/15 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-600">Top Performer</p>
                  <p className="text-lg font-extrabold text-foreground">{topPerformer.userName}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <MiniStat value={topPerformer.completed} label="Done" />
                <MiniStat value={topPerformer.onTime} label="On Time" />
                <MiniStat value={topPerformer.avgCompletionDays ?? '—'} label="Avg Days" />
              </div>
              <div className="absolute bottom-0 right-0 opacity-[0.06]">
                <Trophy className="h-28 w-28 -mb-6 -mr-6" />
              </div>
            </div>
          )}

          <Card className="lg:col-span-2">
            <CardHeading icon={Flame} title="Team Leaderboard" />
            {members.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground"><p className="text-sm">No members yet</p></div>
            ) : (
              <div className="space-y-2">
                {members.map((m, idx) => {
                  const pct = m.total > 0 ? Math.round((m.completed / m.total) * 100) : 0;
                  return (
                    <div key={m.userId} className="flex items-center justify-between p-3 rounded-xl border border-border bg-background hover:border-primary/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-amber-500/15 text-amber-600' : 'bg-muted text-muted-foreground'}`}>
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{m.userName}</p>
                          <p className="text-[10px] text-muted-foreground">{m.total} tasks · {pct}% done</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-block bg-emerald-500/10 text-emerald-600 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                          {m.completed} done
                        </span>
                        {m.overdue > 0 && (
                          <span className="inline-block bg-red-500/10 text-red-600 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                            {m.overdue} overdue
                          </span>
                        )}
                        {m.avgCompletionDays != null && (
                          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-muted-foreground border border-border px-2 py-0.5 rounded-full">
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
          </Card>
        </motion.div>
      )}

      {/* ── INDIVIDUAL MEMBER CARDS — admin only ─────────────────────── */}
      {isOrgAdmin && members.length > 0 && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.25, duration: 0.4 }}>
          <h2 className="text-base font-bold mb-3 flex items-center gap-2 text-foreground">
            <Users className="h-4 w-4 text-muted-foreground" />
            Individual Breakdown
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {members.map((m) => {
              const pct = m.total > 0 ? Math.round((m.completed / m.total) * 100) : 0;
              const onTimePct = m.completed > 0 ? Math.round((m.onTime / m.completed) * 100) : 0;
              return (
                <div key={m.userId} className="rounded-2xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-sm transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {m.userName?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-foreground">{m.userName}</p>
                      <p className="text-[10px] text-muted-foreground">{m.total} total tasks</p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-muted-foreground">Completion</span>
                      <span className="font-semibold text-foreground">{pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-1.5 rounded-lg bg-muted/50">
                      <p className="text-lg font-extrabold text-emerald-600">{m.completed}</p>
                      <p className="text-[9px] text-muted-foreground">Done</p>
                    </div>
                    <div className="p-1.5 rounded-lg bg-muted/50">
                      <p className="text-lg font-extrabold text-blue-600">{m.inProgress}</p>
                      <p className="text-[9px] text-muted-foreground">Active</p>
                    </div>
                    <div className="p-1.5 rounded-lg bg-muted/50">
                      <p className={`text-lg font-extrabold ${m.overdue > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{m.overdue}</p>
                      <p className="text-[9px] text-muted-foreground">Overdue</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border text-[10px] text-muted-foreground">
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
        <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.2, duration: 0.4 }}>
          <Card>
            <CardHeading icon={Target} title="My Snapshot" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Assigned',    value: stats?.myOpenTasks ?? 0, accent: 'text-sky-600' },
                { label: 'Completed',   value: completedCount,           accent: 'text-emerald-600' },
                { label: 'In Progress', value: inProgressCount,          accent: 'text-amber-600' },
                { label: 'Overdue',     value: overdueCount,             accent: overdueCount > 0 ? 'text-red-600' : 'text-emerald-600' },
              ].map(r => (
                <div key={r.label} className="rounded-xl border border-border p-4 text-center bg-background">
                  <p className={`text-2xl font-extrabold ${r.accent}`}>{r.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{r.label}</p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

    </div>
  );
}

/* ── Building blocks ───────────────────────────────────────────────── */

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-border bg-card p-5 ${className}`}>{children}</div>;
}

function CardHeading({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <h2 className="text-base font-bold text-foreground">{title}</h2>
    </div>
  );
}

function EmptyChart({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex items-center justify-center h-[260px] text-muted-foreground">
      <div className="text-center">
        <Icon className="mx-auto mb-2 h-8 w-8 opacity-30" />
        <p className="text-sm">{text}</p>
      </div>
    </div>
  );
}

function MiniStat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="text-center p-2 rounded-xl bg-background/60">
      <p className="text-2xl font-extrabold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground font-medium">{label}</p>
    </div>
  );
}

/* ── KPI Card — vendor/WA professional style ───────────────────────── */
function KpiCard({ label, value, icon: Icon, gradient, border, iconClass, subtitle }: {
  label: string;
  value: number;
  icon: React.ElementType;
  gradient: string;
  border: string;
  iconClass: string;
  subtitle: string;
}) {
  return (
    <div className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} border ${border} p-5 transition-all hover:shadow-lg hover:-translate-y-1`}>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <p className="text-4xl font-extrabold text-foreground mt-2">{value.toLocaleString()}</p>
      <p className="text-[11px] text-muted-foreground mt-1">{subtitle}</p>
      <div className="absolute bottom-0 right-0 opacity-[0.07] group-hover:opacity-[0.12] transition-opacity">
        <Icon className={`h-20 w-20 -mb-3 -mr-3 ${iconClass}`} />
      </div>
    </div>
  );
}
