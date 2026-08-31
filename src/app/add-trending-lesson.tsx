import { getVideoThumbnailUrl } from "@/utils/videoUtils";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { db } from "../../firebaseConfig";
import { AdminPublishHeader } from "../components/library/AdminPublishHeader";
import { useSubjects } from "../components/ui/SubjectFilter";
import { colors, spacing } from "../constants/theme";
import {
  appendNotificationToAllUsers,
  buildLibraryNotification,
} from "../services/notifications";

export default function AddTrendingLessonScreen() {
  const router = useRouter();
  const { subjects } = useSubjects();
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("Mathematics");
  const [teacher, setTeacher] = useState("");
  const [duration, setDuration] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [notifyUsers, setNotifyUsers] = useState(true);

  async function handleSubmit() {
    if (!title.trim() || !teacher.trim() || !duration.trim()) {
      return;
    }

    setLoading(true);
    try {
      const finalThumbnail = getVideoThumbnailUrl(
        thumbnail.trim(),
        link.trim(),
      );

      const lessonRef = await addDoc(collection(db, "trendingLessons"), {
        id: "",
        title: title.trim(),
        subject: subject === "All" ? "General" : subject,
        teacher: teacher.trim(),
        uploadedAt: serverTimestamp(),
        duration: duration.trim(),
        thumbnail: finalThumbnail,
        link: link.trim(),
        avatar: "",
      });

      await setDoc(doc(db, "trendingLessons", lessonRef.id), {
        id: lessonRef.id,
        title: title.trim(),
        subject: subject === "All" ? "General" : subject,
        teacher: teacher.trim(),
        uploadedAt: serverTimestamp(),
        duration: duration.trim(),
        thumbnail: finalThumbnail,
        link: link.trim(),
        avatar: "",
      });

      if (notifyUsers) {
        await appendNotificationToAllUsers(
          buildLibraryNotification("lesson", lessonRef.id),
        );
      }

      router.replace("/videos");
    } catch (error) {
      console.error("Failed to add lesson", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.page}>
        <AdminPublishHeader
          title="Add Trending Lesson"
          onBack={() => router.back()}
        />

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.label}>Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Quadratic equations revision"
            style={styles.input}
          />

          <Text style={styles.label}>Subject</Text>
          <Pressable
            style={styles.dropdown}
            onPress={() => setDropdownVisible(true)}
          >
            <Text style={styles.dropdownText}>{subject}</Text>
            <Ionicons name="chevron-down" size={18} color="#6B7280" />
          </Pressable>

          <Text style={styles.label}>Teacher</Text>
          <TextInput
            value={teacher}
            onChangeText={setTeacher}
            placeholder="e.g. Tr. Elisha"
            style={styles.input}
          />

          <Text style={styles.label}>Duration</Text>
          <TextInput
            value={duration}
            onChangeText={setDuration}
            placeholder="e.g. 12:58"
            style={styles.input}
          />

          <Text style={styles.label}>Thumbnail URL</Text>
          <TextInput
            value={thumbnail}
            onChangeText={setThumbnail}
            placeholder="https://example.com/thumb.jpg"
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>YouTube Link</Text>
          <TextInput
            value={link}
            onChangeText={setLink}
            placeholder="https://www.youtube.com/watch?v=..."
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={styles.notifySection}>
            <View style={styles.notifySectionContent}>
              <View>
                <Text style={styles.notifyLabel}>Notify Community</Text>
                <Text style={styles.notifyDescription}>
                  Send notifications to users about this lesson
                </Text>
              </View>
              <Pressable
                style={[
                  styles.toggleSwitch,
                  notifyUsers && styles.toggleSwitchActive,
                ]}
                onPress={() => setNotifyUsers(!notifyUsers)}
                accessibilityRole="switch"
                accessibilityLabel="Notify Community"
                accessibilityState={{ checked: notifyUsers }}
              >
                <View
                  style={[
                    styles.toggleCircle,
                    notifyUsers && styles.toggleCircleActive,
                  ]}
                />
              </Pressable>
            </View>
          </View>

          <Pressable
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Save lesson</Text>
            )}
          </Pressable>
        </ScrollView>
      </View>

      <Modal visible={dropdownVisible} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setDropdownVisible(false)}
        >
          <ScrollView style={styles.modalCard}>
            <Text style={styles.modalTitle}>Choose subject</Text>
            {subjects
              .filter((item) => item !== "All")
              .map((item) => (
                <Pressable
                  key={item}
                  style={styles.optionRow}
                  onPress={() => {
                    setSubject(item);
                    setDropdownVisible(false);
                  }}
                >
                  <Text style={styles.optionText}>{item}</Text>
                  {subject === item ? (
                    <Ionicons name="checkmark" size={18} color="#2563EB" />
                  ) : null}
                </Pressable>
              ))}
          </ScrollView>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  page: {
    flex: 1,
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  content: { paddingBottom: spacing.xxl },
  label: {
    color: colors.subtitle,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.white,
    borderColor: "#DCE3ED",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: colors.text,
  },
  dropdown: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: "#DCE3ED",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  dropdownText: { color: colors.text, fontSize: 15 },
  submitButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 14,
    marginTop: 24,
    paddingVertical: 14,
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  notifySection: {
    backgroundColor: "rgba(37, 99, 235, 0.06)",
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  notifySectionContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  notifyLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  notifyDescription: {
    color: colors.subtitle,
    fontSize: 13,
    lineHeight: 18,
  },
  toggleSwitch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#DCE3ED",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleSwitchActive: {
    backgroundColor: colors.primary,
    alignItems: "flex-end",
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  toggleCircleActive: {
    backgroundColor: colors.white,
  },
  modalOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(17,24,39,0.45)",
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    width: "100%",
  },
  modalTitle: {
    color: "#111",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },
  optionRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  optionText: { color: "#111", fontSize: 15 },
});
