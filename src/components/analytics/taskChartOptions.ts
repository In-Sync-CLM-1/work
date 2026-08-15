import type { EChartsCoreOption } from 'echarts/core';
import {
  axisCommon,
  chartText,
  PRIORITY_LABELS,
  STATUS_LABELS,
  tooltipCommon,
  type VizTokens,
} from '@/lib/vizPalette';
import type { TaskPriority, TaskStatus } from '@/types/task';
import type { AssigneeRow } from '@/hooks/useTeamTaskAnalytics';
import { TASK_AGING_BUCKETS } from '@/hooks/useTeamTaskAnalytics';

const truncate = (s: string, n = 18) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

const statusColor = (v: VizTokens, s: TaskStatus) => v.status[s];
const priorityColor = (v: VizTokens, p: TaskPriority) =>
  v.priorityRamp[({ low: 0, medium: 1, high: 2, urgent: 3 } as const)[p]];

/** One horizontal stacked bar: how the period's tasks split across the pipeline. */
export function statusPipelineOption(
  v: VizTokens,
  pipeline: { status: TaskStatus; count: number }[],
  total: number,
): EChartsCoreOption {
  const nonZero = pipeline.filter((p) => p.count > 0);
  const lastKey = nonZero.length ? nonZero[nonZero.length - 1].status : null;
  return {
    textStyle: chartText(v),
    grid: { left: 0, right: 8, top: 30, bottom: 0, containLabel: false, height: 34 },
    legend: {
      top: 0, left: 0, icon: 'roundRect', itemWidth: 12, itemHeight: 8, itemGap: 14,
      textStyle: { color: v.inkSecondary, fontSize: 12 },
    },
    tooltip: {
      ...tooltipCommon(v),
      formatter: (p: { seriesName: string; value: number }) => {
        const pct = total > 0 ? Math.round((p.value / total) * 100) : 0;
        return `<b>${p.value} task${p.value === 1 ? '' : 's'}</b> · ${pct}%<br/><span style="color:${v.inkMuted}">${p.seriesName}</span>`;
      },
    },
    xAxis: { type: 'value', show: false, max: total > 0 ? total : 1 },
    yAxis: { type: 'category', data: [''], show: false },
    series: pipeline.map((seg) => ({
      name: STATUS_LABELS[seg.status],
      type: 'bar',
      stack: 'pipe',
      data: [seg.count],
      color: statusColor(v, seg.status),
      barMaxWidth: 34,
      itemStyle: {
        // 2px surface gap between segments, rounded data-end on the last one.
        borderColor: v.surface,
        borderWidth: 2,
        borderRadius: seg.status === lastKey ? [0, 4, 4, 0] : 0,
      },
      // Direct label wherever the segment is wide enough to hold it — this is
      // the secondary encoding that keeps the stack readable without colour.
      label: {
        show: total > 0 && seg.count / total > 0.08,
        formatter: () => String(seg.count),
        color: '#ffffff',
        fontSize: 11,
        fontWeight: 600,
      },
    })),
  };
}

/** Priority mix donut — an ordinal ramp, low to urgent. */
export function priorityDonutOption(
  v: VizTokens,
  mix: { priority: TaskPriority; count: number }[],
): EChartsCoreOption {
  const data = mix.filter((m) => m.count > 0);
  const total = data.reduce((s, d) => s + d.count, 0);
  return {
    textStyle: chartText(v),
    tooltip: {
      ...tooltipCommon(v),
      formatter: (p: { name: string; value: number }) => {
        const pct = total > 0 ? Math.round((p.value / total) * 100) : 0;
        return `<b>${p.value} task${p.value === 1 ? '' : 's'}</b> · ${pct}%<br/><span style="color:${v.inkMuted}">${p.name}</span>`;
      },
    },
    series: [
      {
        type: 'pie',
        radius: ['48%', '72%'],
        avoidLabelOverlap: true,
        itemStyle: { borderColor: v.surface, borderWidth: 2 },
        label: {
          show: true,
          formatter: (p: { name: string; value: number }) => `${p.name}\n${p.value}`,
          fontSize: 11,
          color: v.inkSecondary,
        },
        data: data.map((d) => ({
          name: PRIORITY_LABELS[d.priority],
          value: d.count,
          itemStyle: { color: priorityColor(v, d.priority) },
        })),
      },
    ],
  };
}

