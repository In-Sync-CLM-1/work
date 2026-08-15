import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { CalendarClock, FileBarChart2, ListChecks, Loader2, Table2, Trophy } from 'lucide-react';
import { useTheme } from '@/lib/theme-context';
import { vizTokens, STATUS_LABELS } from '@/lib/vizPalette';
import { useTeamTaskAnalytics } from '@/hooks/useTeamTaskAnalytics';
import { EChart } from './EChart';
import { StatTile } from './StatTile';
import { AnalyticsDateFilter, defaultAnalyticsRange, type AnalyticsRange } from './AnalyticsDateFilter';
import {
  assigneeWorkloadOption,
  milestoneDonutOption,
  overdueAgingOption,
  priorityDonutOption,
  statusPipelineOption,
  subcategoryBarOption,
  taskTrendOption,
  turnaroundHistogramOption,
} from './taskChartOptions';

interface Props {
  /** null = the whole organisation. */
  departmentId: string | null;
  teamLabel: string;
}

function Panel({ title, extra, children }: { title: string; extra?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between gap-2 mb-1">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {extra}
      </div>
      {children}
    </div>
  );
}

/**
 * Task analytics for a team: workload, turnaround, backlog and milestones.
 *
 * Every figure obeys the one date filter at the top, except the three "as of
 * today" panels, which say so in their own titles.
 */
