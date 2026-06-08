import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Task, TaskStatus, TaskMilestone } from '@/types/task';
import { cn, formatDate } from '@/lib/utils';

interface TaskTimelineProps {
  tasks: Task[];
  milestonesByTask: Record<string, TaskMilestone[]>;
}

const DAY = 1000 * 60 * 60 * 24;
const LABEL_W = 208; // px

const BAR_COLOR: Record<TaskStatus, string> = {
  pending: 'bg-amber-400',
  in_progress: 'bg-blue-500',
  completed: 'bg-emerald-500',
  closed: 'bg-violet-500',
  cancelled: 'bg-gray-400',
};

function startOfDay(d: Date | string) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

export function TaskTimeline({ tasks, milestonesByTask }: TaskTimelineProps) {
  const navigate = useNavigate();

  const model = useMemo(() => {
    const roots = tasks.filter((t) => !t.parent_task_id);
    const childrenByParent: Record<string, Task[]> = {};
    for (const t of tasks) {
      if (t.parent_task_id) (childrenByParent[t.parent_task_id] ??= []).push(t);
    }

    // date range across tasks + milestones
    let min = Infinity, max = -Infinity;
    const consider = (d?: string | null) => {
      if (!d) return;
      const t = startOfDay(d).getTime();
      if (t < min) min = t;
      if (t > max) max = t;
    };
    for (const t of tasks) {
      consider(t.start_date || t.created_at);
      consider(t.due_date);
    }
    for (const list of Object.values(milestonesByTask)) for (const m of list) consider(m.target_date);

    if (!isFinite(min) || !isFinite(max)) return null;
    // pad 2 days each side, ensure non-zero span
    min -= 2 * DAY;
    max += 2 * DAY;
    if (max <= min) max = min + 30 * DAY;

    const span = max - min;
    const days = span / DAY;
    const trackW = Math.min(2600, Math.max(680, Math.round(days * 15)));

    // month ticks
    const ticks: { label: string; left: number }[] = [];
    const d = new Date(min);
    d.setDate(1);
    while (d.getTime() <= max) {
      const left = ((startOfDay(d).getTime() - min) / span) * 100;
      if (left >= 0 && left <= 100) ticks.push({ label: d.toLocaleString('en-US', { month: 'short', year: '2-digit' }), left });
      d.setMonth(d.getMonth() + 1);
    }

    const pct = (date: string | Date) => Math.max(0, Math.min(100, ((startOfDay(date).getTime() - min) / span) * 100));
    const today = startOfDay(new Date()).getTime();
    const todayPct = today >= min && today <= max ? ((today - min) / span) * 100 : null;

    return { roots, childrenByParent, span, trackW, ticks, pct, todayPct };
  }, [tasks, milestonesByTask]);

  if (!model || model.roots.length === 0) {
    return <div className="rounded-2xl border border-border bg-card py-16 text-center text-sm text-muted-foreground">No tasks to plot on the timeline.</div>;
  }

  const { roots, childrenByParent, trackW, ticks, pct, todayPct } = model;

  const Gridlines = () => (
    <>
      {ticks.map((t, i) => (
        <div key={i} className="absolute top-0 bottom-0 w-px bg-border/60" style={{ left: `${t.left}%` }} />
      ))}
      {todayPct != null && (
        <div className="absolute top-0 bottom-0 w-px bg-red-400/70 z-10" style={{ left: `${todayPct}%` }} />
      )}
    </>
  );

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <div style={{ minWidth: LABEL_W + trackW }}>
          {/* Header axis */}
          <div className="flex items-stretch border-b border-border bg-muted/40">
            <div className="shrink-0 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground" style={{ width: LABEL_W }}>
              Project
            </div>
            <div className="relative h-8" style={{ width: trackW }}>
              {ticks.map((t, i) => (
                <div key={i} className="absolute top-1.5 text-[11px] font-medium text-muted-foreground" style={{ left: `${t.left}%` }}>
                  {t.label}
                </div>
              ))}
              {todayPct != null && (
                <div className="absolute -bottom-0 text-[10px] font-bold text-red-500" style={{ left: `${todayPct}%`, transform: 'translateX(-50%)' }}>
                  today
                </div>
              )}
            </div>
          </div>

          {/* Rows */}
          {roots.map((t) => {
            const start = t.start_date || t.created_at;
            const left = pct(start);
            const right = pct(t.due_date);
            const width = Math.max(1.5, right - left);
            const ms = milestonesByTask[t.id] ?? [];
            const kids = childrenByParent[t.id] ?? [];
            return (
              <div key={t.id}>
                {/* project row */}
                <div className="flex items-stretch border-b border-border/60 hover:bg-muted/20 transition-colors">
                  <button
                    onClick={() => navigate(`/tasks/${t.id}`)}
                    className="shrink-0 px-4 py-3 text-left min-w-0"
                    style={{ width: LABEL_W }}
                  >
                    <p className="text-sm font-semibold text-foreground truncate">{t.task_name}</p>
                    <p className="text-[10px] text-muted-foreground">{t.task_number}</p>
                  </button>
                  <div className="relative" style={{ width: trackW, minHeight: 52 }}>
                    <Gridlines />
                    {/* bar */}
                    <div
                      className={cn('absolute top-1/2 -translate-y-1/2 h-5 rounded-md shadow-sm flex items-center', BAR_COLOR[t.status])}
                      style={{ left: `${left}%`, width: `${width}%` }}
                      title={`${formatDate(start)} → ${formatDate(t.due_date)}`}
                    >
                      {t.completion_percentage > 0 && t.completion_percentage < 100 && (
                        <div className="absolute inset-y-0 left-0 rounded-l-md bg-black/20" style={{ width: `${t.completion_percentage}%` }} />
                      )}
                    </div>
                    {/* milestone diamonds */}
                    {ms.map((m) => {
                      const overdue = !m.completed && startOfDay(m.target_date).getTime() < startOfDay(new Date()).getTime();
                      return (
                        <div
                          key={m.id}
                          className="absolute top-1/2 z-20"
                          style={{ left: `${pct(m.target_date)}%`, transform: 'translate(-50%, -50%)' }}
                          title={`${m.title} · ${formatDate(m.target_date)}`}
                        >
                          <div className={cn('h-3 w-3 rotate-45 border border-white shadow', m.completed ? 'bg-emerald-600' : overdue ? 'bg-red-500' : 'bg-amber-500')} />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* subtask rows */}
                {kids.map((k) => {
                  const kStart = k.start_date || k.created_at;
                  const kl = pct(kStart);
                  const kr = pct(k.due_date);
                  const kw = Math.max(1.5, kr - kl);
                  return (
                    <div key={k.id} className="flex items-stretch border-b border-border/40 hover:bg-muted/20 transition-colors">
                      <button onClick={() => navigate(`/tasks/${k.id}`)} className="shrink-0 pl-8 pr-4 py-2 text-left min-w-0" style={{ width: LABEL_W }}>
                        <p className="text-xs text-muted-foreground truncate">↳ {k.task_name}</p>
                      </button>
                      <div className="relative" style={{ width: trackW, minHeight: 34 }}>
                        <Gridlines />
                        <div
                          className={cn('absolute top-1/2 -translate-y-1/2 h-2.5 rounded-full opacity-80', BAR_COLOR[k.status])}
                          style={{ left: `${kl}%`, width: `${kw}%` }}
                          title={`${formatDate(kStart)} → ${formatDate(k.due_date)}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 border-t border-border bg-muted/30 text-[11px] text-muted-foreground">
        <Legend className="bg-amber-400" label="To do" />
        <Legend className="bg-blue-500" label="In progress" />
        <Legend className="bg-emerald-500" label="Completed" />
        <Legend className="bg-violet-500" label="Closed" />
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rotate-45 bg-emerald-600 inline-block" /> milestone</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-px bg-red-400 inline-block" /> today</span>
      </div>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn('h-2.5 w-4 rounded', className)} />
      {label}
    </span>
  );
}
