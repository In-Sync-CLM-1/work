import { Suspense, lazy, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useTaskDepartments } from '@/hooks/useTaskDepartments';

// The charting library is ~600KB. Loading it lazily keeps it out of the bundle
// every other page (and the public landing page) has to download.
const TeamTaskAnalytics = lazy(() =>
  import('@/components/analytics/TeamTaskAnalytics').then((m) => ({ default: m.TeamTaskAnalytics })),
);

/**
 * The task dashboard.
 *
 * One analytics view, scoped either to the whole organisation or to a single
 * department. Organisations with no departments configured see only the
 * organisation-wide view and no switcher at all.
 */
export function DashboardPage() {
  const { departments, hasDepartments } = useTaskDepartments();
  const [departmentId, setDepartmentId] = useState<string | null>(null);

  const active = departments.find((d) => d.id === departmentId);
  const label = active ? active.label : hasDepartments ? 'All Teams' : 'Task';

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {hasDepartments && (
        <div className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-card p-0.5 mb-4">
          <TeamTab label="All Teams" active={departmentId === null} onClick={() => setDepartmentId(null)} />
          {departments.map((d) => (
            <TeamTab
              key={d.id}
              label={d.label}
              active={departmentId === d.id}
              onClick={() => setDepartmentId(d.id)}
            />
          ))}
        </div>
      )}

      {/* Remount per team so every chart re-reads from a clean slate. */}
      <Suspense
        fallback={
          <div className="py-16 text-center">
            <Loader2 className="h-7 w-7 animate-spin mx-auto text-muted-foreground" />
          </div>
        }
      >
        <TeamTaskAnalytics key={departmentId ?? 'all'} departmentId={departmentId} teamLabel={label} />
      </Suspense>
    </motion.div>
  );
}

function TeamTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={
        'px-3 py-1.5 text-sm font-medium rounded-md transition-colors ' +
        (active
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted')
      }
    >
      {label}
    </button>
  );
}
