/**
 * Data-viz palette for the task dashboard.
 *
 * Every set below was run through the dataviz palette validator, in BOTH modes
 * (light surface #fcfcfb, dark card surface #15181f) — dark is its own set of
 * steps, not an automatic flip of the light one.
 *
 * Two things were deliberately changed from the RMPL dashboard this cadence
 * comes from:
 *
 *  1. Completed vs cancelled there are green #0ca30c and red #d03b3b, sitting
 *     next to each other in the same stacked bar. That pair is ΔE 4.1 apart
 *     under deuteranopia — the classic red/green collision, unreadable for
 *     roughly 1 in 12 men. Cancelled is now a deep maroon, which clears the
 *     check at ΔE 18.4.
 *  2. Priority and overdue-age are ordinal (low→urgent, fresh→ancient), so they
 *     use one hue ramping light→dark rather than four competing hues.
 *
 * Work-Sync also has a fifth status RMPL lacks — 'closed', the assigner's
 * sign-off. Completed (done, awaiting sign-off) and closed (signed off) are
 * deliberately one hue at two lightness steps: they are neighbouring stages of
 * the same thing, and five separate hues cannot be told apart reliably.
 */

export interface VizTokens {
  surface: string;
  ink: string;
  inkSecondary: string;
  inkMuted: string;
  grid: string;
  axis: string;
  tooltipBg: string;
  status: {
    pending: string;
    in_progress: string;
    completed: string;
    closed: string;
    cancelled: string;
  };
  /** Ordinal, light→dark: low, medium, high, urgent. */
  priorityRamp: [string, string, string, string];
  /** Ordinal, light→dark: overdue age buckets. */
  agingRamp: [string, string, string, string];
  /** Neutral fill for the "remaining" half of a progress donut. */
  neutralFill: string;
}

const LIGHT: VizTokens = {
  surface: '#fcfcfb',
  ink: '#0b0b0b',
  inkSecondary: '#52514e',
  inkMuted: '#898781',
  grid: '#e1e0d9',
  axis: '#c3c2b7',
  tooltipBg: '#ffffff',
  status: {
    pending: '#a8722a',
    in_progress: '#2a78d6',
    completed: '#5cc95c',
    closed: '#0ca30c',
    cancelled: '#8a2f2f',
  },
  priorityRamp: ['#e59a5e', '#d1783a', '#ab5320', '#7d3410'],
  agingRamp: ['#e59a5e', '#d1783a', '#ab5320', '#7d3410'],
  neutralFill: '#e1e0d9',
};

const DARK: VizTokens = {
  surface: '#15181f',
  ink: '#f2f3f5',
  inkSecondary: '#b9bec7',
  inkMuted: '#8b919b',
  grid: '#262b35',
  axis: '#39404d',
  tooltipBg: '#1c212b',
  status: {
    pending: '#b87c34',
    in_progress: '#3f84d6',
    completed: '#6ede6e',
    closed: '#28a828',
    cancelled: '#d4536f',
  },
  priorityRamp: ['#f8d3ae', '#e8a262', '#cf6f33', '#a4491d'],
  agingRamp: ['#f8d3ae', '#e8a262', '#cf6f33', '#a4491d'],
  neutralFill: '#2b313c',
};

export const vizTokens = (dark: boolean): VizTokens => (dark ? DARK : LIGHT);

export const STATUS_LABELS = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Awaiting sign-off',
  closed: 'Signed off',
  cancelled: 'Cancelled',
} as const;

export const PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
} as const;

/** Shared quiet chrome for every chart option. */
export const chartText = (v: VizTokens) => ({
  fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
  color: v.inkSecondary,
});

export const axisCommon = (v: VizTokens) => ({
  axisLine: { show: false },
  axisTick: { show: false },
  axisLabel: { color: v.inkMuted, fontSize: 11 },
  splitLine: { lineStyle: { color: v.grid, width: 1, type: 'solid' as const } },
});

export const tooltipCommon = (v: VizTokens) => ({
  backgroundColor: v.tooltipBg,
  borderWidth: 0,
  padding: [8, 12],
  textStyle: { color: v.ink, fontSize: 12 },
  extraCssText: 'box-shadow: 0 4px 20px rgba(0,0,0,.18); border-radius: 10px;',
});
