import { FileIcon, Download, Eye, Paperclip } from 'lucide-react';
import type { BriefFile } from '@/types/task';
import { formatFileSize } from '@/lib/utils';

interface TaskBriefFilesProps {
  files: BriefFile[];
  onPreview: (file: BriefFile) => void;
  onDownload: (filePath: string, fileName: string) => void;
}

/**
 * The files handed over with the task at assignment time (set via
 * BriefFilesField in the create/edit dialog). Read-only here — editing
 * happens through the task form, not the detail page.
 */
export function TaskBriefFiles({ files, onPreview, onDownload }: TaskBriefFilesProps) {
  if (files.length === 0) return null;

  return (
    <div className="rounded-lg border bg-card p-6 mb-6">
      <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
        <Paperclip className="h-4 w-4" />
        Brief ({files.length})
      </h3>
      <div className="space-y-2">
        {files.map((f) => (
          <div
            key={f.path}
            className="flex items-center gap-3 p-2.5 rounded-md border bg-card text-sm"
          >
            <FileIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <button
              type="button"
              onClick={() => onPreview(f)}
              className="flex-1 min-w-0 text-left group"
              title="Preview"
            >
              <p className="font-medium truncate group-hover:text-primary group-hover:underline">
                {f.name}
              </p>
              <p className="text-xs text-muted-foreground">{formatFileSize(f.size)}</p>
            </button>
            <button
              onClick={() => onPreview(f)}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"
              title="Preview"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDownload(f.path, f.name)}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"
              title="Download"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
