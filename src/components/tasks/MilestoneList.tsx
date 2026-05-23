import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2, Flag, Edit2, Check, X } from 'lucide-react';
import type { TaskMilestone, Task } from '@/types/task';
import { cn, formatDate } from '@/lib/utils';

interface MilestoneListProps {
  milestones: TaskMilestone[];
  parentTask: Task;
  currentUserId: string;
  isAdmin: boolean;
  onAdd: (input: { title: string; target_date: string }) => Promise<unknown>;
  onUpdate: (id: string, updates: { title?: string; target_date?: string; completed?: boolean }) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
}

function isOverdue(m: TaskMilestone): boolean {
  if (m.completed) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(m.target_date);
  target.setHours(0, 0, 0, 0);
  return target < today;
}

export function MilestoneList({
  milestones,
  parentTask,
  currentUserId,
  isAdmin,
  onAdd,
  onUpdate,
  onDelete,
}: MilestoneListProps) {
  const [expanded, setExpanded] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDate, setDraftDate] = useState('');

  const isTaskTerminal =
    parentTask.status === 'completed' ||
    parentTask.status === 'closed' ||
    parentTask.status === 'cancelled';

  const canManage =
    !isTaskTerminal &&
    (isAdmin ||
      currentUserId === parentTask.assigned_to ||
      currentUserId === parentTask.assigned_by);

  const completedCount = milestones.filter((m) => m.completed).length;

  const resetDraft = () => {
    setDraftTitle('');
    setDraftDate('');
    setAdding(false);
    setEditingId(null);
  };

  const handleAdd = async () => {
    if (!draftTitle.trim() || !draftDate) return;
    await onAdd({ title: draftTitle.trim(), target_date: draftDate });
    resetDraft();
  };

  const handleStartEdit = (m: TaskMilestone) => {
    setEditingId(m.id);
    setDraftTitle(m.title);
    setDraftDate(m.target_date);
    setAdding(false);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !draftTitle.trim() || !draftDate) return;
    await onUpdate(editingId, { title: draftTitle.trim(), target_date: draftDate });
    resetDraft();
  };

  const handleToggleComplete = async (m: TaskMilestone) => {
    if (!canManage) return;
    await onUpdate(m.id, { completed: !m.completed });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setExpanded(!expanded)}
          className="font-semibold text-sm flex items-center gap-2 hover:text-primary"
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <Flag className="h-4 w-4" />
          Milestones ({completedCount}/{milestones.length})
        </button>
        {canManage && !adding && editingId === null && (
          <button
            onClick={() => {
              setAdding(true);
              setDraftTitle('');
              setDraftDate('');
            }}
            className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 flex items-center gap-1"
          >
            <Plus className="h-3 w-3" />
            Add Milestone
          </button>
        )}
      </div>

      {expanded && (
        <div className="space-y-1">
          {milestones.length === 0 && !adding && (
            <p className="text-sm text-muted-foreground text-center py-2">No milestones yet</p>
          )}

          {milestones.map((m) => {
            const overdue = isOverdue(m);
            const isEditing = editingId === m.id;
            return (
              <div
                key={m.id}
                className={cn(
                  'flex items-center gap-3 p-2.5 rounded-md border bg-card',
                  m.completed && 'opacity-70',
                  overdue && !isEditing && 'border-red-300 bg-red-50',
                )}
              >
                <input
                  type="checkbox"
                  checked={m.completed}
                  disabled={!canManage || isEditing}
                  onChange={() => handleToggleComplete(m)}
                  className="h-4 w-4 cursor-pointer accent-primary disabled:cursor-not-allowed"
                />

                {isEditing ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      className="flex-1 text-sm px-2 py-1 rounded border bg-background"
                      placeholder="Milestone title"
                    />
                    <input
                      type="date"
                      value={draftDate}
                      onChange={(e) => setDraftDate(e.target.value)}
                      className="text-sm px-2 py-1 rounded border bg-background"
                    />
                    <button
                      onClick={handleSaveEdit}
                      className="p-1 rounded hover:bg-green-100 text-green-600"
                      title="Save"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={resetDraft}
                      className="p-1 rounded hover:bg-muted text-muted-foreground"
                      title="Cancel"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'text-sm font-medium',
                          m.completed && 'line-through text-muted-foreground',
                        )}
                      >
                        {m.title}
                      </p>
                      <p
                        className={cn(
                          'text-xs mt-0.5',
                          overdue ? 'text-red-600 font-medium' : 'text-muted-foreground',
                        )}
                      >
                        Due {formatDate(m.target_date)}
                        {overdue && ' • Overdue'}
                        {m.completed && m.completed_at && ` • Completed ${formatDate(m.completed_at)}`}
                      </p>
                    </div>
                    {canManage && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStartEdit(m)}
                          className="p-1 rounded hover:bg-muted text-muted-foreground"
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete milestone "${m.title}"?`)) {
                              onDelete(m.id);
                            }
                          }}
                          className="p-1 rounded hover:bg-red-100 text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}

          {adding && (
            <div className="flex items-center gap-2 p-2.5 rounded-md border-2 border-dashed border-primary/30 bg-primary/5">
              <input
                type="text"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder="Milestone title"
                autoFocus
                className="flex-1 text-sm px-2 py-1 rounded border bg-background"
              />
              <input
                type="date"
                value={draftDate}
                onChange={(e) => setDraftDate(e.target.value)}
                className="text-sm px-2 py-1 rounded border bg-background"
              />
              <button
                onClick={handleAdd}
                disabled={!draftTitle.trim() || !draftDate}
                className="p-1 rounded hover:bg-green-100 text-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Save"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={resetDraft}
                className="p-1 rounded hover:bg-muted text-muted-foreground"
                title="Cancel"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
