import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
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
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <Feather name={icon} size={16} color={colors.inactive} />
      <Text style={[styles.label, { color: colors.subtitle }]}>{label}</Text>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const formatList = (value?: string | string[]) => {
  if (Array.isArray(value)) {
    const formatted = value.filter((item) => item.trim()).join(", ");
    return formatted || undefined;
  }
  return value?.trim() || undefined;
};

export function PageDetailsSection({
  note,
  dateText,
}: PageDetailsSectionProps) {
  const { colors } = useTheme();
  const sourceBooks = formatList(note.book);

  return (
    <View style={styles.container}>
      <Text style={[styles.heading, { color: colors.text }]}>Page details</Text>
      <View style={[styles.details, { borderTopColor: colors.border }]}>
        {formatList(note.subject) && (
          <DetailRow
            icon="book-open"
            label="Subject"
            value={formatList(note.subject)!}
          />
        )}
        {note.level?.trim() && (
          <DetailRow icon="layers" label="Level" value={note.level.trim()} />
        )}
        {note.schoolClass?.trim() && (
          <DetailRow
            icon="users"
            label="Class"
            value={note.schoolClass.trim()}
          />
        )}
        {note.pages !== undefined && String(note.pages).trim() && (
          <DetailRow
            icon="file-text"
            label="Pages"
            value={String(note.pages)}
          />
        )}
        {sourceBooks && (
          <DetailRow icon="book" label="Source books" value={sourceBooks} />
        )}
        {dateText && (
          <DetailRow icon="clock" label="Last updated" value={dateText} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
  },
  heading: {
    fontSize: 21,
    fontWeight: "600",
    marginBottom: 12,
  },
  details: {
    borderTopWidth: 1,
  },
  row: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    gap: 10,
  },
  label: {
    width: 100,
    fontSize: 14,
  },
  value: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    textAlign: "right",
  },
});