/** Sub-category breakdown: total vs signed off, grouped horizontal bars. */
export function subcategoryBarOption(
  v: VizTokens,
  rows: { subcategory: string; total: number; done: number }[],
): EChartsCoreOption {
  const display = rows.slice().reverse();
  return {
    textStyle: chartText(v),
    grid: { left: 8, right: 24, top: 30, bottom: 8, containLabel: true },
    legend: {
      top: 0, left: 0, itemGap: 16, itemWidth: 12, itemHeight: 8, icon: 'roundRect',
      textStyle: { color: v.inkSecondary, fontSize: 12 },
      data: ['Total', 'Signed off'],
    },
    tooltip: {
      ...tooltipCommon(v),
      trigger: 'axis',
      axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(128,128,128,0.08)' } },
    },
    xAxis: { type: 'value', ...axisCommon(v), minInterval: 1 },
    yAxis: {
      type: 'category',
      data: display.map((r) => r.subcategory),
      ...axisCommon(v),
      splitLine: { show: false },
      axisLabel: { ...axisCommon(v).axisLabel, formatter: (s: string) => truncate(s, 20) },
    },
    series: [
      {
        name: 'Total', type: 'bar', data: display.map((r) => r.total),
        color: v.status.in_progress, barMaxWidth: 14, itemStyle: { borderRadius: [0, 4, 4, 0] },
      },
      {
        name: 'Signed off', type: 'bar', data: display.map((r) => r.done),
        color: v.status.closed, barMaxWidth: 14, itemStyle: { borderRadius: [0, 4, 4, 0] },
      },
    ],
  };
}

/** Trend: created vs signed off, per month across the range. */
export function taskTrendOption(
  v: VizTokens,
  months: { label: string }[],
  created: number[],
  done: number[],
): EChartsCoreOption {
  return {
    textStyle: chartText(v),
    grid: { left: 8, right: 16, top: 40, bottom: 8, containLabel: true },
    legend: {
      top: 0, left: 0, itemGap: 16,
      textStyle: { color: v.inkSecondary, fontSize: 12 },
      data: ['Created', 'Signed off'],
    },
    tooltip: {
      ...tooltipCommon(v),
      trigger: 'axis',
      axisPointer: { type: 'line', lineStyle: { color: v.axis, width: 1 } },
    },
    xAxis: {
      type: 'category', data: months.map((m) => m.label),
      ...axisCommon(v), splitLine: { show: false },
    },
    yAxis: { type: 'value', ...axisCommon(v), minInterval: 1 },
    series: [
      {
        name: 'Created', type: 'line', data: created, color: v.status.in_progress,
        lineStyle: { width: 2 }, symbol: 'circle', symbolSize: 8,
        itemStyle: { borderColor: v.surface, borderWidth: 2 },
      },
      {
        name: 'Signed off', type: 'line', data: done, color: v.status.closed,
        lineStyle: { width: 2 }, symbol: 'circle', symbolSize: 8,
        itemStyle: { borderColor: v.surface, borderWidth: 2 },
        areaStyle: { color: v.status.closed, opacity: 0.08 },
      },
    ],
  };
}

/** How long tasks take, start to sign-off. */
export function turnaroundHistogramOption(
  v: VizTokens,
  buckets: { label: string; count: number }[],
): EChartsCoreOption {
  return {
    textStyle: chartText(v),
    grid: { left: 8, right: 16, top: 16, bottom: 34, containLabel: true },
    tooltip: {
      ...tooltipCommon(v),
      trigger: 'axis',
      axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(128,128,128,0.08)' } },
      formatter: (ps: { dataIndex: number }[]) => {
        const b = buckets[ps[0].dataIndex];
        return `<b>${b.count} task${b.count === 1 ? '' : 's'}</b><br/><span style="color:${v.inkMuted}">signed off within ${b.label} day${b.label === '1' ? '' : 's'}</span>`;
      },
    },
    xAxis: {
      type: 'category', data: buckets.map((b) => b.label),
      name: 'Days from created to signed off', nameLocation: 'middle', nameGap: 32,
      nameTextStyle: { fontSize: 11, color: v.inkMuted },
      ...axisCommon(v), splitLine: { show: false },
    },
    yAxis: { type: 'value', ...axisCommon(v), minInterval: 1 },
    series: [
      {
        type: 'bar', data: buckets.map((b) => b.count), barMaxWidth: 26,
        itemStyle: { color: v.status.in_progress, borderRadius: [4, 4, 0, 0] },
        label: {
          show: true, position: 'top', fontSize: 10.5, color: v.inkMuted,
          formatter: (p: { value: number }) => (p.value > 0 ? p.value : ''),
        },
      },
    ],
  };
}

