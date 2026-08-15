import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { BarChart, LineChart, HeatmapChart, PieChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  VisualMapComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsCoreOption } from 'echarts/core';

echarts.use([
  BarChart,
  LineChart,
  HeatmapChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  VisualMapComponent,
  CanvasRenderer,
]);

interface EChartProps {
  option: EChartsCoreOption;
  height: number;
  className?: string;
  /** Announced to screen readers in place of the canvas. */
  ariaLabel?: string;
}

/** Thin ECharts wrapper: init once, replace option on change, resize with container. */
export function EChart({ option, height, className, ariaLabel }: EChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current);
    chartRef.current = chart;
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(ref.current);
    return () => {
      ro.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setOption(option, { notMerge: true });
  }, [option]);

  return (
    <div
      ref={ref}
      className={className}
      style={{ height, width: '100%' }}
      role="img"
      aria-label={ariaLabel}
    />
  );
}
