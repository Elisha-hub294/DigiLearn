import {
  CollectionReference,
  DocumentSnapshot,
  Query,
  QueryConstraint,
  endAt,
  limit,
  orderBy,
  query,
  startAfter,
} from "firebase/firestore";

/**
 * Generic pagination result for list operations
 */
export interface PaginationResult<T> {
  /** The items for the current page */
  items: T[];
  /** Cursor to use for fetching the next page */
  nextCursor?: DocumentSnapshot;
  /** Cursor to use for fetching the previous page */
  prevCursor?: DocumentSnapshot;
  /** Whether there are more items available */
  hasMore: boolean;
  /** Total count of items in current page */
  count: number;
}

export interface PaginationParams {
  /** Number of items per page */
  pageSize: number;
  /** Cursor position for continuation queries */
  cursor?: DocumentSnapshot;
  /** Whether to fetch the previous page (requires cursor) */
  reverse?: boolean;
}

export interface CursorPaginationOptions {
  /** Field to order by - must be indexed in Firestore */
  orderByField: string;
  /** Sort direction */
  orderDirection?: "asc" | "desc";
  /** Number of items per page */
  pageSize: number;
  /** Additional query constraints */
  constraints?: QueryConstraint[];
  /** Cursor for pagination */
  cursor?: DocumentSnapshot;
  /** Fetch in reverse direction */
  reverse?: boolean;
}

/**
 * Build a paginated Firestore query using cursor-based pagination
 * Fetches pageSize + 1 items to determine if there are more pages
 */
export function buildPaginationQuery(
  collectionOrQuery: CollectionReference | Query,
  options: CursorPaginationOptions,
): Query {
  const {
    orderByField,
    orderDirection = "asc",
    pageSize,
    constraints = [],
    cursor,
    reverse = false,
  } = options;

  const orderConstraint = orderBy(orderByField, orderDirection);
  let allConstraints: QueryConstraint[] = [orderConstraint, ...constraints];

  // Add cursor position
  if (cursor) {
    if (reverse) {
      allConstraints.push(endAt(cursor));
    } else {
      allConstraints.push(startAfter(cursor));
    }
  }

  // Fetch one extra to determine if there are more pages
  allConstraints.push(limit(pageSize + 1));

  return query(collectionOrQuery, ...allConstraints);
}

/**
 * Process pagination results and extract items with cursors
 * Returns pageSize items, even if pageSize + 1 were fetched
 */
export function processPaginationResults<T>(
  docs: DocumentSnapshot[],
  pageSize: number,
  mapper: (doc: DocumentSnapshot) => T,
): PaginationResult<T> {
  const hasMore = docs.length > pageSize;
  const resultDocs = hasMore ? docs.slice(0, pageSize) : docs;
  const items = resultDocs.map(mapper);

  return {
    items,
    nextCursor: hasMore ? resultDocs[resultDocs.length - 1] : undefined,
    prevCursor: resultDocs[0],
    hasMore,
    count: items.length,
  };
}

/**
 * Offset-based pagination for simpler use cases
 * Less efficient than cursor pagination but easier to understand
 */
export interface OffsetPaginationOptions {
  pageSize: number;
  pageNumber: number; // 0-indexed
  constraints?: QueryConstraint[];
}

export function buildOffsetPaginationQuery(
  collectionOrQuery: CollectionReference | Query,
  orderByField: string,
  options: OffsetPaginationOptions,
): Query {
  const { pageSize, pageNumber, constraints = [] } = options;
  const offset = pageNumber * pageSize;

  const allConstraints = [
    orderBy(orderByField),
    limit(offset + pageSize + 1),
    ...constraints,
  ];

  return query(collectionOrQuery, ...allConstraints);
}

export function processOffsetPaginationResults<T>(
  docs: DocumentSnapshot[],
  pageSize: number,
  pageNumber: number,
  mapper: (doc: DocumentSnapshot) => T,
): PaginationResult<T> {
  const offset = pageNumber * pageSize;
  const resultDocs = docs.slice(offset, offset + pageSize);
  const hasMore = docs.length > offset + pageSize;

  return {
    items: resultDocs.map(mapper),
    hasMore,
    count: resultDocs.length,
  };
}

/**
 * Helper to determine if there's a next/previous page
 */
export function getHasPrevious(pageNumber: number): boolean {
  return pageNumber > 0;
}

export function getHasNext(currentCount: number, pageSize: number): boolean {
  return currentCount >= pageSize;
}
