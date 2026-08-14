import { useState } from 'react';
import { X, GitBranch } from 'lucide-react';
import type { Task, CreateTaskInput, TaskPriority, Profile } from '@/types/task';

interface SubtaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentTask: Task;
  profiles: Profile[];
  onSubmit: (data: CreateTaskInput) => void;
  isSubmitting: boolean;
}

export function SubtaskDialog({
  open,
  onOpenChange,
  parentTask,
  profiles,
  onSubmit,
  isSubmitting,
}: SubtaskDialogProps) {
  const [formData, setFormData] = useState({
    task_name: '',
    description: '',
    assigned_to: parentTask.assigned_to,
    due_date: parentTask.due_date,
    start_date: '',
    priority: parentTask.priority as TaskPriority,
    estimated_hours: '',
  });

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      task_name: formData.task_name,
      description: formData.description || undefined,
      assigned_to: formData.assigned_to,
      due_date: formData.due_date,
      start_date: formData.start_date || undefined,
      priority: formData.priority,
      parent_task_id: parentTask.id,
      estimated_hours: formData.estimated_hours ? Number(formData.estimated_hours) : undefined,
      // Department, sub-category and project are already settled by the parent
      // task, so the form doesn't ask again — it carries them through silently.
      department_id: parentTask.department_id,
      subcategory: parentTask.subcategory,
      project_id: parentTask.project_id,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="relative bg-background rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Add Subtask</h2>
          <button onClick={() => onOpenChange(false)} className="p-1 rounded-md hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Parent info banner */}
        <div className="mx-6 mt-4 p-3 rounded-md bg-indigo-50 border border-indigo-200 flex items-center gap-2 text-sm text-indigo-700">
          <GitBranch className="h-4 w-4" />
          <span>Subtask of: <strong>{parentTask.task_name}</strong> ({parentTask.task_number})</span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium">Subtask Name *</label>
            <input
              type="text"
              required
              value={formData.task_name}
              onChange={(e) => setFormData((p) => ({ ...p, task_name: e.target.value }))}
              className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              rows={3}
              className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Assign To *</label>
            <select
              required
              value={formData.assigned_to}
              onChange={(e) => setFormData((p) => ({ ...p, assigned_to: e.target.value }))}
              className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select assignee</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>{p.full_name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Due Date *</label>
              <input
                type="date"
                required
                value={formData.due_date}
                onChange={(e) => setFormData((p) => ({ ...p, due_date: e.target.value }))}
                className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Start Date</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData((p) => ({ ...p, start_date: e.target.value }))}
                className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData((p) => ({ ...p, priority: e.target.value as TaskPriority }))}
              className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Estimated Hours</label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={formData.estimated_hours}
              onChange={(e) => setFormData((p) => ({ ...p, estimated_hours: e.target.value }))}
              className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm font-medium rounded-md border border-input hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Subtask'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
