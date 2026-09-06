import { useState, useCallback, useEffect } from 'react';
import type { DocumentSnapshot } from 'firebase/firestore';

/**
 * Generic pagination hook.
 *
 * @param loader Function that fetches a page of data. It receives an optional cursor
 *               (a DocumentSnapshot) and should return an object containing:
 *               - items: array of results for the current page
 *               - hasMore: boolean indicating if more pages are available
 *               - nextCursor?: DocumentSnapshot for the next page
 * @param pageSize Number of items per page. Defaults to DEFAULT_PAGE_SIZE.
 */
export function usePaginated<T>(
  loader: (cursor?: DocumentSnapshot) => Promise<{
    items: T[];
    hasMore: boolean;
    nextCursor?: DocumentSnapshot;
  }>,
  pageSize: number = 20,
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<DocumentSnapshot | undefined>(undefined);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    setError(null);
    try {
      const result = await loader(cursor);
      setItems(prev => [...prev, ...result.items]);
      setHasMore(result.hasMore);
      setCursor(result.nextCursor);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load items';
      setError(message);
      console.error('Pagination error:', err);
    } finally {
      setLoading(false);
    }
  }, [cursor, hasMore, loading, loader]);

  const reset = useCallback(async () => {
    setLoading(true);
    setError(null);
    setCursor(undefined);
    setItems([]);
    try {
      const result = await loader();
      setItems(result.items);
      setHasMore(result.hasMore);
      setCursor(result.nextCursor);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load items';
      setError(message);
      console.error('Pagination reset error:', err);
    } finally {
      setLoading(false);
    }
  }, [loader]);

  const refresh = useCallback(async () => {
    await reset();
  }, [reset]);

  // Initial load
  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { items, loading, error, hasMore, loadMore, reset, refresh } as const;
}
