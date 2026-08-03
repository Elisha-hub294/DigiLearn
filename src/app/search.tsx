import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import {
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
import { SearchHeader } from "../components/search/SearchHeader";
import { SearchResultCard } from "../components/search/SearchResultCard";
import { SearchSkeleton } from "../components/search/SearchSkeleton";
import { dimensions } from "../constants/theme";
import { SearchResult, useGlobalSearch } from "../hooks/useGlobalSearch";

export default function SearchScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();

  const {
    query,
    setQuery,
    debouncedQuery,
    results,
    recentSearches,
    loading,
    addRecentSearch,
    removeRecentSearch,
    triggerManualSearch,
  } = useGlobalSearch();

  // Calculate responsive horizontal padding & max content width
  const horizontalPadding =
    width >= 1024 ? 48 : width >= 768 ? 32 : width >= 400 ? 20 : 16;
  const contentMaxWidth = Math.min(1000, width - horizontalPadding * 2);

  const isActivelySearching = debouncedQuery.trim().length >= 2;

  const handleResultPress = useCallback(
    (item: SearchResult) => {
      // 1. Save term to Recent
      if (item.title) {
        addRecentSearch(item.title);
      } else if (query.trim()) {
        addRecentSearch(query.trim());
      }

      // 2. Navigate based on type and doc field
      if (item.type === "pastPaper") {
        const docUri = item.rawItem?.doc || item.rawItem?.pdf || item.rawItem?.fileUrl;
        if (docUri) {
          router.push({
            pathname: "/pdf-reader",
            params: {
              uri: encodeURIComponent(docUri),
              title: item.title,
            },
          } as never);
        } else {
          router.push({
            pathname: "/page-preview",
            params: { id: item.id },
          } as never);
        }
      } else {
        router.push({
          pathname: "/page-preview",
          params: { id: item.id },
        } as never);
      }
    },
    [addRecentSearch, query, router]
  );

  const handleChipSelect = useCallback(
    (term: string) => {
      setQuery(term);
    },
    [setQuery]
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
        <SearchHeader
          value={query}
          onChangeText={setQuery}
          onSubmit={triggerManualSearch}
          onClear={() => setQuery("")}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Recent Section - Only displayed if user has recent searches */}
          {recentSearches.length > 0 && !isActivelySearching && (
            <Animated.View
              entering={FadeInUp.duration(300)}
              style={styles.section}
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

          {/* Suggested / Results Section */}
          <Animated.View
            entering={FadeInUp.duration(300).delay(100)}
            style={styles.section}
          >
            <Text style={styles.sectionTitle}>Suggested</Text>

            {loading ? (
              <SearchSkeleton />
            ) : isActivelySearching && results.length === 0 ? (
              <SearchEmptyState />
            ) : (
              <View style={styles.resultsList}>
                {results.map((item) => (
                  <SearchResultCard
                    key={`${item.type}-${item.id}`}
                    item={item}
                    query={debouncedQuery}
                    onPress={handleResultPress}
                  />
                ))}
              </View>
            )}
          </Animated.View>
        </ScrollView>
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 14,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  resultsList: {
    width: "100%",
  },
});
