/**
 * Reusable Pagination Components and Utilities for DigiLearn
 * Copy and paste these into your screens and services
 */

import { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook to handle pagination state transitions
 */
import { useCallback, useState } from "react";

// ============================================================================
// UI COMPONENTS
// ============================================================================

/**
 * Loading skeleton placeholder for list items
 */
export function PaginationSkeleton({
  count = 5,
  height = 100,
}: {
  count?: number;
  height?: number;
}) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={{
            height,
            backgroundColor: "#e0e0e0",
            marginBottom: 10,
            borderRadius: 8,
          }}
        />
      ))}
    </View>
  );
}

/**
 * Loading indicator for pagination
 */
export function PaginationLoader({
  size = "small",
}: {
  size?: "small" | "large";
}) {
  return (
    <View style={styles.loaderContainer}>
      <ActivityIndicator size={size} color="#666" />
    </View>
  );
}

/**
 * Empty state message
 */
export function EmptyState({
  title = "No Items Found",
  message = "Try adjusting your filters or check back later",
  children,
}: {
  title?: string;
  message?: string;
  children?: ReactNode;
}) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
      {children}
    </View>
  );
}

/**
 * Error state message with retry button
 */
export function ErrorState({
  message = "Failed to load items",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorMessage}>{message}</Text>
      {onRetry && (
        <Pressable style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      )}
    </View>
  );
}

/**
 * Load More button for pagination
 */
export function LoadMoreButton({
  onPress,
  loading = false,
  hasMore = true,
  style,
}: {
  onPress: () => void;
  loading?: boolean;
  hasMore?: boolean;
  style?: ViewStyle;
}) {
  if (!hasMore) return null;

  return (
    <Pressable
      style={[
        styles.loadMoreButton,
        style,
        loading && styles.loadMoreButtonDisabled,
      ]}
      onPress={onPress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.loadMoreButtonText}>Load More</Text>
      )}
    </Pressable>
  );
}

export function usePaginationState<T>(initialItems: T[] = []) {
  const [items, setItems] = useState<T[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const addItems = useCallback((newItems: T[]) => {
    setItems((prev) => [...prev, ...newItems]);
  }, []);

  const replaceItems = useCallback((newItems: T[]) => {
    setItems(newItems);
  }, []);

  const reset = useCallback(() => {
    setItems([]);
    setError(null);
    setHasMore(true);
  }, []);

  const setLoadingState = useCallback((isLoading: boolean) => {
    setLoading(isLoading);
  }, []);

  const setErrorState = useCallback((errorMsg: string | null) => {
    setError(errorMsg);
  }, []);

  const setHasMoreState = useCallback((more: boolean) => {
    setHasMore(more);
  }, []);

  return {
    items,
    loading,
    error,
    hasMore,
    addItems,
    replaceItems,
    reset,
    setLoadingState,
    setErrorState,
    setHasMoreState,
  };
}

// ============================================================================
// FILTERING & SORTING
// ============================================================================

/**
 * Apply pagination with filtering
 */
export interface PaginationFilter<T> {
  predicate: (item: T) => boolean;
  label: string;
}

export function filterItems<T>(items: T[], filter: PaginationFilter<T>): T[] {
  return items.filter(filter.predicate);
}

/**
 * Sort items before pagination
 */
export type SortDirection = "asc" | "desc";

export function sortItems<T>(
  items: T[],
  key: keyof T,
  direction: SortDirection = "asc",
): T[] {
  return [...items].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];

    if (aVal < bVal) return direction === "asc" ? -1 : 1;
    if (aVal > bVal) return direction === "asc" ? 1 : -1;
    return 0;
  });
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Process items in batches (useful for batch operations)
 */
export async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize: number = 10,
  onProgress?: (completed: number, total: number) => void,
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
    onProgress?.(results.length, items.length);
  }

  return results;
}

// ============================================================================
// CACHE HELPERS
// ============================================================================

/**
 * Simple pagination cache key generator
 */
export function generateCacheKey(
  collectionName: string,
  filters?: Record<string, any>,
  pageNumber?: number,
): string {
  const filterStr = filters
    ? Object.entries(filters)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}:${v}`)
        .join("|")
    : "";

  const parts = [collectionName, filterStr, pageNumber];
  return parts.filter(Boolean).join("_");
}

/**
 * Cache pagination results
 */
export class PaginationCache<T> {
  private cache = new Map<string, T[]>();
  private maxSize: number;

  constructor(maxSize: number = 50) {
    this.maxSize = maxSize;
  }

  set(key: string, items: T[]): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) this.cache.delete(firstKey);
    }
    this.cache.set(key, items);
  }

  get(key: string): T[] | undefined {
    return this.cache.get(key);
  }

  clear(): void {
    this.cache.clear();
  }

  remove(key: string): void {
    this.cache.delete(key);
  }
}

// ============================================================================
// VALIDATION & HELPERS
// ============================================================================

/**
 * Validate pagination parameters
 */
export function validatePaginationParams(
  pageSize: number,
  pageNumber: number,
): { valid: boolean; error?: string } {
  if (pageSize < 1) {
    return { valid: false, error: "Page size must be at least 1" };
  }
  if (pageSize > 100) {
    return { valid: false, error: "Page size cannot exceed 100" };
  }
  if (pageNumber < 0) {
    return { valid: false, error: "Page number must be non-negative" };
  }
  return { valid: true };
}

/**
 * Check if pagination is complete
 */
export function isPaginationComplete<T>(
  items: T[],
  pageSize: number,
  totalFetched: number,
): boolean {
  return totalFetched < pageSize;
}

/**
 * Calculate pagination metadata
 */
export interface PaginationMeta {
  totalPages: number;
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export function calculatePaginationMeta(
  currentPage: number,
  pageSize: number,
  hasMore: boolean,
  totalItems: number,
): PaginationMeta {
  return {
    totalPages: Math.ceil(totalItems / pageSize),
    totalItems,
    currentPage,
    itemsPerPage: pageSize,
    hasNextPage: hasMore,
    hasPrevPage: currentPage > 0,
  };
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  loaderContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  emptyMessage: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginHorizontal: 20,
  },
  errorContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    color: "#d32f2f",
  },
  errorMessage: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginHorizontal: 20,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#1976d2",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  loadMoreButton: {
    backgroundColor: "#1976d2",
    paddingVertical: 12,
    marginVertical: 20,
    marginHorizontal: 20,
    borderRadius: 6,
    alignItems: "center",
  },
  loadMoreButtonDisabled: {
    backgroundColor: "#ccc",
  },
  loadMoreButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});