/** Overdue backlog: assignee rows × age buckets. */
export function overdueAgingOption(
  v: VizTokens,
  rows: { name: string; buckets: number[] }[],
): EChartsCoreOption {
  const maxCell = Math.max(1, ...rows.flatMap((r) => r.buckets));
  const names = rows.map((r) => r.name).reverse();
  const data: object[] = [];
  rows.forEach((r, ri) => {
    r.buckets.forEach((val, bi) => {
      if (val <= 0) return;
      const dark = val / maxCell > 0.55;
      data.push({ value: [bi, rows.length - 1 - ri, val], label: { color: dark ? '#ffffff' : v.ink } });
    });
  });
  return {
    textStyle: chartText(v),
    grid: { left: 8, right: 16, top: 8, bottom: 44, containLabel: true },
    tooltip: {
      ...tooltipCommon(v),
      formatter: (p: { value: [number, number, number] }) => {
        const [bi, yi, val] = p.value;
        return `<b>${val} task${val === 1 ? '' : 's'}</b><br/><span style="color:${v.inkMuted}">${names[yi]} · ${TASK_AGING_BUCKETS[bi].label} overdue</span>`;
      },
    },
    xAxis: {
      type: 'category', position: 'bottom', data: TASK_AGING_BUCKETS.map((b) => b.label),
      ...axisCommon(v), splitLine: { show: false },
      axisLabel: { ...axisCommon(v).axisLabel, fontSize: 12 },
    },
    yAxis: {
      type: 'category', data: names, ...axisCommon(v), splitLine: { show: false },
      axisLabel: { ...axisCommon(v).axisLabel, formatter: (s: string) => truncate(s, 22) },
    },
    visualMap: {
      min: 0, max: maxCell, calculable: false, orient: 'horizontal', right: 8, bottom: 0,
      itemWidth: 10, itemHeight: 90, text: [String(maxCell), '0'],
      textStyle: { color: v.inkMuted, fontSize: 10 },
      inRange: { color: v.agingRamp as unknown as string[] },
    },
    series: [
      {
        type: 'heatmap', data,
        label: {
          show: true, fontSize: 11, fontWeight: 600,
          formatter: (p: { value: [number, number, number] }) => String(p.value[2]),
        },
        itemStyle: { borderColor: v.surface, borderWidth: 2, borderRadius: 4 },
        emphasis: { itemStyle: { shadowBlur: 8, shadowColor: 'rgba(0,0,0,0.25)' } },
      },
    ],
  };
}

/** Workload: stacked status counts per person. */
export function assigneeWorkloadOption(v: VizTokens, rows: AssigneeRow[]): EChartsCoreOption {
  const display = rows.slice().reverse();
  const stackStyle = { borderColor: v.surface, borderWidth: 2 };
  return {
    textStyle: chartText(v),
    grid: { left: 8, right: 16, top: 30, bottom: 8, containLabel: true },
    legend: {
      top: 0, left: 0, itemGap: 14, icon: 'roundRect', itemWidth: 12, itemHeight: 8,
      textStyle: { color: v.inkSecondary, fontSize: 12 },
    },
    tooltip: {
      ...tooltipCommon(v),
      trigger: 'axis',
      axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(128,128,128,0.08)' } },
    },
    xAxis: { type: 'value', ...axisCommon(v), minInterval: 1 },
    yAxis: {
      type: 'category', data: display.map((r) => truncate(r.name, 20)),
      ...axisCommon(v), splitLine: { show: false },
    },
    series: [
      { name: STATUS_LABELS.closed, type: 'bar', stack: 's', data: display.map((r) => r.done), color: v.status.closed, barMaxWidth: 18, itemStyle: stackStyle },
      { name: STATUS_LABELS.completed, type: 'bar', stack: 's', data: display.map((r) => r.awaitingSignoff), color: v.status.completed, barMaxWidth: 18, itemStyle: stackStyle },
      { name: STATUS_LABELS.in_progress, type: 'bar', stack: 's', data: display.map((r) => r.inProgress), color: v.status.in_progress, barMaxWidth: 18, itemStyle: stackStyle },
      { name: STATUS_LABELS.pending, type: 'bar', stack: 's', data: display.map((r) => r.pending), color: v.status.pending, barMaxWidth: 18, itemStyle: { ...stackStyle, borderRadius: [0, 4, 4, 0] } },
    ],
  };
}

/** Milestone completion: a two-segment progress donut. */
export function milestoneDonutOption(
  v: VizTokens,
  completed: number,
  remaining: number,
): EChartsCoreOption {
  return {
    textStyle: chartText(v),
    tooltip: { ...tooltipCommon(v) },
    series: [
      {
        type: 'pie',
        radius: ['55%', '78%'],
        itemStyle: { borderColor: v.surface, borderWidth: 2 },
        label: { show: false },
        data: [
          { name: 'Completed', value: completed, itemStyle: { color: v.status.closed } },
          { name: 'Remaining', value: remaining, itemStyle: { color: v.neutralFill } },
        ],
      },
    ],
  };
}
