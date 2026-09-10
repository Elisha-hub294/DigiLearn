import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { Book } from "./bookTypes";

type InfoItem = { icon: keyof typeof Feather.glyphMap; label: string };

export function BookQuickInfo({ book }: { book: Book }) {
  const { colors } = useTheme();
  const items: InfoItem[] = [
    book.pages ? { icon: "file-text", label: `${book.pages} pages` } : null,
    book.edition ? { icon: "layers", label: book.edition } : null,
    book.year ? { icon: "calendar", label: book.year } : null,
  ].filter((item): item is InfoItem => Boolean(item));

  if (!items.length) return null;

  return (
    <View style={[styles.row, { borderColor: colors.border }]}>
      {items.map((item) => (
        <View key={item.label} style={styles.item}>
          <Feather name={item.icon} size={16} color={colors.primary} />
          <Text
            style={[styles.label, { color: colors.text }]}
            numberOfLines={1}
          >
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  item: { flexDirection: "row", alignItems: "center", gap: 6 },
  label: { fontSize: 13, fontWeight: "600" },
});
