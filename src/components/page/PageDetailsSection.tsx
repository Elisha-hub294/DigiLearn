import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import type { TopicalNote } from "./pageTypes";

type PageDetailsSectionProps = {
  note: TopicalNote;
  dateText: string;
};

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  value: string;
}) {
  return (
    <View style={styles.row}>
      <Feather name={icon} size={16} color="#64748B" />
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const formatList = (value?: string | string[]) => {
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  return value?.trim() || "Not provided";
};

export function PageDetailsSection({
  note,
  dateText,
}: PageDetailsSectionProps) {
  const sourceBooks = formatList(note.book);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Page details</Text>
      <View style={styles.details}>
        <DetailRow
          icon="book-open"
          label="Subject"
          value={formatList(note.subject)}
        />
        <DetailRow
          icon="layers"
          label="Level"
          value={note.level?.trim() || "Not provided"}
        />
        <DetailRow
          icon="users"
          label="Class"
          value={note.schoolClass?.trim() || "Not provided"}
        />
        <DetailRow
          icon="file-text"
          label="Pages"
          value={note.pages ? String(note.pages) : "Not provided"}
        />
        <DetailRow icon="book" label="Source books" value={sourceBooks} />
        <DetailRow
          icon="image"
          label="Cover"
          value={note.cover || note.preview ? "Available" : "Not provided"}
        />
        <DetailRow
          icon="file"
          label="Document"
          value={note.document ? "Available" : "Not provided"}
        />
        <DetailRow icon="clock" label="Last updated" value={dateText} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
  },
  heading: {
    color: "#1B2730",
    fontSize: 21,
    fontWeight: "600",
    marginBottom: 12,
  },
  details: {
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  row: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    gap: 10,
  },
  label: {
    width: 100,
    color: "#64748B",
    fontSize: 14,
  },
  value: {
    flex: 1,
    color: "#1B2730",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "right",
  },
});
