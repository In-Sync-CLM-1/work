import { useState } from 'react';
import { Calendar as CalendarIcon, Check, ChevronDown } from 'lucide-react';
import { subDays, startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export interface AnalyticsRange {
  from: Date | null; // null = all time
  to: Date | null;
  label: string;
}

/** Indian financial year: 1 April – today. */
function fyStart(now: Date): Date {
  const y = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return new Date(y, 3, 1);
}

export function defaultAnalyticsRange(): AnalyticsRange {
  const now = new Date();
  return { from: subDays(now, 179), to: now, label: 'Last 6 months' };
}

const now = () => new Date();

const PRESETS: { label: string; make: () => AnalyticsRange }[] = [
  { label: 'Last 30 days', make: () => ({ from: subDays(now(), 29), to: now(), label: 'Last 30 days' }) },
  { label: 'Last 90 days', make: () => ({ from: subDays(now(), 89), to: now(), label: 'Last 90 days' }) },
  { label: 'Last 6 months', make: () => ({ from: subDays(now(), 179), to: now(), label: 'Last 6 months' }) },
  { label: 'This month', make: () => ({ from: startOfMonth(now()), to: now(), label: 'This month' }) },
  {
    label: 'Last month',
    make: () => {
      const lm = subMonths(now(), 1);
      return { from: startOfMonth(lm), to: endOfMonth(lm), label: 'Last month' };
    },
  },
  { label: 'This financial year', make: () => ({ from: fyStart(now()), to: now(), label: 'This financial year' }) },
  { label: 'All time', make: () => ({ from: null, to: null, label: 'All time' }) },
];

interface Props {
  value: AnalyticsRange;
  onChange: (r: AnalyticsRange) => void;
}

/**
 * One filter, sitting above the charts, that every figure on the page obeys.
 * Presets cover the common questions; the custom pair is there for the rest.
 */
export function AnalyticsDateFilter({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const applyCustom = () => {
    if (!customFrom || !customTo) return;
    const from = new Date(customFrom);
    const to = new Date(customTo);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) return;
    onChange({ from, to, label: `${format(from, 'd MMM yy')} – ${format(to, 'd MMM yy')}` });
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-input bg-background hover:bg-muted"
      >
        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{value.label}</span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>

      {open && (
        <>
          {/* Click-away layer */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-1 w-64 rounded-md border border-input bg-background shadow-lg p-1">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  onChange(p.make());
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left rounded hover:bg-muted"
              >
                <Check className={'h-4 w-4 shrink-0 ' + (value.label === p.label ? 'opacity-100' : 'opacity-0')} />
                {p.label}
              </button>
            ))}

            <div className="border-t mt-1 pt-2 px-2 pb-1 space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Custom range</p>
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-full px-2 py-1 text-xs rounded border border-input bg-background"
                  aria-label="From date"
                />
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="w-full px-2 py-1 text-xs rounded border border-input bg-background"
                  aria-label="To date"
                />
              </div>
              <button
                type="button"
                onClick={applyCustom}
                disabled={!customFrom || !customTo}
                className="w-full px-2 py-1 text-xs font-medium rounded bg-primary text-primary-foreground disabled:opacity-40"
              >
                Apply
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
