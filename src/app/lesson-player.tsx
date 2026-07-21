import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
import { useMemo } from "react";
import {
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

function getYoutubeEmbedUrl(rawUrl?: string) {
  if (!rawUrl) {
    return "https://www.youtube.com/embed/dQw4w9WgXcQ";
  }

  const trimmed = rawUrl.trim();
  const watchMatch = trimmed.match(/[?&]v=([^&#]+)/);
  const shortMatch = trimmed.match(/youtu\.be\/([^?#]+)/);
  const id = watchMatch?.[1] ?? shortMatch?.[1];

  if (!id) {
    return trimmed;
  }

  return `https://www.youtube.com/embed/${id}`;
}

export default function LessonPlayerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    title?: string;
    teacher?: string;
    subject?: string;
    duration?: string;
    uploadedAt?: string;
    link?: string;
    thumbnail?: string;
  }>();

  const embedUrl = useMemo(
    () => getYoutubeEmbedUrl(params.link),
    [params.link],
  );

  async function openVideo() {
    if (!embedUrl) {
      return;
    }

    await WebBrowser.openBrowserAsync(embedUrl, {
      presentationStyle: "fullScreen",
      controlsColor: "#2563EB",
    });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Lesson preview</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Watch this lesson</Text>
          <Text style={styles.heroSubtitle}>
            Open the lesson in your browser to play the video and follow along.
          </Text>
          <Pressable style={styles.playButton} onPress={openVideo}>
            <Ionicons name="play-circle" size={24} color="#fff" />
            <Text style={styles.playButtonText}>Open video</Text>
          </Pressable>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.title}>{params.title ?? "Lesson"}</Text>
          <Text style={styles.meta}>By {params.teacher ?? "Teacher"}</Text>
          <Text style={styles.meta}>
            {params.subject ?? "General"} • {params.duration ?? "00:00"}
          </Text>
          <Text style={styles.description}>
            This lesson is now available in your trending library. Use the
            embedded player to review the topic, and keep exploring more lessons
            from the same subject.
          </Text>

          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {params.uploadedAt ?? "Recently added"}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0F172A" },
  header: {
    alignItems: "center",
    backgroundColor: "#0F172A",
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  content: { padding: 16, paddingBottom: 32 },
  heroCard: {
    backgroundColor: "#111827",
    borderRadius: 20,
    padding: 18,
  },
  heroTitle: { color: "#fff", fontSize: 20, fontWeight: "700" },
  heroSubtitle: {
    color: "#D1D5DB",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  playButton: {
    alignItems: "center",
    backgroundColor: "#2563EB",
    borderRadius: 999,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  playButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginTop: 16,
    padding: 18,
  },
  title: { color: "#111", fontSize: 22, fontWeight: "700" },
  meta: { color: "#64748B", fontSize: 14, marginTop: 6 },
  description: {
    color: "#334155",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 12,
  },
  badgeRow: { flexDirection: "row", marginTop: 14 },
  badge: {
    backgroundColor: "#E0F2FE",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  badgeText: { color: "#0369A1", fontSize: 12, fontWeight: "700" },
});
