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
import { subjects } from "../components/ui/SubjectFilter";

export default function AddTrendingLessonScreen() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState(subjects[1]);
  const [teacher, setTeacher] = useState("");
  const [duration, setDuration] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  async function handleSubmit() {
    if (!title.trim() || !teacher.trim() || !duration.trim()) {
      return;
    }

    setLoading(true);
    try {
      const lessonRef = await addDoc(collection(db, "trendingLessons"), {
        id: "",
        title: title.trim(),
        subject: subject === "All" ? "General" : subject,
        teacher: teacher.trim(),
        uploadedAt: serverTimestamp(),
        duration: duration.trim(),
        thumbnail: thumbnail.trim(),
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
        thumbnail: thumbnail.trim(),
        link: link.trim(),
        avatar: "",
      });

      router.replace("/videos");
    } catch (error) {
      console.error("Failed to add lesson", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </Pressable>
        <Text style={styles.title}>Add trending lesson</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
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
  safeArea: { flex: 1, backgroundColor: "#fff" },
  header: {
    alignItems: "center",
    borderBottomColor: "#E5E7EB",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  iconButton: { padding: 4 },
  title: { color: "#111", fontSize: 20, fontWeight: "700" },
  content: { padding: 20, paddingBottom: 40 },
  label: {
    color: "#111",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#F3F4F6",
    borderColor: "#D1D5DB",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdown: {
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderColor: "#D1D5DB",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  dropdownText: { color: "#111", fontSize: 15 },
  submitButton: {
    alignItems: "center",
    backgroundColor: "#2563EB",
    borderRadius: 14,
    marginTop: 24,
    paddingVertical: 14,
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
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
