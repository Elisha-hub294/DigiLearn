import { DocumentSnapshot, Query } from "firebase/firestore";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildPaginationQuery,
  CursorPaginationOptions,
  processPaginationResults,
} from "../utils/paginationUtils";

interface UsePaginationOptions<T> extends Omit<
  CursorPaginationOptions,
  "cursor"
> {
  /**
   * Function to fetch data from Firestore
   * Should accept a Query and return promise of DocumentSnapshot[]
   */
  fetcher: (query: Query) => Promise<DocumentSnapshot[]>;
  /** Function to map DocumentSnapshot to your data type */
  mapper: (doc: DocumentSnapshot) => T;
  /** Initial load on mount */
  autoLoad?: boolean;
}

interface UsePaginationState<T> {
  items: T[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  nextCursor?: DocumentSnapshot;
  prevCursor?: DocumentSnapshot;
}

/**
 * Custom hook for cursor-based pagination in React components
 * Handles loading states and cursor management automatically
 */
export function usePagination<T>(
  collectionOrQuery: any,
  options: UsePaginationOptions<T>,
): UsePaginationState<T> & {
  loadNext: () => Promise<void>;
  loadPrevious: () => Promise<void>;
  reset: () => Promise<void>;
  refresh: () => Promise<void>;
} {
  const {
    pageSize,
    orderByField,
    orderDirection = "asc",
    constraints = [],
    fetcher,
    mapper,
    autoLoad = true,
  } = options;

  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<DocumentSnapshot | undefined>(
    undefined,
  );
  const [prevCursor, setPrevCursor] = useState<DocumentSnapshot | undefined>(
    undefined,
  );

  const cursorRef = useRef<DocumentSnapshot | undefined>(undefined);
  const prevCursorRef = useRef<DocumentSnapshot | undefined>(undefined);

  const loadPage = useCallback(
    async (cursor?: DocumentSnapshot, reverse = false) => {
      setLoading(true);
      setError(null);

      try {
        const paginationQuery = buildPaginationQuery(collectionOrQuery, {
          orderByField,
          orderDirection,
          pageSize,
          constraints,
          cursor,
          reverse,
        });

        const docs = await fetcher(paginationQuery);
        const result = processPaginationResults(docs, pageSize, mapper);

        setItems(result.items);
        setHasMore(result.hasMore);
        setNextCursor(result.nextCursor);
        setPrevCursor(result.prevCursor);
        cursorRef.current = result.nextCursor;
        prevCursorRef.current = result.prevCursor;

        return result;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load items";
        setError(message);
        console.error("Pagination error:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [
      collectionOrQuery,
      orderByField,
      orderDirection,
      pageSize,
      constraints,
      fetcher,
      mapper,
    ],
  );

  const loadNext = useCallback(async () => {
    if (!hasMore || loading) return;
    await loadPage(cursorRef.current);
  }, [hasMore, loading, loadPage]);

  const loadPrevious = useCallback(async () => {
    if (!prevCursorRef.current || loading) return;
    await loadPage(prevCursorRef.current, true);
  }, [loading, loadPage]);

  const reset = useCallback(async () => {
    cursorRef.current = undefined;
    prevCursorRef.current = undefined;
    setNextCursor(undefined);
    setPrevCursor(undefined);
    await loadPage();
  }, [loadPage]);

  const refresh = useCallback(async () => {
    cursorRef.current = undefined;
    prevCursorRef.current = undefined;
    setNextCursor(undefined);
    setPrevCursor(undefined);
    await loadPage();
  }, [loadPage]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      queueMicrotask(() => void loadPage());
    }
  }, [autoLoad, loadPage]);

  return {
    items,
    loading,
    error,
    hasMore,
    nextCursor,
    prevCursor,
    loadNext,
    loadPrevious,
    reset,
    refresh,
  };
}

/**
 * Hook for offset-based pagination (simpler but less efficient)
 */
interface UseOffsetPaginationOptions<T> {
  fetcher: (query: Query, offset: number, limit: number) => Promise<T[]>;
  pageSize: number;
  autoLoad?: boolean;
}

export function useOffsetPagination<T>(
  options: UseOffsetPaginationOptions<T>,
): UsePaginationState<T> & {
  currentPage: number;
  goToPage: (pageNumber: number) => Promise<void>;
  nextPage: () => Promise<void>;
  prevPage: () => Promise<void>;
  reset: () => Promise<void>;
} {
  const { fetcher, pageSize, autoLoad = true } = options;

  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const loadPage = useCallback(
    async (pageNumber: number) => {
      setLoading(true);
      setError(null);

      try {
        const offset = pageNumber * pageSize;
        const items = await fetcher(null as any, offset, pageSize + 1);

        const hasMore = items.length > pageSize;
        setItems(hasMore ? items.slice(0, pageSize) : items);
        setHasMore(hasMore);
        setCurrentPage(pageNumber);

        return items;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load items";
        setError(message);
        console.error("Pagination error:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [pageSize, fetcher],
  );

  const goToPage = useCallback(
    async (pageNumber: number) => {
      if (pageNumber < 0) return;
      await loadPage(pageNumber);
    },
    [loadPage],
  );

  const nextPage = useCallback(async () => {
    if (!hasMore || loading) return;
    await loadPage(currentPage + 1);
  }, [hasMore, loading, currentPage, loadPage]);

  const prevPage = useCallback(async () => {
    if (currentPage === 0 || loading) return;
    await loadPage(currentPage - 1);
  }, [currentPage, loading, loadPage]);

  const reset = useCallback(async () => {
    await loadPage(0);
  }, [loadPage]);

  useState(() => {
    if (autoLoad) {
      loadPage(0);
    }
  });

  return {
    items,
    loading,
    error,
    hasMore,
    currentPage,
    goToPage,
    nextPage,
    prevPage,
    reset,
  };
}