export function TeamTaskAnalytics({ departmentId, teamLabel }: Props) {
  const [range, setRange] = useState<AnalyticsRange>(defaultAnalyticsRange);
  const [showTable, setShowTable] = useState(false);
  const { theme } = useTheme();
  const v = useMemo(() => vizTokens(theme === 'dark'), [theme]);
  const a = useTeamTaskAnalytics(departmentId, range);

  const pipelineTotal = a.statusPipeline.reduce((s, p) => s + p.count, 0);
  const hasAnyData = pipelineTotal > 0 || a.kpis.openNow > 0 || a.milestoneStats.total > 0;

  const heatmapHeight = Math.max(160, a.agingRows.length * 38 + 90);
  const subcategoryHeight = Math.max(180, a.subcategoryBreakdown.length * 40 + 70);
  const workloadHeight = Math.max(180, a.assigneeRows.length * 34 + 60);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">{teamLabel} Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Workload, turnaround and milestones — every figure follows the filter.
          </p>
        </div>
        <AnalyticsDateFilter value={range} onChange={setRange} />
      </div>

      {a.isLoading ? (
        <div className="py-16 text-center">
          <Loader2 className="h-7 w-7 animate-spin mx-auto text-muted-foreground" />
        </div>
      ) : !hasAnyData ? (
        <div className="rounded-lg border bg-card py-14 text-center space-y-2">
          <FileBarChart2 className="h-9 w-9 mx-auto text-muted-foreground" />
          <p className="font-medium">No {teamLabel} tasks yet</p>
          <p className="text-sm text-muted-foreground">
            Widen the date range, or create the first task here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            <StatTile label="Created" value={String(a.kpis.createdInRange)} sub="in this period" />
            <StatTile label="Signed off" value={String(a.kpis.doneInRange)} sub={`${a.kpis.completionRatePct}% of created`} />
            <StatTile label="Open now" value={String(a.kpis.openNow)} sub="not yet signed off" />
            <StatTile
              label="Awaiting sign-off"
              value={String(a.kpis.awaitingSignoffNow)}
              sub={a.kpis.awaitingSignoffNow > 0 ? 'done, needs your nod' : 'nothing waiting'}
              tone={a.kpis.awaitingSignoffNow > 0 ? 'alert' : 'default'}
            />
            <StatTile
              label="Overdue now"
              value={String(a.kpis.overdueNow)}
              sub={a.kpis.overdueNow > 0 ? 'needs attention' : 'all on track'}
              tone={a.kpis.overdueNow > 0 ? 'alert' : 'default'}
            />
            <StatTile
              label="Avg turnaround"
              value={a.kpis.avgTurnaroundDays === null ? '—' : `${a.kpis.avgTurnaroundDays}d`}
              sub="created → signed off"
            />
          </div>

          {/* Status pipeline */}
          <Panel
            title={`Status pipeline — where this period's ${pipelineTotal} task${pipelineTotal === 1 ? '' : 's'} stand`}
            extra={
              <button
                type="button"
                onClick={() => setShowTable((s) => !s)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <Table2 className="h-3.5 w-3.5" />
                {showTable ? 'Hide table' : 'View as table'}
              </button>
            }
          >
            <EChart
              option={statusPipelineOption(v, a.statusPipeline, pipelineTotal)}
              height={96}
              ariaLabel={`Status pipeline for ${teamLabel}`}
            />
            {/* The table twin — identity never rests on colour alone. */}
            {showTable && (
              <div className="mt-2 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground border-b">
                      <th className="py-1.5 pr-3 font-medium">Status</th>
                      <th className="py-1.5 pr-3 font-medium text-right">Tasks</th>
                      <th className="py-1.5 font-medium text-right">Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {a.statusPipeline.map((s) => (
                      <tr key={s.status} className="border-b last:border-0">
                        <td className="py-1.5 pr-3">
                          <span className="inline-flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-sm shrink-0"
                              style={{ background: v.status[s.status] }}
                            />
                            {STATUS_LABELS[s.status]}
                          </span>
                        </td>
                        <td className="py-1.5 pr-3 text-right tabular-nums">{s.count}</td>
                        <td className="py-1.5 text-right tabular-nums text-muted-foreground">
                          {pipelineTotal > 0 ? Math.round((s.count / pipelineTotal) * 100) : 0}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          {/* Trend */}
          <Panel title="Created vs signed off, over time">
            <EChart
              option={taskTrendOption(v, a.months, a.createdByMonth, a.doneByMonth)}
              height={260}
              ariaLabel="Tasks created versus signed off, by month"
            />
          </Panel>

          {/* Priority + Milestones */}
          <div className="grid lg:grid-cols-2 gap-4">
            <Panel title="Priority mix — this period">
              {pipelineTotal > 0 ? (
                <EChart option={priorityDonutOption(v, a.priorityMix)} height={240} ariaLabel="Priority mix" />
              ) : (
                <p className="text-sm text-muted-foreground py-10 text-center">No tasks in this period</p>
              )}
            </Panel>

            <Panel
              title="Milestone completion — as of today"
              extra={
                <span className="text-xs rounded border px-1.5 py-0.5 text-muted-foreground">
                  {a.milestoneStats.completed}/{a.milestoneStats.total}
                </span>
              }
            >
              {a.milestoneStats.total > 0 ? (
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <EChart
                      option={milestoneDonutOption(v, a.milestoneStats.completed, a.milestoneStats.total - a.milestoneStats.completed)}
                      height={160}
                      className="w-[160px]"
                      ariaLabel={`${a.milestoneStats.pctComplete} percent of milestones complete`}
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-xl font-bold tabular-nums">{a.milestoneStats.pctComplete}%</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <CalendarClock className="h-3.5 w-3.5" /> Upcoming
                    </p>
                    {a.milestoneStats.upcoming.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Nothing scheduled</p>
                    ) : (
                      a.milestoneStats.upcoming.slice(0, 4).map((m, i) => (
                        <div key={i} className="text-xs flex items-center justify-between gap-2">
                          <span className="truncate">{m.label} · {m.taskName}</span>
                          <span className="text-muted-foreground shrink-0">{format(new Date(m.date), 'MMM dd')}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-10 text-center">
                  <ListChecks className="h-6 w-6 mx-auto mb-1 opacity-50" />
                  No milestones set on any {teamLabel} task
                </p>
              )}
            </Panel>
          </div>

          {/* Sub-category breakdown */}
          {a.subcategoryBreakdown.length > 0 && (
            <Panel title="Subcategory breakdown — this period">
              <EChart
                option={subcategoryBarOption(v, a.subcategoryBreakdown)}
                height={subcategoryHeight}
                ariaLabel="Tasks by subcategory"
              />
            </Panel>
          )}

          {/* Turnaround + Aging */}
          <div className="grid lg:grid-cols-2 gap-4">
            <Panel title="How long tasks take — created to signed off">
              <EChart
                option={turnaroundHistogramOption(v, a.turnaroundHistogram)}
                height={260}
                ariaLabel="Distribution of task turnaround time"
              />
            </Panel>

            <Panel title="Overdue backlog by age — as of today">
              {a.agingTotals[3] > 0 && (
                <p className="text-xs mb-1 text-[#8a2f2f] dark:text-[#d4536f]">
                  {a.agingTotals[3]} task{a.agingTotals[3] === 1 ? '' : 's'} over 30 days overdue
                </p>
              )}
              {a.agingRows.length > 0 ? (
                <EChart
                  option={overdueAgingOption(v, a.agingRows)}
                  height={heatmapHeight}
                  ariaLabel="Overdue tasks by assignee and age"
                />
              ) : (
                <p className="text-sm text-muted-foreground py-10 text-center">Nothing overdue — clean backlog</p>
              )}
            </Panel>
          </div>

          {/* Workload + Leaderboard */}
          <div className="grid lg:grid-cols-2 gap-4">
            <Panel title="Workload by assignee — this period">
              {a.assigneeRows.length > 0 ? (
                <EChart
                  option={assigneeWorkloadOption(v, a.assigneeRows)}
                  height={workloadHeight}
                  ariaLabel="Workload by assignee"
                />
              ) : (
                <p className="text-sm text-muted-foreground py-10 text-center">No tasks assigned in this period</p>
              )}
            </Panel>

            <Panel title="Leaderboard — most signed off">
              {a.assigneeRows.length === 0 ? (
                <p className="text-sm text-muted-foreground py-10 text-center">No tasks in this period</p>
              ) : (
                <div className="space-y-1.5 mt-2">
                  {a.assigneeRows.slice(0, 8).map((m, idx) => {
                    const pct = m.total > 0 ? Math.round((m.done / m.total) * 100) : 0;
                    return (
                      <div key={m.userId} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-muted/40">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="h-6 w-6 shrink-0 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                            {idx === 0 ? <Trophy className="h-3.5 w-3.5" /> : idx + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{m.name}</p>
                            <p className="text-[11px] text-muted-foreground">{m.total} tasks · {pct}% signed off</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] rounded px-1.5 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                            {m.done} done
                          </span>
                          {m.overdue > 0 && (
                            <span className="text-[10px] rounded px-1.5 py-0.5 bg-red-500/10 text-red-700 dark:text-red-400">
                              {m.overdue} overdue
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
}
