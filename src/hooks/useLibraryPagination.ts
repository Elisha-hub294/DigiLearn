import { DocumentSnapshot, QueryDocumentSnapshot } from "firebase/firestore";

import { BookRecord, loadBooksPaginated } from "../services/booksService";
import { loadTrendingLessonsPaginated, TrendingLessonRecord } from "../services/trendingLessonsService";
import { listReports, ReportRecord } from "../services/reportService";
import { usePaginated } from "./usePaginated";

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
  return usePaginated<BookRecord>(async (cursor?: DocumentSnapshot) => {
    const result = await loadBooksPaginated(DEFAULT_PAGE_SIZE, cursor);
    return {
      items: result.items,
      hasMore: result.hasMore,
      nextCursor: result.nextCursor,
    };
  }, DEFAULT_PAGE_SIZE);
}

/**
 * Hook for paginated trending lessons loading
 */
export function useTrendingLessonsPagination(): LibraryPageState<TrendingLessonRecord> {
  return usePaginated<TrendingLessonRecord>(async (cursor?: DocumentSnapshot) => {
    const result = await loadTrendingLessonsPaginated(DEFAULT_PAGE_SIZE, cursor);
    return {
      items: result.items,
      hasMore: result.hasMore,
      nextCursor: result.nextCursor,
    };
  }, DEFAULT_PAGE_SIZE);
}

/**
 * Hook for paginated reports loading (for admin screens)
 */
export function useReportsPagination(pageSize: number = 20): LibraryPageState<ReportRecord> {
  return usePaginated<ReportRecord>(async (cursor?: DocumentSnapshot) => {
    const { reports, hasMore, cursor: nextCursor } = await listReports(cursor as QueryDocumentSnapshot);
    return {
      items: reports,
      hasMore,
      nextCursor,
    };
  }, pageSize);
}
