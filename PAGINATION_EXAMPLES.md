# Pagination Implementation Examples

## Example 1: Updating see-all.tsx for Paginated Books

### Current Implementation

```typescript
// Current - loads all books at once
const [books, setBooks] = useState<Book[]>([]);
const [booksLoading, setBooksLoading] = useState(mode === "books");

useEffect(() => {
  if (mode !== "books") return;
  let mounted = true;
  void loadBooks()
    .then((loadedBooks) => {
      if (!mounted) return;
      setBooks(
        loadedBooks.map((book) => ({
          id: book.id,
          title: book.title,
          author: book.author,
          image: book.image,
        })),
      );
      setBooksLoading(false);
    })
    .catch(() => {
      if (mounted) setBooksLoading(false);
    });
  return () => {
    mounted = false;
  };
}, [mode]);
```

### Updated Implementation with Pagination

```typescript
import { useBooksPagination } from "../hooks/useLibraryPagination";
import { FlatList, ActivityIndicator, View } from "react-native";

// Replace the old state and effect with:
const booksPagination = useBooksPagination();

useEffect(() => {
  if (mode !== "books") return;

  // Reset pagination when mode changes
  booksPagination.reset();
}, [mode]);

// In render, replace the books display with:
{mode === "books" && (
  <FlatList
    data={booksPagination.items}
    keyExtractor={(item) => item.id}
    renderItem={({ item }) => <BookCard book={item} />}
    numColumns={columns}
    onEndReached={() => {
      if (booksPagination.hasMore && !booksPagination.loading) {
        booksPagination.loadMore();
      }
    }}
    onEndReachedThreshold={0.5}
    ListFooterComponent={
      booksPagination.loading && booksPagination.hasMore ? (
        <View style={{ padding: 20 }}>
          <ActivityIndicator />
        </View>
      ) : null
    }
    refreshControl={
      <RefreshControl
        refreshing={booksPagination.loading && !booksPagination.items.length}
        onRefresh={booksPagination.refresh}
      />
    }
  />
)}
```

## Example 2: Adding Pagination to activity.tsx

### Current Implementation

```typescript
const [activities, setActivities] = useState<ActivityItem[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

const loadData = useCallback(async () => {
  if (!user) {
    setLoading(false);
    setActivities([]);
    return;
  }

  setLoading(true);
  setError(null);
  try {
    const data = await fetchUserActivity(user.uid);
    setActivities(data);
  } catch (err) {
    console.error("ActivityScreen loadData error:", err);
    setError("Unable to load activity right now. Please try again.");
  } finally {
    setLoading(false);
  }
}, [user]);
```

### Updated with Pagination (for future)

```typescript
// Create a paginated version of fetchUserActivity
export async function fetchUserActivityPaginated(
  userId: string,
  pageSize: number = 20,
  cursor?: DocumentSnapshot,
): Promise<PaginationResult<ActivityItem>> {
  // Implement similar to loadBooksPaginated
  // ...
}

// Then in component:
import { usePagination } from "../hooks/usePagination";

const activityState = usePagination(collection(db, "activityEvents"), {
  pageSize: 20,
  orderByField: "openedAt",
  orderDirection: "desc",
  constraints: [where("userId", "==", user?.uid || "")],
  fetcher: async (query) => {
    const snapshot = await getDocs(query);
    return snapshot.docs;
  },
  mapper: (doc) => ({
    id: doc.id,
    // ... map activity fields
  }),
});

useFocusEffect(
  useCallback(() => {
    activityState.refresh();
  }, [user?.uid]),
);
```

## Example 3: Creating Paginated Reports for Admin

```typescript
import {
  getDocs,
  query,
  collection,
  orderBy,
  where,
  startAfter,
  limit,
} from "firebase/firestore";
import {
  PaginationResult,
  processPaginationResults,
} from "../utils/paginationUtils";
import { db } from "../../firebaseConfig";

export async function fetchReportsPaginated(
  status: string = "new",
  pageSize: number = 20,
  cursor?: DocumentSnapshot,
): Promise<PaginationResult<ReportRecord>> {
  const collectionRef = collection(db, "reports");

  let q = query(
    collectionRef,
    where("status", "==", status),
    orderBy("createdAt", "desc"),
  );

  if (cursor) {
    q = query(
      collectionRef,
      where("status", "==", status),
      orderBy("createdAt", "desc"),
      startAfter(cursor),
    );
  }

  q = query(q, limit(pageSize + 1));

  const snapshot = await getDocs(q);
  return processPaginationResults(snapshot.docs, pageSize, (doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      status: data.status,
      createdAt: data.createdAt,
      item: data.item,
      reason: data.reason,
      // ... other fields
    };
  });
}

// In component:
import { usePagination } from "../hooks/usePagination";

const reportState = usePagination(collection(db, "reports"), {
  pageSize: 15,
  orderByField: "createdAt",
  orderDirection: "desc",
  constraints: [where("status", "==", "new")],
  fetcher: async (q) => {
    const snapshot = await getDocs(q);
    return snapshot.docs;
  },
  mapper: (doc) => ({ id: doc.id, ...doc.data() }),
});
```

