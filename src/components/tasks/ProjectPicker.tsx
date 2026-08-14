import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import type { ProjectRef } from '@/types/task';

interface ProjectPickerProps {
  value: string | null;
  onChange: (projectId: string | null) => void;
  projects: ProjectRef[];
  disabled?: boolean;
}

function label(p: ProjectRef): string {
  return p.project_number ? `${p.project_number} — ${p.project_name}` : p.project_name;
}

/**
 * Searchable project picker. An org can have hundreds of projects, so a plain
 * dropdown is unusable — this filters as you type on both number and name.
 */
export function ProjectPicker({ value, onChange, projects, disabled }: ProjectPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = projects.find((p) => p.id === value) || null;

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? projects.filter((p) => label(p).toLowerCase().includes(q))
      : projects;
    // Long lists are a scroll hazard; the search box is the way through.
    return list.slice(0, 50);
  }, [projects, query]);

  // Close when clicking outside.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const pick = (id: string | null) => {
    onChange(id);
    setOpen(false);
    setQuery('');
  };

  return (
    <div className="relative mt-1" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={
          'w-full flex items-center justify-between gap-2 px-3 py-2 text-sm rounded-md border border-input bg-background text-left focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 ' +
          (selected ? '' : 'text-muted-foreground')
        }
      >
        <span className="truncate">{selected ? label(selected) : 'No project'}</span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-input bg-background shadow-lg">
          <div className="flex items-center gap-2 border-b px-3 py-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search project…"
              className="w-full bg-transparent text-sm focus:outline-none"
            />
          </div>

          <div className="max-h-60 overflow-y-auto py-1">
            <button
              type="button"
              onClick={() => pick(null)}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-muted"
            >
              <Check className={'h-4 w-4 shrink-0 ' + (!value ? 'opacity-100' : 'opacity-0')} />
              No project
            </button>

            {matches.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => pick(p.id)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-muted"
              >
                <Check className={'h-4 w-4 shrink-0 ' + (value === p.id ? 'opacity-100' : 'opacity-0')} />
                <span className="truncate">{label(p)}</span>
              </button>
            ))}

            {matches.length === 0 && (
              <p className="px-3 py-2 text-sm text-muted-foreground">No project found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
