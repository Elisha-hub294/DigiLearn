import { usePathname, useRouter } from "expo-router";
import { useCallback } from "react";
import {
    FlatList,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { RecentSearchChip } from "../components/search/RecentSearchChip";
import { SearchEmptyState } from "../components/search/SearchEmptyState";
import { SearchResultBookCard } from "../components/search/SearchResultBookCard";
import { SearchResultCard } from "../components/search/SearchResultCard";
import { SearchResultTeacherCard } from "../components/search/SearchResultTeacherCard";
import { SearchResultVideoCard } from "../components/search/SearchResultVideoCard";
import { SearchSkeleton } from "../components/search/SearchSkeleton";
import { SearchBar } from "../components/ui/SearchBar";
import { getHorizontalPadding } from "../constants/layout";
import {
    SearchCategory,
    SearchResult,
    useGlobalSearch,
} from "../hooks/useGlobalSearch";

const CATEGORIES: SearchCategory[] = [
  "All",
  "Notes",
  "Books",
  "Videos",
  "Teachers",
  "Past Papers",
];

export default function SearchScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const pathname = usePathname();

  const {
    query,
    setQuery,
    debouncedQuery,
    selectedCategory,
    setSelectedCategory,
    results,
    recentSearches,
    loading,
    addRecentSearch,
    removeRecentSearch,
    triggerManualSearch,
  } = useGlobalSearch();

  // Responsive max content width calculation
  const horizontalPadding = getHorizontalPadding(width);
  const contentMaxWidth = Math.min(1000, width - horizontalPadding * 2);

  const isActivelySearching = debouncedQuery.trim().length >= 2;

  const handleResultPress = useCallback(
    (item: SearchResult) => {
      // 1. Save search term to recent searches
      if (item.title) {
        addRecentSearch(item.title);
      } else if (query.trim()) {
        addRecentSearch(query.trim());
      }

      // 2. Navigate based on card type
      switch (item.type) {
        case "video":
          router.push({
            pathname: "/lesson-player",
            params: {
              title: item.title,
              teacher: item.teacher || "Teacher",
              subject:
                typeof item.subject === "string" ? item.subject : "General",
              duration: item.duration || "10:00",
              uploadedAt: item.uploadedAt || "Recently",
              link: item.link || "",
              thumbnail: item.previewImage,
              avatar: item.avatar || "",
            },
          } as never);
          break;

        case "book":
          router.push({
            pathname: "/book-preview",
            params: { id: item.id, title: item.title, author: item.author },
          } as never);
          break;

        case "teacher":
          router.push({
            pathname: "/teacher-profile",
            params: { id: item.id, name: item.title },
          } as never);
          break;

        case "pastPaper":
          if (item.doc) {
            router.push({
              pathname: "/pdf-reader",
              params: {
                uri: encodeURIComponent(item.doc),
                title: item.title,
              },
            } as never);
          } else {
            router.push({
              pathname: "/page-preview",
              params: { id: item.id, returnTo: pathname },
            } as never);
          }
          break;

        case "topicalNote":
        default:
          router.push({
            pathname: "/page-preview",
            params: { id: item.id, returnTo: pathname },
          } as never);
          break;
      }
    },
    [addRecentSearch, query, router, pathname],
  );

  const handleChipSelect = useCallback(
    (term: string) => {
      setQuery(term);
    },
    [setQuery],
  );

  const renderResultCard = useCallback(
    ({ item, index }: { item: SearchResult; index: number }) => {
      const cardKey = `${item.type}-${item.id}-${index}`;
      return (
        <Animated.View
          entering={FadeInUp.delay(Math.min(index * 40, 240)).duration(280)}
        >
          {item.type === "video" ? (
            <SearchResultVideoCard
              key={cardKey}
              item={item}
              query={debouncedQuery}
              onPress={handleResultPress}
            />
          ) : item.type === "book" ? (
            <SearchResultBookCard
              key={cardKey}
              item={item}
              query={debouncedQuery}
              onPress={handleResultPress}
            />
          ) : item.type === "teacher" ? (
            <SearchResultTeacherCard
              key={cardKey}
              item={item}
              query={debouncedQuery}
              onPress={handleResultPress}
            />
          ) : (
            <SearchResultCard
              key={cardKey}
              item={item}
              query={debouncedQuery}
              onPress={handleResultPress}
            />
          )}
        </Animated.View>
      );
    },
    [debouncedQuery, handleResultPress],
  );

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <Animated.View
        entering={FadeIn.duration(250)}
        style={[
          styles.container,
          {
            maxWidth: contentMaxWidth,
            paddingHorizontal: horizontalPadding,
          },
        ]}
      >
        {/* Reusable Search Bar input component with back arrow */}
        <SearchBar
          isInput={true}
          showBack={true}
          autoFocus={true}
          value={query}
          onChangeText={setQuery}
          onSubmit={triggerManualSearch}
          onClear={() => setQuery("")}
          placeholder="Search pages, books, authors, teachers..."
        />

        {/* Dynamic Search Header Count: Results for "[search text]" ([count]) */}
        {isActivelySearching && (
          <Animated.View
            entering={FadeInUp.duration(200)}
            style={styles.resultHeaderWrap}
          >
            <Text style={styles.resultHeaderText}>
              Results for &quot;{debouncedQuery.trim()}&quot; ({results.length})
            </Text>
          </Animated.View>
        )}

        {/* Category Filter Chips Bar */}
        <View style={styles.categoryBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <Pressable
                  key={cat}
                  accessibilityRole="button"
                  onPress={() => setSelectedCategory(cat)}
                  style={[
                    styles.categoryChip,
                    active && styles.categoryChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      active && styles.categoryTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Main Content Area */}
        <View style={styles.contentBody}>
          {/* Recent Searches Section */}
          {recentSearches.length > 0 && !isActivelySearching && (
            <Animated.View
              entering={FadeInUp.duration(280)}
              style={styles.recentSection}
            >
              <Text style={styles.sectionTitle}>Recent</Text>
              <View style={styles.chipsWrap}>
                {recentSearches.map((term) => (
                  <RecentSearchChip
                    key={term}
                    term={term}
                    onSelect={handleChipSelect}
                    onRemove={removeRecentSearch}
                  />
                ))}
              </View>
            </Animated.View>
          )}

          {/* Results / Skeleton / Empty State */}
          {loading ? (
            <SearchSkeleton />
          ) : isActivelySearching && results.length === 0 ? (
            <SearchEmptyState />
          ) : (
            <FlatList
              data={results}
              renderItem={renderResultCard}
              keyExtractor={(item, index) => `${item.type}-${item.id}-${index}`}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.listContainer}
            />
          )}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
    paddingTop: 8,
  },
  resultHeaderWrap: {
    marginBottom: 20,
  },
  resultHeaderText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#4D7CFE",
  },
  categoryBar: {
    marginBottom: 16,
  },
  categoryScroll: {
    gap: 8,
    paddingRight: 10,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  categoryChipActive: {
    backgroundColor: "#006EFF",
    borderColor: "#006EFF",
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4B5563",
  },
  categoryTextActive: {
    color: "#FFFFFF",
  },
  contentBody: {
    flex: 1,
  },
  recentSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 12,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  listContainer: {
    paddingBottom: 40,
  },
});
