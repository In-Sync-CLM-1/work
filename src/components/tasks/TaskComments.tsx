import { useState } from 'react';
import { Send, MessageSquare, Activity } from 'lucide-react';
import type { TaskComment } from '@/types/task';
import { cn, formatRelativeDate, getInitials } from '@/lib/utils';

interface TaskCommentsProps {
  comments: TaskComment[];
  isLoading: boolean;
  onAddComment: (comment: string) => void;
  isSubmitting: boolean;
}

export function TaskComments({ comments, isLoading, onAddComment, isSubmitting }: TaskCommentsProps) {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    onAddComment(newComment.trim());
    setNewComment('');
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">
        Loading comments...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        Activity & Comments ({comments.length})
      </h3>

      {/* Comments list */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {comments.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No activity yet</p>
        )}
        {comments.map((comment) => {
          const isSystem = comment.comment_type !== 'comment';

          return (
            <div
              key={comment.id}
              className={cn(
                'flex gap-3',
                isSystem && 'opacity-70'
              )}
            >
              {/* Avatar */}
              <div
                className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0',
                  isSystem
                    ? 'bg-muted text-muted-foreground'
                    : 'bg-primary/10 text-primary'
                )}
              >
                {isSystem ? (
                  <Activity className="h-3.5 w-3.5" />
                ) : (
                  comment.user ? getInitials(comment.user.full_name) : '?'
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-medium">
                    {isSystem ? 'System' : comment.user?.full_name || 'Unknown'}
                  </span>
                  <span className="text-muted-foreground">{formatRelativeDate(comment.created_at)}</span>
                  {isSystem && (
                    <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px] uppercase">
                      {comment.comment_type.replace('_', ' ')}
                    </span>
                  )}
                </div>
                <p className={cn(
                  'text-sm mt-0.5 whitespace-pre-wrap break-words',
                  isSystem && 'italic text-muted-foreground'
                )}>
                  {comment.comment}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add comment */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={!newComment.trim() || isSubmitting}
          className="px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
