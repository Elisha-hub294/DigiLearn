import { doc, getDoc, getDocs, collection } from "firebase/firestore";
import React from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { db } from "../../../firebaseConfig";
import { AuthorsCarousel } from "./AuthorsCarousel";
import { BookHero } from "./BookHero";
import { BookOverview } from "./BookOverview";
import { BottomActionBar } from "./BottomActionBar";
import { Book, FALLBACK_COVER } from "./bookTypes";
import { SimilarBooks } from "./SimilarBooks";

const gradients = [["#57F287", "#2D9CFF"], ["#6A5AF9", "#D66BFF"], ["#FF6A88", "#FFB86B"], ["#00C9A7", "#0084FF"], ["#F857A6", "#FF5858"], ["#4FACFE", "#00F2FE"]] as const;
const getHorizontalPadding = (width: number) => {
  if (width >= 1200) return 64;
  if (width >= 900) return 48;
  if (width >= 600) return 32;
  if (width >= 400) return 10;
  return 5;
};
const strings = (v: unknown) => Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : typeof v === "string" ? [v] : [];
const asNumber = (v: unknown) => typeof v === "number" ? v : typeof v === "string" ? Number(v) || undefined : undefined;
function mapBook(id: string, d: Record<string, unknown>): Book { return { id, title: typeof d.title === "string" ? d.title : "Untitled book", description: typeof d.description === "string" ? d.description : typeof d.summary === "string" ? d.summary : "", cover: typeof d.cover === "string" ? d.cover : typeof d.image === "string" ? d.image : FALLBACK_COVER, year: typeof d.year === "string" || typeof d.year === "number" ? String(d.year) : undefined, edition: typeof d.edition === "string" ? d.edition : undefined, author: strings(d.author), subject: strings(d.subject), pages: typeof d.pages === "string" || typeof d.pages === "number" ? String(d.pages) : typeof d.pageCount === "number" ? String(d.pageCount) : undefined, rating: asNumber(d.rating), saves: asNumber(d.savedBy ?? d.saves) }; }

export function BookPreviewScreen() {
  const { id, source } = useLocalSearchParams<{ id: string; source?: "home" | "library" }>(); const [book, setBook] = useState<Book>(); const [allBooks, setAllBooks] = useState<Book[]>([]); const [favourite, setFavourite] = useState(false); const [bookmarked, setBookmarked] = useState(false); const { width } = useWindowDimensions(); const [gradient] = useState(() => gradients[Math.floor(Math.random() * gradients.length)]);
  useEffect(() => { let active = true; (async () => { try { const [selected, snapshot] = await Promise.all([getDoc(doc(db, "books", id)), getDocs(collection(db, "books"))]); if (!active) return; if (selected.exists()) setBook(mapBook(selected.id, selected.data() as Record<string, unknown>)); setAllBooks(snapshot.docs.map(d => mapBook(d.id, d.data() as Record<string, unknown>))); } catch (e) { console.error("Could not load book preview", e); } })(); return () => { active = false; }; }, [id]);
  const similar = useMemo(() => book ? allBooks.filter(candidate => candidate.id !== book.id && candidate.subject.some(subject => book.subject.includes(subject))).slice(0, 10) : [], [allBooks, book]);
  if (!book) return <View style={styles.loading} accessibilityLabel="Loading book preview"><View style={styles.skeletonHero} /><View style={styles.skeletonSheet}><View style={styles.skeletonTitle} /><View style={styles.skeletonLine} /><View style={styles.skeletonLineShort} /><View style={styles.skeletonAvatars} /></View><ActivityIndicator style={styles.loader} color="#147B5B" /></View>;
  const horizontalPadding = getHorizontalPadding(width);
  const contentMaxWidth = Math.min(1100, width - horizontalPadding * 2);
  const goBack = () => router.replace(source === "home" ? "/" : "/library");
  return <View style={styles.screen}><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: 110 }]}><View style={[styles.contentContainer, { maxWidth: contentMaxWidth }]}><BookHero book={book} favourite={favourite} onFavourite={() => setFavourite(value => !value)} onBack={goBack} /><Animated.View entering={FadeInUp.duration(430)} style={[styles.sheet, { paddingHorizontal: horizontalPadding }]}><BookOverview book={book} /><AuthorsCarousel authors={book.author} /><SimilarBooks books={similar} onSelect={(nextId) => router.replace({ pathname: "/book-preview", params: { id: nextId, source: source ?? "library" } } as any)} /></Animated.View></View></ScrollView><View style={styles.action}><View style={[styles.actionContent, { maxWidth: contentMaxWidth }]}><BottomActionBar gradient={gradient} bookmarked={bookmarked} onBookmark={() => setBookmarked(value => !value)} /></View></View></View>;
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: "#fff" }, scrollContent: { flexGrow: 1, alignItems: "center" }, contentContainer: { width: "100%" }, loading: { flex: 1, backgroundColor: "#fff" }, skeletonHero: { height: "46%", backgroundColor: "#DDE4E2" }, skeletonSheet: { flex: 1, marginTop: -28, padding: 24, borderTopLeftRadius: 32, borderTopRightRadius: 32, backgroundColor: "#fff" }, skeletonTitle: { width: 150, height: 22, borderRadius: 8, backgroundColor: "#E8EEEC", marginBottom: 20 }, skeletonLine: { height: 14, borderRadius: 7, backgroundColor: "#EEF2F1", marginBottom: 11 }, skeletonLineShort: { width: "62%", height: 14, borderRadius: 7, backgroundColor: "#EEF2F1" }, skeletonAvatars: { width: 250, height: 64, marginTop: 42, borderRadius: 32, backgroundColor: "#E8EEEC" }, loader: { position: "absolute", top: "48%", alignSelf: "center" }, sheet: { marginTop: -28, paddingTop: 32, borderTopLeftRadius: 32, borderTopRightRadius: 32, backgroundColor: "#fff", minHeight: 520, shadowColor: "#0F172A", shadowOpacity: .1, shadowRadius: 12, shadowOffset: { width: 0, height: -4 }, elevation: 6 }, action: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: "#fff", alignItems: "center" }, actionContent: { width: "100%" } });
