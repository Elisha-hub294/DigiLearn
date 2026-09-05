# Pagination Implementation Guide

## Overview

This guide explains how to implement pagination throughout the DigiLearn app to optimize database reads. All pagination utilities are cursor-based, which is the most efficient approach for Firestore.

## Core Utilities

### 1. Pagination Utilities (`src/utils/paginationUtils.ts`)

Provides helper functions for building Firestore queries with pagination:

```typescript
import {
  buildPaginationQuery,
  processPaginationResults,
} from "../utils/paginationUtils";
import { getDocs } from "firebase/firestore";

// Build a paginated query
const paginationQuery = buildPaginationQuery(collectionRef, {
  orderByField: "title",
  orderDirection: "asc",
  pageSize: 20,
  cursor: lastDocSnapshot, // undefined for first page
});

// Execute and process results
const docs = await getDocs(paginationQuery);
const result = processPaginationResults(docs, 20, (doc) => ({
  id: doc.id,
  // ... map document fields
}));

// result.items contains 20 items
// result.nextCursor for fetching next page
// result.hasMore indicates if more items exist
```

### 2. Reusable Hook (`src/hooks/usePagination.ts`)

Generic hook for cursor-based pagination in components:

```typescript
import { usePagination } from "../hooks/usePagination";
import { getDocs } from "firebase/firestore";

const state = usePagination(collectionRef, {
  pageSize: 20,
  orderByField: "createdAt",
  orderDirection: "desc",
  fetcher: (query) => getDocs(query).then((snap) => snap.docs),
  mapper: (doc) => ({ id: doc.id, ...doc.data() }),
  autoLoad: true,
});

// Usage in component
const { items, loading, hasMore, loadNext, refresh } = state;
```

### 3. Library-Specific Hooks (`src/hooks/useLibraryPagination.ts`)

Pre-configured hooks for common collections:

```typescript
import {
  useBooksPagination,
  useTrendingLessonsPagination,
} from "../hooks/useLibraryPagination";

// For books
const booksState = useBooksPagination();
const { items: books, loading, hasMore, loadMore } = booksState;

// For trending lessons
const lessonsState = useTrendingLessonsPagination();
const { items: lessons, loading, hasMore, loadMore } = lessonsState;
```

## Implementation Examples

### Example 1: Simple Infinite Scroll

```typescript
import { FlatList } from 'react-native';
import { useBooksPagination } from '../hooks/useLibraryPagination';
import { ActivityIndicator } from 'react-native';

export function BooksListScreen() {
  const { items, loading, hasMore, loadMore } = useBooksPagination();

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <BookCard book={item} />}
      onEndReached={() => {
        if (hasMore && !loading) {
          loadMore();
        }
      }}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        loading && hasMore ? <ActivityIndicator /> : null
      }
    />
  );
}
```

### Example 2: Load More Button

```typescript
import { useBooksPagination } from '../hooks/useLibraryPagination';

export function BookCatalogScreen() {
  const { items, loading, hasMore, loadMore } = useBooksPagination();

  return (
    <View>
      <FlatList data={items} renderItem={...} />
      {hasMore && (
        <Button
          title={loading ? 'Loading...' : 'Load More'}
          onPress={loadMore}
          disabled={loading}
        />
      )}
    </View>
  );
}
```

### Example 3: Pull-to-Refresh

```typescript
import { useBooksPagination } from '../hooks/useLibraryPagination';

export function BooksScreen() {
  const { items, loading, hasMore, loadMore, refresh } = useBooksPagination();

  return (
    <FlatList
      data={items}
      onRefresh={refresh}
      refreshing={loading}
      onEndReached={() => hasMore && !loading && loadMore()}
      onEndReachedThreshold={0.5}
    />
  );
}
```

### Example 4: Custom Pagination

```typescript
import { usePagination } from '../hooks/usePagination';
import { collection, getDocs, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

export function FilteredBooksScreen() {
  const booksRef = collection(db, 'books');

  const state = usePagination(booksRef, {
    pageSize: 15,
    orderByField: 'title',
    constraints: [where('subject', '==', 'Mathematics')],
    fetcher: async (query) => {
      const snapshot = await getDocs(query);
      return snapshot.docs;
    },
    mapper: (doc) => ({
      id: doc.id,
      title: doc.data().title,
      // ... other fields
    }),
  });

  return (
    <FlatList
      data={state.items}
      onEndReached={() => state.hasMore && !state.loading && state.loadNext()}
    />
  );
}
```

## Service Integration

### Adding Pagination to a Service

```typescript
// books.service.ts
import {
  DocumentSnapshot,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
} from "firebase/firestore";
import {
  PaginationResult,
  processPaginationResults,
} from "../utils/paginationUtils";

export async function loadBooksPaginated(
  pageSize: number = 20,
  cursor?: DocumentSnapshot,
): Promise<PaginationResult<BookRecord>> {
  const collectionRef = collection(db, "books");

  let q = query(collectionRef, orderBy("title"));
  if (cursor) {
    q = query(collectionRef, orderBy("title"), startAfter(cursor));
  }
  q = query(q, limit(pageSize + 1));

  const snapshot = await getDocs(q);
  return processPaginationResults(snapshot.docs, pageSize, (doc) => ({
    id: doc.id,
    // ... map fields
  }));
}
```

## Database Considerations

### Firestore Indexes Required

For efficient pagination, create indexes on:

- `books: title`
- `trendingLessons: uploadedAt (desc)`
- `pastPaper: year (desc), subject (asc)`
- `pages: subject (asc)`
- Any other collection with pagination queries

Create indexes via Firebase Console or when prompted by Firestore.

### Cost Optimization

- **Before**: Loading 1000 books = 1 read operation
- **After**: Loading 20 books paginated = 1 read + 1 per "load more"
- **Benefit**: Reduced initial load time, bandwidth, and memory usage

## Screens Prioritized for Implementation

1. **see-all.tsx** - Shows all books/courses/papers (High Priority)
2. **activity.tsx** - User activity history (Medium Priority)
3. **admin-reports.tsx** - Admin dashboard reports (Medium Priority)
4. **teacher-applications.tsx** - Teacher app approvals (Low Priority)
5. **notifications.tsx** - User notifications (Low Priority)

## Best Practices

1. **Always use cursor-based pagination** for large collections
2. **Fetch pageSize + 1** to efficiently determine if more items exist
3. **Show loading indicators** during page transitions
4. **Handle empty states** gracefully
5. **Implement pull-to-refresh** to reset pagination
6. **Test with various page sizes** (default: 20)
7. **Monitor database reads** in Firebase Console

## Migration Checklist

- [ ] Create Firestore indexes for paginated fields
- [ ] Update `see-all.tsx` to use `useBooksPagination`
- [ ] Update `see-all.tsx` to use `useTrendingLessonsPagination`
- [ ] Update `activity.tsx` to use paginated activity
- [ ] Implement load-more UI in screens
- [ ] Add error handling and retry logic
- [ ] Test on low-bandwidth connection
- [ ] Monitor Firestore read count before/after
- [ ] Update admin reports pagination
- [ ] Create database read reports
