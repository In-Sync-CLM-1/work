interface StatTileProps {
  label: string;
  value: string;
  sub?: string;
  /** Draws attention when the number is the problem (e.g. overdue > 0). */
  tone?: 'default' | 'alert';
}

/**
 * A single headline number. No plot — one number is not a chart, and a tile
 * reads faster than any mark could.
 */
export function StatTile({ label, value, sub, tone = 'default' }: StatTileProps) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs font-medium text-muted-foreground truncate">{label}</p>
      <p
        className={
          'mt-0.5 text-2xl font-bold tabular-nums ' +
          (tone === 'alert' ? 'text-[#8a2f2f] dark:text-[#d4536f]' : 'text-foreground')
        }
      >
        {value}
      </p>
      {sub && <p className="text-[11px] text-muted-foreground truncate">{sub}</p>}
    </div>
  );
}
