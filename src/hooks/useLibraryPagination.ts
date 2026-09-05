import { DocumentSnapshot } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { BookRecord, loadBooksPaginated } from "../services/booksService";
import {
  loadTrendingLessonsPaginated,
  TrendingLessonRecord,
} from "../services/trendingLessonsService";

export interface LibraryPageState<T> {
  items: T[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  reset: () => Promise<void>;
  refresh: () => Promise<void>;
}

const DEFAULT_PAGE_SIZE = 20;

/**
 * Hook for paginated book loading with support for multiple views
 */
export function useBooksPagination(): LibraryPageState<BookRecord> {
  const [items, setItems] = useState<BookRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<DocumentSnapshot | undefined>();

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const result = await loadBooksPaginated(DEFAULT_PAGE_SIZE, cursor);
      setItems((prev) => [...prev, ...result.items]);
      setHasMore(result.hasMore);
      setCursor(result.nextCursor);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load books";
      setError(message);
      console.error("Book pagination error:", err);
    } finally {
      setLoading(false);
    }
  }, [cursor, hasMore, loading]);

  const reset = useCallback(async () => {
    setLoading(true);
    setError(null);
    setCursor(undefined);
    setItems([]);

    try {
      const result = await loadBooksPaginated(DEFAULT_PAGE_SIZE);
      setItems(result.items);
      setHasMore(result.hasMore);
      setCursor(result.nextCursor);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load books";
      setError(message);
      console.error("Book pagination error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await reset();
  }, [reset]);

  // Initial load
  useEffect(() => {
    reset();
  }, []);

  return {
    items,
    loading,
    error,
    hasMore,
    loadMore,
    reset,
    refresh,
  };
}

/**
 * Hook for paginated trending lessons loading
 */
export function useTrendingLessonsPagination(): LibraryPageState<TrendingLessonRecord> {
  const [items, setItems] = useState<TrendingLessonRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<DocumentSnapshot | undefined>();

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const result = await loadTrendingLessonsPaginated(
        DEFAULT_PAGE_SIZE,
        cursor,
      );
      setItems((prev) => [...prev, ...result.items]);
      setHasMore(result.hasMore);
      setCursor(result.nextCursor);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load lessons";
      setError(message);
      console.error("Lesson pagination error:", err);
    } finally {
      setLoading(false);
    }
  }, [cursor, hasMore, loading]);

  const reset = useCallback(async () => {
    setLoading(true);
    setError(null);
    setCursor(undefined);
    setItems([]);

    try {
      const result = await loadTrendingLessonsPaginated(DEFAULT_PAGE_SIZE);
      setItems(result.items);
      setHasMore(result.hasMore);
      setCursor(result.nextCursor);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load lessons";
      setError(message);
      console.error("Lesson pagination error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await reset();
  }, [reset]);

  // Initial load
  useEffect(() => {
    reset();
  }, []);

  return {
    items,
    loading,
    error,
    hasMore,
    loadMore,
    reset,
    refresh,
  };
}

/**
 * Hook for paginated reports loading (for admin screens)
 */
export function useReportsPagination(pageSize: number = 20) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<DocumentSnapshot | undefined>();

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      // TODO: Implement paginated reports query
      // For now, this is a placeholder
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load reports";
      setError(message);
      console.error("Reports pagination error:", err);
    } finally {
      setLoading(false);
    }
  }, [cursor, hasMore, loading]);

  const reset = useCallback(async () => {
    setLoading(true);
    setError(null);
    setCursor(undefined);
    setItems([]);

    try {
      // TODO: Implement paginated reports query
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load reports";
      setError(message);
      console.error("Reports pagination error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await reset();
  }, [reset]);

  // Initial load
  useEffect(() => {
    reset();
  }, []);

  return {
    items,
    loading,
    error,
    hasMore,
    loadMore,
    reset,
    refresh,
  };
}
