import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { fetchAllRows } from '@/lib/fetchAllRows';
import { useAuth } from '@/lib/auth-context';
import type { AnalyticsRange } from '@/components/analytics/AnalyticsDateFilter';
import type { TaskPriority, TaskStatus } from '@/types/task';

interface TaskRow {
  id: string;
  task_name: string;
  status: TaskStatus;
  priority: TaskPriority;
  subcategory: string | null;
  department_id: string | null;
  assigned_to: string;
  due_date: string;
  created_at: string;
  completed_at: string | null;
  closed_at: string | null;
  restart_reason: string | null;
  assigned_user: { full_name: string | null; email: string | null } | null;
}

interface MilestoneRow {
  id: string;
  task_id: string;
  title: string;
  target_date: string;
  completed: boolean;
}

const DAY = 24 * 60 * 60 * 1000;
const toDate = (iso: string) => new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''));
const ym = (iso: string) => iso.slice(0, 7);

// A task is finished when it has been signed off. 'completed' means the doer is
// done but the assigner has not accepted it yet — still open work.
const isDone = (s: TaskStatus) => s === 'closed';
const isOpen = (s: TaskStatus) => s === 'pending' || s === 'in_progress' || s === 'completed';

function monthKeys(from: Date, to: Date): { key: string; label: string }[] {
  const out: { key: string; label: string }[] = [];
  const d = new Date(from.getFullYear(), from.getMonth(), 1);
  const end = new Date(to.getFullYear(), to.getMonth(), 1);
  // Guard against a pathological range producing thousands of columns.
  while (d <= end && out.length < 120) {
    out.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleString('en-IN', { month: 'short', year: '2-digit' }),
    });
    d.setMonth(d.getMonth() + 1);
  }
  return out;
}

export const TASK_AGING_BUCKETS = [
  { label: '0–7 days', min: 0, max: 7 },
  { label: '8–14 days', min: 8, max: 14 },
  { label: '15–30 days', min: 15, max: 30 },
  { label: '30+ days', min: 31, max: null as number | null },
];
const agingBucketIndex = (days: number) => (days <= 7 ? 0 : days <= 14 ? 1 : days <= 30 ? 2 : 3);

export const TURNAROUND_BUCKETS = ['0', '1', '2–3', '4–7', '8–14', '15–30', '30+'];
const turnaroundBucketIndex = (days: number) =>
  days === 0 ? 0 : days === 1 ? 1 : days <= 3 ? 2 : days <= 7 ? 3 : days <= 14 ? 4 : days <= 30 ? 5 : 6;

export interface AssigneeRow {
  userId: string;
  name: string;
  total: number;
  done: number;
  inProgress: number;
  pending: number;
  awaitingSignoff: number;
  cancelled: number;
  overdue: number;
  onTime: number;
  avgTurnaroundDays: number | null;
}

export interface TeamTaskAnalytics {
  kpis: {
    createdInRange: number;
    doneInRange: number;
    completionRatePct: number;
    openNow: number;
    overdueNow: number;
    awaitingSignoffNow: number;
    avgTurnaroundDays: number | null;
    onTimeRatePct: number | null;
  };
  statusPipeline: { status: TaskStatus; count: number }[];
  priorityMix: { priority: TaskPriority; count: number }[];
  subcategoryBreakdown: { subcategory: string; total: number; done: number }[];
  months: { key: string; label: string }[];
  createdByMonth: number[];
  doneByMonth: number[];
  turnaroundHistogram: { label: string; count: number }[];
  agingRows: { name: string; buckets: number[]; total: number }[];
  agingTotals: number[];
  milestoneStats: {
    total: number;
    completed: number;
    pctComplete: number;
    upcoming: { taskName: string; label: string; date: string }[];
  };
  assigneeRows: AssigneeRow[];
  restartedCount: number;
  isLoading: boolean;
}

/**
 * Task analytics for the whole organisation, or one department.
 *
 * Everything except the "now" snapshots (open, overdue, milestones) is scoped to
 * the date range, so a figure on the page never mixes periods silently.
 */
