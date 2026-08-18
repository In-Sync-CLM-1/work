import { useState } from 'react';
import { X, Lock, Star } from 'lucide-react';
import type { Task } from '@/types/task';

interface CloseTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task;
  onSubmit: (reason: string) => void;
  isSubmitting: boolean;
}

export function CloseTaskDialog({
  open,
  onOpenChange,
  task,
  onSubmit,
  isSubmitting,
}: CloseTaskDialogProps) {
  const [reason, setReason] = useState('');
  const [rating, setRating] = useState(0);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullReason = rating > 0 ? `${reason}\n\nSatisfaction: ${rating}/5 stars` : reason;
    onSubmit(fullReason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="relative bg-background rounded-lg shadow-lg w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Close Task</h2>
          <button onClick={() => onOpenChange(false)} className="p-1 rounded-md hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mx-6 mt-4 p-3 rounded-md bg-primary/5 border border-primary/20 flex items-center gap-2 text-sm text-primary">
          <Lock className="h-4 w-4" />
          Closing <strong>{task.task_name}</strong> — this verifies the work is complete and signed off
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium">Closure Notes *</label>
            <textarea
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              placeholder="Verification notes, sign-off comments..."
            />
          </div>

          {/* Star Rating */}
          <div>
            <label className="text-sm font-medium">Satisfaction Rating (optional)</label>
            <div className="flex gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star === rating ? 0 : star)}
                  className="p-1"
                >
                  <Star
                    className={`h-6 w-6 transition-colors ${
                      star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
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
              {isSubmitting ? 'Closing...' : 'Close Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
