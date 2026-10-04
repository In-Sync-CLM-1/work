import { useEffect, useRef, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import type { ProjectRef } from '@/types/task';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

interface ProjectPickerProps {
  value: string | null;
  onChange: (projectId: string | null) => void;
  disabled?: boolean;
}

function label(p: ProjectRef): string {
  return p.project_number ? `${p.project_number} — ${p.project_name}` : p.project_name;
}

/**
 * Searchable project picker. An org has more projects than one read can return
 * (the API caps a read at 1,000), so nothing is loaded up front: once the user
 * types, the matches (number or name, up to 20) are fetched from the server.
 */
export function ProjectPicker({ value, onChange, disabled }: ProjectPickerProps) {
  const { orgId } = useAuth();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [term, setTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setTerm(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  const { data: matches = [], isFetching } = useQuery<ProjectRef[]>({
    queryKey: ['project-search', orgId, term],
    enabled: !!orgId && open && term.length > 0,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const safe = term.replace(/[,()*%\\"]/g, ' ').trim();
      const { data, error } = await supabase
        .from('projects')
        .select('id, org_id, project_number, project_name, status')
        .eq('org_id', orgId!)
        .or(`project_number.ilike.*${safe}*,project_name.ilike.*${safe}*`)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as ProjectRef[];
    },
  });

  // The chosen project's label, fetched by id so it shows without a search.
  const { data: selected = null } = useQuery<ProjectRef | null>({
    queryKey: ['project-by-id', value],
    enabled: !!value,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, org_id, project_number, project_name, status')
        .eq('id', value!)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as ProjectRef | null;
    },
  });

  const shown = term ? matches : [];

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

            {shown.map((p) => (
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

            {shown.length === 0 && (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                {!term ? 'Type a project name or number to search.' : isFetching ? 'Searching…' : 'No project found.'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
