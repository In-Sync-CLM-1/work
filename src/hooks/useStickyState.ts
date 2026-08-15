import { useCallback, useEffect, useState } from 'react';

/**
 * State that survives navigation and reloads, kept in localStorage under a
 * caller-supplied key.
 *
 * Task lists use this so filters and the page you were on are still there when
 * you come back — people work a filtered list all day and re-applying it every
 * time is the kind of small friction that makes a migration feel like a
 * downgrade.
 */
export function useStickyState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? initial : (JSON.parse(raw) as T);
    } catch {
      return initial;
    }
  });

  // Switching to a different key (e.g. another department's list) has to pull
  // that key's stored value rather than keep showing the previous one.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      setValue(raw === null ? initial : (JSON.parse(raw) as T));
    } catch {
      setValue(initial);
    }
    // `initial` is intentionally not a dependency: it is a default, not state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const set = useCallback(
    (next: T) => {
      setValue(next);
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // Storage full or blocked — the filter still works for this session.
      }
    },
    [key],
  );

  return [value, set] as const;
}
