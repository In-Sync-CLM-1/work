import { useState } from 'react';
import { useLocation, useMatch } from 'react-router-dom';
import { Plus } from 'lucide-react';
import type { CreateTaskInput, UpdateTaskInput } from '@/types/task';
import { useAuth } from '@/lib/auth-context';
import { useTasks } from '@/hooks/useTasks';
import { useProfiles } from '@/hooks/useProfiles';
import { useTaskDepartments } from '@/hooks/useTaskDepartments';
import { TaskDialog } from './TaskDialog';

/**
 * The single, global way to create a task from anywhere in the app. Defaults
 * the department to whichever department list you are currently on; the
 * dialog's own Department field can always override it.
 */
export function CreateTaskFAB() {
  const location = useLocation();
  const departmentRoute = useMatch('/tasks/d/:key');
  const { user, isAdmin, orgId } = useAuth();
  const { profiles } = useProfiles();
  const { byKey, hasDepartments } = useTaskDepartments();
  const { createTask } = useTasks({ page: 1, items_per_page: 1 });
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Signed out, no org, or on a public page: nothing to create against.
  const onPublicPage = ['/', '/auth', '/register', '/demo'].includes(location.pathname);
  if (!user || !orgId || onPublicPage) return null;

  const defaultDepartmentId =
    (departmentRoute?.params.key && byKey(departmentRoute.params.key)?.id) || null;

  const handleSubmit = async (data: CreateTaskInput | UpdateTaskInput) => {
    setIsSubmitting(true);
    try {
      await createTask.mutateAsync(data as CreateTaskInput);
      setOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Sits a widget's height above the bottom-right corner: the In-Sync help
          widget is fixed there at z-index 99999 and would otherwise cover this
          button completely — invisible and unclickable. Same offset RMPL uses. */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Create new task"
        title="Create task"
        className="fixed bottom-24 right-6 z-40 h-14 w-14 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-transform hover:scale-105"
      >
        <Plus className="h-6 w-6" />
      </button>

      {open && (
        <TaskDialog
          open={open}
          onOpenChange={setOpen}
          profiles={profiles}
          currentUserId={user.id}
          isAdmin={isAdmin}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          defaultDepartmentId={hasDepartments ? defaultDepartmentId : null}
        />
      )}
    </>
  );
}