## Example 4: Pagination with Filters

```typescript
import { useCallback, useState } from "react";
import { usePagination } from "../hooks/usePagination";
import { where } from "firebase/firestore";

export function FilteredPapersScreen() {
  const [selectedSubject, setSelectedSubject] = useState("Mathematics");
  const [selectedYear, setSelectedYear] = useState("2024");

  const papersState = usePagination(collection(db, "pastPaper"), {
    pageSize: 16,
    orderByField: "year",
    orderDirection: "desc",
    constraints: [
      where("subject", "==", selectedSubject),
      where("year", "==", selectedYear),
    ],
    fetcher: async (q) => {
      const snapshot = await getDocs(q);
      return snapshot.docs;
    },
    mapper: (doc) => ({ id: doc.id, ...doc.data() }),
    autoLoad: true,
  });

  const handleSubjectChange = useCallback((subject: string) => {
    setSelectedSubject(subject);
    // Reset pagination when filter changes
    papersState.reset();
  }, [papersState]);

  const handleYearChange = useCallback((year: string) => {
    setSelectedYear(year);
    // Reset pagination when filter changes
    papersState.reset();
  }, [papersState]);

  return (
    <View>
      <SubjectPicker value={selectedSubject} onChange={handleSubjectChange} />
      <YearPicker value={selectedYear} onChange={handleYearChange} />

      <FlatList
        data={papersState.items}
        numColumns={3}
        onEndReached={() => {
          if (papersState.hasMore && !papersState.loading) {
            papersState.loadNext();
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          papersState.loading && papersState.hasMore ? <ActivityIndicator /> : null
        }
      />
    </View>
  );
}
```

## Example 5: Infinite Scroll with Pull-to-Refresh

```typescript
import { FlatList, RefreshControl, ActivityIndicator, View } from "react-native";
import { useBooksPagination } from "../hooks/useLibraryPagination";

export function BooksWithInfiniteScrollScreen() {
  const { items, loading, hasMore, loadMore, refresh } = useBooksPagination();

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <BookCard book={item} />}
      numColumns={2}

      // Infinite scroll
      onEndReached={() => {
        if (hasMore && !loading) {
          loadMore();
        }
      }}
      onEndReachedThreshold={0.5}

      // Loading indicator at bottom
      ListFooterComponent={
        loading && hasMore ? (
          <View style={{ paddingVertical: 20 }}>
            <ActivityIndicator size="large" />
          </View>
        ) : null
      }

      // Pull-to-refresh
      refreshControl={
        <RefreshControl
          refreshing={loading && items.length === 0}
          onRefresh={refresh}
          tintColor="#666"
        />
      }

      // Empty state
      ListEmptyComponent={
        !loading ? (
          <View style={{ alignItems: "center", padding: 40 }}>
            <Text>No books found</Text>
          </View>
        ) : null
      }
    />
  );
}
```

## Key Implementation Tips

1. **Always reset pagination when filters change**

   ```typescript
   const handleFilterChange = () => {
     setSelectedFilter(newValue);
     state.reset(); // Reset to first page
   };
   ```

2. **Handle loading states properly**

   ```typescript
   {loading && items.length === 0 && <SkeletonLoader />}
   {loading && items.length > 0 && <ActivityIndicator />}
   {error && <ErrorMessage error={error} />}
   ```

3. **Implement proper error recovery**

   ```typescript
   {error && (
     <View>
       <Text>{error}</Text>
       <Button title="Retry" onPress={refresh} />
     </View>
   )}
   ```

4. **Show better UX with load more button**

   ```typescript
   {hasMore && !loading && (
     <Button
       title="Load More"
       onPress={loadMore}
       disabled={loading}
     />
   )}
   ```

5. **Test pagination behavior**
   - Test with empty results
   - Test with exactly pageSize items
   - Test with pageSize + 1 items
   - Test with many items
   - Test network failures during pagination
