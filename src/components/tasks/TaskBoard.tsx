import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flag, ListChecks, CalendarClock } from 'lucide-react';
import type { Task, TaskStatus, TaskMilestone } from '@/types/task';
import { cn, formatDate } from '@/lib/utils';
import { getPriorityColor, getPriorityLabel } from '@/lib/taskUtils';

interface TaskBoardProps {
  tasks: Task[];
  milestonesByTask: Record<string, TaskMilestone[]>;
  currentUserId: string;
  isAdmin: boolean;
  onMove: (taskId: string, status: TaskStatus) => void;
}

const COLUMNS: { key: TaskStatus; title: string; dot: string }[] = [
  { key: 'pending',     title: 'To Do',       dot: 'bg-amber-500' },
  { key: 'in_progress', title: 'In Progress', dot: 'bg-blue-500' },
  { key: 'completed',   title: 'Completed',   dot: 'bg-emerald-500' },
  { key: 'closed',      title: 'Closed',      dot: 'bg-violet-500' },
];

function isOverdue(t: Task) {
  if (t.status === 'completed' || t.status === 'closed' || t.status === 'cancelled') return false;
  const d = new Date(t.due_date); d.setHours(0, 0, 0, 0);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return d < today;
}

export function TaskBoard({ tasks, milestonesByTask, currentUserId, isAdmin, onMove }: TaskBoardProps) {
  const navigate = useNavigate();
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<TaskStatus | null>(null);

  // Board shows top-level tasks (projects); subtask counts roll onto the card.
  const { roots, childCount } = useMemo(() => {
    const childCount: Record<string, { total: number; done: number }> = {};
    for (const t of tasks) {
      if (t.parent_task_id) {
        const c = (childCount[t.parent_task_id] ??= { total: 0, done: 0 });
        c.total++;
        if (t.status === 'completed' || t.status === 'closed') c.done++;
      }
    }
    return { roots: tasks.filter((t) => !t.parent_task_id), childCount };
  }, [tasks]);

  const canMove = (t: Task) => isAdmin || currentUserId === t.assigned_to || currentUserId === t.assigned_by;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {COLUMNS.map((col) => {
        const items = roots.filter((t) => t.status === col.key);
        const active = overCol === col.key;
        return (
          <div
            key={col.key}
            onDragOver={(e) => { if (dragId) { e.preventDefault(); setOverCol(col.key); } }}
            onDragLeave={() => setOverCol((c) => (c === col.key ? null : c))}
            onDrop={(e) => {
              e.preventDefault();
              if (dragId) onMove(dragId, col.key);
              setDragId(null); setOverCol(null);
            }}
            className={cn(
              'rounded-2xl border bg-muted/30 p-3 transition-colors min-h-[200px]',
              active ? 'border-primary/50 bg-primary/5' : 'border-border',
            )}
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className={cn('h-2 w-2 rounded-full', col.dot)} />
                <h3 className="text-sm font-bold text-foreground">{col.title}</h3>
              </div>
              <span className="text-xs font-semibold text-muted-foreground bg-card border border-border rounded-full px-2 py-0.5">
                {items.length}
              </span>
            </div>

            <div className="space-y-2">
              {items.map((t) => {
                const cc = childCount[t.id];
                const ms = milestonesByTask[t.id] ?? [];
                const msDone = ms.filter((m) => m.completed).length;
                const overdue = isOverdue(t);
                const movable = canMove(t);
                return (
                  <div
                    key={t.id}
                    draggable={movable}
                    onDragStart={() => movable && setDragId(t.id)}
                    onDragEnd={() => { setDragId(null); setOverCol(null); }}
                    onClick={() => navigate(`/tasks/${t.id}`)}
                    className={cn(
                      'group rounded-xl border border-border bg-card p-3 shadow-sm hover:shadow-md hover:border-primary/30 transition-all',
                      movable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
                      dragId === t.id && 'opacity-50',
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">{t.task_name}</p>
                      <span className={cn('shrink-0 text-[10px] px-1.5 py-0.5 rounded-full border font-medium', getPriorityColor(t.priority))}>
                        {getPriorityLabel(t.priority)}
                      </span>
                    </div>

                    {/* completion bar */}
                    {t.completion_percentage > 0 && (
                      <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${t.completion_percentage}%` }} />
                      </div>
                    )}

                    <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-2.5 text-[11px] text-muted-foreground">
                      <span className={cn('flex items-center gap-1', overdue && 'text-red-600 font-semibold')}>
                        <CalendarClock className="h-3 w-3" />
                        {formatDate(t.due_date)}
                      </span>
                      {cc && (
                        <span className="flex items-center gap-1">
                          <ListChecks className="h-3 w-3" />
                          {cc.done}/{cc.total}
                        </span>
                      )}
                      {ms.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Flag className="h-3 w-3" />
                          {msDone}/{ms.length}
                        </span>
                      )}
                      {t.assigned_user && (
                        <span className="ml-auto flex items-center gap-1.5">
                          <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">
                            {t.assigned_user.full_name?.charAt(0) || '?'}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {items.length === 0 && (
                <div className="rounded-xl border border-dashed border-border/70 py-6 text-center text-xs text-muted-foreground">
                  {active ? 'Drop here' : 'Nothing here'}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
