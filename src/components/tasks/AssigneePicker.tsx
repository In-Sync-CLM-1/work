import { useEffect, useRef, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

interface AssigneePickerProps {
  value: string;
  /** Name to show for `value` before/without a search (e.g. the task's current assignee). */
  valueName?: string | null;
  onChange: (id: string, name: string) => void;
  className?: string;
  placeholder?: string;
}

interface Option {
  id: string;
  full_name: string;
  email: string;
}

/**
 * Assignee dropdown that searches the organisation's people on the server as
 * the user types, instead of loading everyone up front — so no one can be cut
 * off by a row limit, whatever the organisation's size.
 */
export function AssigneePicker({ value, valueName, onChange, className, placeholder }: AssigneePickerProps) {
  const { orgId } = useAuth();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [term, setTerm] = useState('');
  const [pickedName, setPickedName] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setTerm(text.trim()), 250);
    return () => clearTimeout(t);
  }, [text]);

  useEffect(() => {
    if (!value) setPickedName(null);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const { data: options = [], isFetching } = useQuery<Option[]>({
    queryKey: ['assignee-search', orgId, term],
    enabled: open,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let q = supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('is_active', true)
        .order('full_name', { ascending: true })
        .limit(30);
      if (orgId) q = q.eq('org_id', orgId);
      if (term) {
        const safe = term.replace(/[,()*%\\"]/g, ' ').trim();
        if (safe) q = q.or(`full_name.ilike.*${safe}*,email.ilike.*${safe}*`);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Option[];
    },
  });

  const label = value ? pickedName ?? valueName ?? options.find((o) => o.id === value)?.full_name ?? '' : '';

  return (
    <div ref={wrapRef} className="relative">
      {/* Keeps native "required" validation working for the chosen person. */}
      <input tabIndex={-1} required value={value} onChange={() => {}} className="absolute inset-0 opacity-0 pointer-events-none" aria-hidden />
      <input
        type="text"
        value={open ? text : label}
        placeholder={placeholder ?? 'Search team member'}
        onFocus={() => {
          setText('');
          setOpen(true);
        }}
        onChange={(e) => {
          setText(e.target.value);
          setOpen(true);
        }}
        className={className}
        autoComplete="off"
      />
      {open && (
        <ul className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-md border border-input bg-background shadow-md">
          {options.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">{isFetching ? 'Searching…' : 'No matching person'}</li>
          ) : (
            options.map((o) => (
              <li
                key={o.id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setPickedName(o.full_name);
                  onChange(o.id, o.full_name);
                  setOpen(false);
                }}
                className={`cursor-pointer px-3 py-2 text-sm hover:bg-muted ${o.id === value ? 'font-medium' : ''}`}
              >
                {o.full_name}
                <span className="ml-2 text-xs text-muted-foreground">{o.email}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