export function useTeamTaskAnalytics(
  departmentId: string | null,
  range: AnalyticsRange,
): TeamTaskAnalytics {
  const { user, orgId } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['team-task-analytics', orgId, departmentId],
    enabled: !!user && !!orgId,
    staleTime: 60_000,
    queryFn: async () => {
      const [rows, milestones] = await Promise.all([
        fetchAllRows<TaskRow>(() => {
          let q = supabase
            .from('tasks')
            .select(
              'id, task_name, status, priority, subcategory, department_id, assigned_to, due_date, created_at, completed_at, closed_at, restart_reason, assigned_user:profiles!tasks_assigned_to_fkey(full_name, email)',
            )
            .order('created_at', { ascending: true });
          // Scope to the organisation being worked in — see useTasks.
          if (orgId) q = q.eq('org_id', orgId);
          return departmentId ? q.eq('department_id', departmentId) : q;
        }),
        fetchAllRows<MilestoneRow>(() =>
          supabase.from('task_milestones').select('id, task_id, title, target_date, completed'),
        ),
      ]);
      return { rows, milestones };
    },
  });

  const rows = useMemo(() => data?.rows ?? [], [data]);
  const milestones = useMemo(() => data?.milestones ?? [], [data]);

  const computed = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const fromIso = range.from ? range.from.toISOString().slice(0, 10) : '0000';
    const toIso = range.to ? range.to.toISOString().slice(0, 10) : '9999';
    const inRange = (iso: string) => iso.slice(0, 10) >= fromIso && iso.slice(0, 10) <= toIso;

    const rangeTasks = rows.filter((t) => inRange(t.created_at));

    // ── "now" snapshot: independent of the date filter ──
    const openNow = rows.filter((t) => isOpen(t.status)).length;
    const awaitingSignoffNow = rows.filter((t) => t.status === 'completed').length;
    const overdueTasks = rows.filter(
      (t) => isOpen(t.status) && toDate(t.due_date) < today,
    );

    // ── range-scoped flow ──
    const createdInRange = rangeTasks.length;
    const doneTasks = rangeTasks.filter((t) => isDone(t.status));
    const doneInRange = doneTasks.length;
    const completionRatePct = createdInRange > 0 ? Math.round((doneInRange / createdInRange) * 100) : 0;

    // Sign-off is the finish line, so turnaround is measured to closed_at,
    // falling back to completed_at for rows that predate sign-off.
    const finishedAt = (t: TaskRow) => t.closed_at || t.completed_at;
    const turnaroundDays = doneTasks
      .filter((t) => finishedAt(t))
      .map((t) =>
        Math.max(0, Math.round((toDate(finishedAt(t)!).getTime() - toDate(t.created_at).getTime()) / DAY)),
      );
    const avgTurnaroundDays = turnaroundDays.length
      ? Math.round(turnaroundDays.reduce((a, b) => a + b, 0) / turnaroundDays.length)
      : null;

    const onTimeCount = doneTasks.filter((t) => {
      const f = finishedAt(t);
      return f && toDate(f) <= toDate(t.due_date);
    }).length;
    const onTimeRatePct = doneInRange > 0 ? Math.round((onTimeCount / doneInRange) * 100) : null;

    const statusOrder: TaskStatus[] = ['pending', 'in_progress', 'completed', 'closed', 'cancelled'];
    const statusPipeline = statusOrder.map((status) => ({
      status,
      count: rangeTasks.filter((t) => t.status === status).length,
    }));

    const priorityOrder: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];
    const priorityMix = priorityOrder.map((priority) => ({
      priority,
      count: rangeTasks.filter((t) => t.priority === priority).length,
    }));

    const subMap = new Map<string, { total: number; done: number }>();
    for (const t of rangeTasks) {
      if (!t.subcategory) continue;
      const row = subMap.get(t.subcategory) || { total: 0, done: 0 };
      row.total += 1;
      if (isDone(t.status)) row.done += 1;
      subMap.set(t.subcategory, row);
    }
    const subcategoryBreakdown = Array.from(subMap.entries())
      .map(([subcategory, v]) => ({ subcategory, ...v }))
      .sort((a, b) => b.total - a.total);

    // ── trend across the range's own axis ──
    const axisTo = range.to || new Date();
    let axisFrom = range.from;
    if (!axisFrom) {
      const first = rows[0]?.created_at;
      axisFrom = first ? toDate(first) : new Date(axisTo.getFullYear(), axisTo.getMonth() - 5, 1);
    }
    const months = monthKeys(axisFrom, axisTo);
    const monthIdx = new Map(months.map((m, i) => [m.key, i]));
    const createdByMonth = new Array(months.length).fill(0);
    const doneByMonth = new Array(months.length).fill(0);
    for (const t of rangeTasks) {
      const idx = monthIdx.get(ym(t.created_at));
      if (idx !== undefined) createdByMonth[idx] += 1;
    }
    for (const t of doneTasks) {
      const f = finishedAt(t);
      if (!f) continue;
      const idx = monthIdx.get(ym(f));
      if (idx !== undefined) doneByMonth[idx] += 1;
    }

    const turnaroundHistogram = TURNAROUND_BUCKETS.map((label) => ({ label, count: 0 }));
    for (const d of turnaroundDays) turnaroundHistogram[turnaroundBucketIndex(d)].count += 1;

    // ── overdue aging by assignee (now) ──
    const agingByAssignee = new Map<string, { name: string; buckets: number[]; total: number }>();
    for (const t of overdueTasks) {
      const age = Math.floor((today.getTime() - toDate(t.due_date).getTime()) / DAY);
      const name = t.assigned_user?.full_name || t.assigned_user?.email || 'Unassigned';
      let row = agingByAssignee.get(t.assigned_to);
      if (!row) {
        row = { name, buckets: [0, 0, 0, 0], total: 0 };
        agingByAssignee.set(t.assigned_to, row);
      }
      row.buckets[agingBucketIndex(age)] += 1;
      row.total += 1;
    }
    const agingRows = Array.from(agingByAssignee.values()).sort((a, b) => b.total - a.total).slice(0, 15);
    const agingTotals = [0, 1, 2, 3].map((b) => agingRows.reduce((s, r) => s + r.buckets[b], 0));

    // ── milestones (now, across the tasks in scope) ──
    const taskById = new Map(rows.map((t) => [t.id, t]));
    let msTotal = 0;
    let msCompleted = 0;
    const upcoming: { taskName: string; label: string; date: string }[] = [];
    for (const m of milestones) {
      const task = taskById.get(m.task_id);
      if (!task) continue; // milestone on a task outside this department
      msTotal += 1;
      if (m.completed) msCompleted += 1;
      else if (toDate(m.target_date) >= today) {
        upcoming.push({ taskName: task.task_name, label: m.title || 'Milestone', date: m.target_date });
      }
    }
    upcoming.sort((a, b) => toDate(a.date).getTime() - toDate(b.date).getTime());
    const milestoneStats = {
      total: msTotal,
      completed: msCompleted,
      pctComplete: msTotal > 0 ? Math.round((msCompleted / msTotal) * 100) : 0,
      upcoming: upcoming.slice(0, 8),
    };

    // ── per-assignee rows / leaderboard ──
    interface Agg extends Omit<AssigneeRow, 'avgTurnaroundDays'> {
      turn: number[];
    }
    const byAssignee = new Map<string, Agg>();
    for (const t of rangeTasks) {
      let a = byAssignee.get(t.assigned_to);
      if (!a) {
        a = {
          userId: t.assigned_to,
          name: t.assigned_user?.full_name || t.assigned_user?.email || 'Unknown',
          total: 0, done: 0, inProgress: 0, pending: 0, awaitingSignoff: 0,
          cancelled: 0, overdue: 0, onTime: 0, turn: [],
        };
        byAssignee.set(t.assigned_to, a);
      }
      a.total += 1;
      if (isDone(t.status)) {
        a.done += 1;
        const f = finishedAt(t);
        if (f) {
          a.turn.push(Math.max(0, Math.round((toDate(f).getTime() - toDate(t.created_at).getTime()) / DAY)));
          if (toDate(f) <= toDate(t.due_date)) a.onTime += 1;
        }
      } else if (t.status === 'in_progress') a.inProgress += 1;
      else if (t.status === 'pending') a.pending += 1;
      else if (t.status === 'completed') a.awaitingSignoff += 1;
      else if (t.status === 'cancelled') a.cancelled += 1;
      if (isOpen(t.status) && toDate(t.due_date) < today) a.overdue += 1;
    }
    const assigneeRows: AssigneeRow[] = Array.from(byAssignee.values())
      .map(({ turn, ...a }) => ({
        ...a,
        avgTurnaroundDays: turn.length ? Math.round(turn.reduce((x, y) => x + y, 0) / turn.length) : null,
      }))
      .sort((a, b) => b.done - a.done || b.total - a.total)
      .slice(0, 15);

    return {
      kpis: {
        createdInRange,
        doneInRange,
        completionRatePct,
        openNow,
        overdueNow: overdueTasks.length,
        awaitingSignoffNow,
        avgTurnaroundDays,
        onTimeRatePct,
      },
      statusPipeline,
      priorityMix,
      subcategoryBreakdown,
      months,
      createdByMonth,
      doneByMonth,
      turnaroundHistogram,
      agingRows,
      agingTotals,
      milestoneStats,
      assigneeRows,
      restartedCount: rangeTasks.filter((t) => t.restart_reason).length,
    };
  }, [rows, milestones, range]);

  return { ...computed, isLoading };
}
