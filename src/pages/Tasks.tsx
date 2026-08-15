import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, BarChart3, AlertTriangle, Clock, CheckCircle, List, Columns3, GanttChartSquare } from 'lucide-react';
import type { Task, TaskStatus, TaskFilters as TaskFiltersType, CreateTaskInput, UpdateTaskInput } from '@/types/task';
import { useAuth } from '@/lib/auth-context';
import { useTasks } from '@/hooks/useTasks';
import { useTaskDepartments } from '@/hooks/useTaskDepartments';
import { useStickyState } from '@/hooks/useStickyState';
import { useTaskBoard } from '@/hooks/useTaskBoard';
import { TaskBoard } from '@/components/tasks/TaskBoard';
import { TaskTimeline } from '@/components/tasks/TaskTimeline';
import { useProfiles } from '@/hooks/useProfiles';
import { useTaskStats } from '@/hooks/useTaskStats';
import { useStartTask } from '@/hooks/useStartTask';
import { useCompleteTask } from '@/hooks/useCompleteTask';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskFilters } from '@/components/tasks/TaskFilters';
import { TaskDialog } from '@/components/tasks/TaskDialog';
import { SubtaskDialog } from '@/components/tasks/SubtaskDialog';
import { CompleteTaskDialog } from '@/components/tasks/CompleteTaskDialog';
import { CloseTaskDialog } from '@/components/tasks/CloseTaskDialog';
import { RestartTaskDialog } from '@/components/tasks/RestartTaskDialog';
import { PaginationControls } from '@/components/tasks/PaginationControls';

