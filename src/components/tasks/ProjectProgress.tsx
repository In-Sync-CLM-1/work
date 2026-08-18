import { Flag, CheckCircle2, ListChecks, CalendarClock, TrendingUp, AlertTriangle } from 'lucide-react';
import type { Task, TaskMilestone } from '@/types/task';
import { cn, formatDate } from '@/lib/utils';

interface ProjectProgressProps {
  task: Task;
  subtasks: Task[];
  milestones: TaskMilestone[];
}

const DAY = 1000 * 60 * 60 * 24;

function startOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

/**
 * Project Progress — maps milestones and completion for a parent task, turning a
 * big task into a visible, time-phased project view.
 */
export function ProjectProgress({ task, subtasks, milestones }: ProjectProgressProps) {
  const today = startOfDay(new Date());
  const isTerminal = task.status === 'completed' || task.status === 'closed';

  // ── Subtask rollup ──────────────────────────────────────────────────────
  const totalSub = subtasks.length;
  const doneSub = subtasks.filter((s) => s.status === 'completed' || s.status === 'closed').length;
  const inProgSub = subtasks.filter((s) => s.status === 'in_progress').length;

  // ── Overall completion ──────────────────────────────────────────────────
  const pct = isTerminal
    ? 100
    : totalSub > 0
      ? Math.round((doneSub / totalSub) * 100)
      : task.completion_percentage || (task.status === 'in_progress' ? 20 : 0);

  // ── Milestones ──────────────────────────────────────────────────────────
  const sortedMs = [...milestones].sort(
    (a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime(),
  );
  const doneMs = sortedMs.filter((m) => m.completed).length;
  const overdueMs = sortedMs.filter(
    (m) => !m.completed && startOfDay(new Date(m.target_date)) < today,
  ).length;

  // ── Health ──────────────────────────────────────────────────────────────
  const dueOverdue = !isTerminal && startOfDay(new Date(task.due_date)) < today;
  const health: 'complete' | 'behind' | 'ontrack' = isTerminal
    ? 'complete'
    : overdueMs > 0 || dueOverdue
      ? 'behind'
      : 'ontrack';

  const HEALTH = {
    complete: { label: 'Complete', cls: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20', bar: 'bg-emerald-500' },
    ontrack: { label: 'On track', cls: 'bg-sky-500/10 text-sky-600 ring-sky-500/20', bar: 'bg-primary' },
    behind: { label: 'At risk', cls: 'bg-red-500/10 text-red-600 ring-red-500/20', bar: 'bg-amber-500' },
  }[health];

  // ── Timeline geometry ───────────────────────────────────────────────────
  const startD = startOfDay(new Date(task.start_date || task.created_at));
  let endD = startOfDay(new Date(task.due_date));
  if (endD.getTime() <= startD.getTime()) endD = new Date(startD.getTime() + DAY);
  const span = endD.getTime() - startD.getTime();
  const at = (d: Date) => Math.max(0, Math.min(1, (startOfDay(d).getTime() - startD.getTime()) / span)) * 100;
  const todayPos = at(today);
  const showToday = today >= startD && today <= endD;

  const daysLeft = Math.ceil((endD.getTime() - today.getTime()) / DAY);

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h2 className="text-base font-bold text-foreground">Project Progress</h2>
        </div>
        <span className={cn('inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ring-1', HEALTH.cls)}>
          {health === 'behind' ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
          {HEALTH.label}
        </span>
      </div>

      {/* Overall completion bar */}
      <div className="mb-5">
        <div className="flex items-end justify-between mb-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Overall completion</span>
          <span className="text-2xl font-extrabold text-foreground leading-none">{pct}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-muted overflow-hidden">
          <div className={cn('h-full rounded-full transition-all duration-700', HEALTH.bar)} style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Stat icon={ListChecks} label="Subtasks" value={`${doneSub}/${totalSub}`} sub={inProgSub > 0 ? `${inProgSub} in progress` : 'done'} accent="text-sky-600" />
        <Stat icon={Flag} label="Milestones" value={`${doneMs}/${sortedMs.length}`} sub={overdueMs > 0 ? `${overdueMs} overdue` : 'on schedule'} accent={overdueMs > 0 ? 'text-red-600' : 'text-primary'} />
        <Stat icon={CalendarClock} label="Timeline" value={isTerminal ? 'Done' : daysLeft < 0 ? `${-daysLeft}d over` : `${daysLeft}d left`} sub={`due ${formatDate(task.due_date)}`} accent={!isTerminal && daysLeft < 0 ? 'text-red-600' : 'text-amber-600'} />
      </div>

      {/* Milestone timeline */}
      {sortedMs.length > 0 ? (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-6">Milestone timeline</p>
          <div className="relative px-1" style={{ paddingTop: 4, paddingBottom: 4 }}>
            {/* base track */}
            <div className="absolute left-1 right-1 top-1 h-1 rounded-full bg-muted" />
            {/* progress fill up to today */}
            {showToday && (
              <div className="absolute left-1 top-1 h-1 rounded-full bg-primary/40" style={{ width: `calc(${todayPos}% - 4px)` }} />
            )}
            {/* today marker */}
            {showToday && (
              <div className="absolute -top-1 flex flex-col items-center" style={{ left: `${todayPos}%`, transform: 'translateX(-50%)' }}>
                <div className="h-3 w-3 rounded-full bg-primary ring-4 ring-primary/15" />
              </div>
            )}
            {/* milestone dots */}
            {sortedMs.map((m) => {
              const overdue = !m.completed && startOfDay(new Date(m.target_date)) < today;
              const color = m.completed ? 'bg-emerald-500' : overdue ? 'bg-red-500' : 'bg-card border-2 border-muted-foreground/40';
              return (
                <div key={m.id} className="absolute top-1 flex flex-col items-center" style={{ left: `${at(new Date(m.target_date))}%`, transform: 'translate(-50%, -50%)' }}>
                  <div className={cn('h-3.5 w-3.5 rounded-full shadow-sm', color)} title={m.title} />
                  <div className="mt-3 w-24 text-center">
                    <p className={cn('text-[11px] font-semibold leading-tight truncate', m.completed && 'text-emerald-600', overdue && 'text-red-600', !m.completed && !overdue && 'text-foreground')} title={m.title}>
                      {m.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(m.target_date)}</p>
                  </div>
                </div>
              );
            })}
            {/* spacer to reserve room for absolutely-positioned labels */}
            <div className="h-12" />
          </div>
          {/* start / end captions */}
          <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
            <span>Start · {formatDate(task.start_date || task.created_at)}</span>
            <span>Due · {formatDate(task.due_date)}</span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-3">No milestones set — add one to map this project's timeline.</p>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub, accent }: { icon: React.ElementType; label: string; value: string; sub: string; accent: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <p className={cn('text-lg font-extrabold leading-none', accent)}>{value}</p>
      <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>
    </div>
  );
}
