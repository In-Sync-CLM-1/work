// PostgREST caps a single response at 1,000 rows. Anything that aggregates a
// whole table — dashboard counts, platform-wide rollups — silently loses rows
// past that point and reports numbers that look plausible but are wrong.
// Redefine Marcom's 2,000+ task history took Work-Sync past the cap for the
// first time, so any total has to be assembled page by page.
const PAGE_SIZE = 1000;

// Guard against an unbounded loop if a query somehow never exhausts.
const MAX_PAGES = 100;

// Structural, rather than importing PostgrestFilterBuilder: the builder's
// generic signature changes between client versions, and all this needs is
// something that can be given a range and awaited.
interface RangeableQuery {
  range(
    from: number,
    to: number,
  ): PromiseLike<{ data: unknown[] | null; error: { message?: string } | null }>;
}

/**
 * Run a select in pages until the table is exhausted, returning every row.
 *
 * Pass a builder factory rather than a builder: each page needs its own query,
 * and a Supabase query builder can only be awaited once.
 *
 *   const rows = await fetchAllRows<Task>(() =>
 *     supabase.from('tasks').select('id, status'));
 */
export async function fetchAllRows<T>(build: () => RangeableQuery): Promise<T[]> {
  const all: T[] = [];

  for (let page = 0; page < MAX_PAGES; page++) {
    const from = page * PAGE_SIZE;
    const { data, error } = await build().range(from, from + PAGE_SIZE - 1);

    if (error) throw new Error(error.message ?? 'Failed to fetch rows');
    if (!data || data.length === 0) break;

    all.push(...(data as T[]));
    if (data.length < PAGE_SIZE) break;
  }

  return all;
}