export function TasksPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAdmin } = useAuth();
  const currentUserId = user?.id || '';

  // /tasks/d/:key renders this same page scoped to one department.
  const { key: departmentKey } = useParams<{ key: string }>();
  const { byKey, isLoading: departmentsLoading } = useTaskDepartments();
  const department = departmentKey ? byKey(departmentKey) : undefined;

  // Filters persist per list, so returning to a department shows it as you left it.
  const stickyKey = `worksync.tasks.${departmentKey ?? 'all'}`;
  const [sticky, setSticky] = useStickyState<Pick<TaskFiltersType, 'status' | 'priority' | 'items_per_page' | 'page'>>(
    stickyKey,
    { status: 'all', priority: 'all', items_per_page: 10, page: 1 },
  );

  const [filters, setFilters] = useState<TaskFiltersType>({
    status: (searchParams.get('status') as TaskFiltersType['status']) || sticky.status || 'all',
    priority: sticky.priority || 'all',
    page: sticky.page || 1,
    items_per_page: sticky.items_per_page || 10,
  });

  // Sync filters when URL status param changes (e.g. sidebar click)
  useEffect(() => {
    const urlStatus = (searchParams.get('status') as TaskFiltersType['status']) || 'all';
    setFilters((prev) => ({ ...prev, status: urlStatus, page: 1 }));
  }, [searchParams]);

  // Re-scope when moving between department lists.
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      department_id: department?.id,
      scope: department?.visibility,
      status: sticky.status || 'all',
      priority: sticky.priority || 'all',
      items_per_page: sticky.items_per_page || 10,
      page: sticky.page || 1,
    }));
    // Only re-run when the list itself changes, not on every sticky write.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [department?.id, department?.visibility]);

  const view = (searchParams.get('view') as 'list' | 'board' | 'timeline') || 'list';
  const setView = (v: 'list' | 'board' | 'timeline') => {
    const next = new URLSearchParams(searchParams);
    if (v === 'list') next.delete('view'); else next.set('view', v);
    setSearchParams(next, { replace: true });
  };

  const { tasks, totalCount, isLoading, createTask, updateTask } = useTasks(filters);
  const board = useTaskBoard({ priority: filters.priority, assigned_to: filters.assigned_to, search: filters.search });
  const { profiles } = useProfiles();
  const { stats } = useTaskStats();
  const startTask = useStartTask();
  const completeTask = useCompleteTask();

  // Dialog state
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [subtaskParent, setSubtaskParent] = useState<Task | null>(null);
  const [completingTask, setCompletingTask] = useState<Task | null>(null);
  const [closingTask, setClosingTask] = useState<Task | null>(null);
  const [restartingTask, setRestartingTask] = useState<Task | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalPages = Math.ceil((totalCount || 0) / filters.items_per_page);

  const handleFiltersChange = (changes: Partial<TaskFiltersType>) => {
    setFilters((prev) => {
      const next = { ...prev, ...changes };
      setSticky({
        status: next.status,
        priority: next.priority,
        items_per_page: next.items_per_page,
        page: next.page,
      });
      return next;
    });
    if ('status' in changes) {
      const s = changes.status;
      setSearchParams(s && s !== 'all' ? { status: s } : {}, { replace: true });
    }
  };

  const handleCreateTask = async (data: CreateTaskInput | UpdateTaskInput) => {
    setIsSubmitting(true);
    try {
      if (editingTask) {
        await updateTask.mutateAsync({ id: editingTask.id, ...data });
      } else {
        await createTask.mutateAsync(data as CreateTaskInput);
      }
      setTaskDialogOpen(false);
      setEditingTask(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateSubtask = async (data: CreateTaskInput) => {
    setIsSubmitting(true);
    try {
      await createTask.mutateAsync(data);
      setSubtaskParent(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartTask = (task: Task) => {
    startTask.mutate({ taskId: task.id, files: [] });
  };

  const handleCompleteTask = async (notes: string, files: File[]) => {
    if (!completingTask) return;
    setIsSubmitting(true);
    try {
      await completeTask.mutateAsync({ taskId: completingTask.id, notes, files });
      setCompletingTask(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseTask = async (_reason: string) => {
    if (!closingTask) return;
    setIsSubmitting(true);
    try {
      await updateTask.mutateAsync({
        id: closingTask.id,
        status: 'closed',
      });
      setClosingTask(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestartTask = async (_reason: string) => {
    if (!restartingTask) return;
    setIsSubmitting(true);
    try {
      await updateTask.mutateAsync({
        id: restartingTask.id,
        status: 'pending',
        completion_notes: undefined,
        completion_percentage: 0,
      });
      setRestartingTask(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelTask = async (task: Task) => {
    if (confirm('Are you sure you want to cancel this task?')) {
      await updateTask.mutateAsync({ id: task.id, status: 'cancelled' });
    }
  };

  // A department list whose department no longer exists (renamed, deactivated,
  // or a stale bookmark) should say so rather than silently show everything.
  if (departmentKey && !departmentsLoading && !department) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground mb-2">That department no longer exists.</p>
        <button onClick={() => navigate('/tasks')} className="text-sm text-primary hover:underline">
          Go to all tasks
        </button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">{department ? `${department.label} Tasks` : 'Tasks'}</h1>
          <p className="text-sm text-muted-foreground">
            {department?.visibility === 'mine'
              ? `${totalCount || 0} tasks assigned to or by you`
              : department
                ? `${totalCount || 0} tasks across ${department.label}`
                : `${totalCount || 0} total tasks`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ViewSwitcher view={view} onChange={setView} />
          <button
            onClick={() => { setEditingTask(null); setTaskDialogOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            New Task
          </button>
        </div>
      </div>

      {/* Board (Kanban) */}
      {view === 'board' && (
        board.isLoading
          ? <div className="text-center py-12 text-muted-foreground">Loading board...</div>
          : <TaskBoard
              tasks={board.tasks}
              milestonesByTask={board.milestonesByTask}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onMove={(id, status: TaskStatus) => board.updateStatus.mutate({ id, status })}
            />
      )}

      {/* Timeline (Gantt) */}
      {view === 'timeline' && (
        board.isLoading
          ? <div className="text-center py-12 text-muted-foreground">Loading timeline...</div>
          : <TaskTimeline tasks={board.tasks} milestonesByTask={board.milestonesByTask} />
      )}

      {/* List */}
      {view === 'list' && (
      <div className="flex gap-6">
      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Filters */}
        <TaskFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          assignees={profiles.map((p) => ({ id: p.id, full_name: p.full_name }))}
        />

        {/* Task List */}
        <div className="mt-4 space-y-2">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-2">No tasks found</p>
              <button
                onClick={() => { setEditingTask(null); setTaskDialogOpen(true); }}
                className="text-sm text-primary hover:underline"
              >
                Create your first task
              </button>
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                onStart={handleStartTask}
                onComplete={setCompletingTask}
                onCancel={handleCancelTask}
                onClose={setClosingTask}
                onRestart={setRestartingTask}
                onEdit={(t) => { setEditingTask(t); setTaskDialogOpen(true); }}
                onAddSubtask={setSubtaskParent}
                onClick={(t) => navigate(`/tasks/${t.id}`)}
              />
            ))
          )}
        </div>

        <PaginationControls
          page={filters.page}
          totalPages={totalPages}
          onPageChange={(page) => handleFiltersChange({ page })}
        />
      </div>

      {/* Stats Sidebar */}
      <div className="hidden lg:block w-72 flex-shrink-0">
        <div className="sticky top-20 space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Quick Stats
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" />
                  My Open Tasks
                </span>
                <span className="font-bold text-lg">{stats?.myOpenTasks ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                  Overdue
                </span>
                <span className="font-bold text-lg text-red-600">{stats?.overdueTasks ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                  Completed This Week
                </span>
                <span className="font-bold text-lg text-green-600">{stats?.completedThisWeek ?? 0}</span>
              </div>
            </div>
          </div>

          {/* Status Distribution */}
          {stats?.statusDistribution && stats.statusDistribution.length > 0 && (
            <div className="rounded-lg border bg-card p-4">
              <h3 className="font-semibold text-sm mb-3">By Status</h3>
              <div className="space-y-2">
                {stats.statusDistribution.map((s) => (
                  <div key={s.name} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground capitalize">{s.name.replace('_', ' ')}</span>
                    <span className="font-medium">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Team Workload */}
          {stats?.teamWorkload && stats.teamWorkload.length > 0 && (
            <div className="rounded-lg border bg-card p-4">
              <h3 className="font-semibold text-sm mb-3">Team Workload</h3>
              <div className="space-y-2">
                {stats.teamWorkload.map((w) => (
                  <div key={w.name} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground truncate">{w.name}</span>
                    <span className="font-medium">{w.tasks}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
      )}

      {/* Dialogs */}
      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={(open) => { setTaskDialogOpen(open); if (!open) setEditingTask(null); }}
        task={editingTask}
        profiles={profiles}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
        onSubmit={handleCreateTask}
        isSubmitting={isSubmitting}
        defaultDepartmentId={department?.id ?? null}
      />

      {subtaskParent && (
        <SubtaskDialog
          open={!!subtaskParent}
          onOpenChange={(open) => { if (!open) setSubtaskParent(null); }}
          parentTask={subtaskParent}
          profiles={profiles}
          onSubmit={handleCreateSubtask}
          isSubmitting={isSubmitting}
        />
      )}

      {completingTask && (
        <CompleteTaskDialog
          open={!!completingTask}
          onOpenChange={(open) => { if (!open) setCompletingTask(null); }}
          task={completingTask}
          onSubmit={handleCompleteTask}
          isSubmitting={isSubmitting}
        />
      )}

      {closingTask && (
        <CloseTaskDialog
          open={!!closingTask}
          onOpenChange={(open) => { if (!open) setClosingTask(null); }}
          task={closingTask}
          onSubmit={handleCloseTask}
          isSubmitting={isSubmitting}
        />
      )}

      {restartingTask && (
        <RestartTaskDialog
          open={!!restartingTask}
          onOpenChange={(open) => { if (!open) setRestartingTask(null); }}
          task={restartingTask}
          onSubmit={handleRestartTask}
          isSubmitting={isSubmitting}
        />
      )}
    </motion.div>
  );
}

function ViewSwitcher({ view, onChange }: { view: 'list' | 'board' | 'timeline'; onChange: (v: 'list' | 'board' | 'timeline') => void }) {
  const tabs: { key: 'list' | 'board' | 'timeline'; label: string; icon: typeof List }[] = [
    { key: 'list', label: 'List', icon: List },
    { key: 'board', label: 'Board', icon: Columns3 },
    { key: 'timeline', label: 'Timeline', icon: GanttChartSquare },
  ];
  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-card p-0.5">
      {tabs.map((t) => {
        const Icon = t.icon;
        const active = view === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={
              'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ' +
              (active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted')
            }
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
