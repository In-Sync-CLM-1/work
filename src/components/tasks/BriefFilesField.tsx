import { useRef, useState } from 'react';
import { Loader2, Paperclip, X } from 'lucide-react';
import type { BriefFile } from '@/types/task';
import { uploadToR2 } from '@/lib/r2Storage';
import { toast } from 'sonner';

interface BriefFilesFieldProps {
  value: BriefFile[];
  onChange: (files: BriefFile[]) => void;
}

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * The brief handed over with the task. Files go to R2 as they are picked, so
 * the task row only ever stores the resulting keys.
 */
export function BriefFilesField({ value, onChange }: BriefFilesFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    try {
      const uploaded: BriefFile[] = [];
      for (const file of Array.from(fileList)) {
        const { key } = await uploadToR2(
          'task-briefs',
          `briefs/${Date.now()}_${file.name}`,
          file,
        );
        uploaded.push({
          path: key,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
        });
      }
      onChange([...value, ...uploaded]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to attach brief');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <label className="text-sm font-medium">Brief</label>

      {value.length > 0 && (
        <ul className="mt-1 space-y-1">
          {value.map((f) => (
            <li
              key={f.path}
              className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border border-input bg-muted/40"
            >
              <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{f.name}</span>
              <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                {humanSize(f.size)}
              </span>
              <button
                type="button"
                onClick={() => onChange(value.filter((v) => v.path !== f.path))}
                className="shrink-0 p-0.5 rounded hover:bg-muted"
                aria-label={`Remove ${f.name}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="mt-1 flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-input hover:bg-muted disabled:opacity-50"
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
        {uploading ? 'Uploading…' : 'Attach brief files'}
      </button>
    </div>
  );
}
