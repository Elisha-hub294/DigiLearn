import { Feather as Icon } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, spacing } from "../../constants/theme";

type SearchBarProps = {
  value?: string;
  onChangeText?: (text: string) => void;
  onSubmit?: () => void;
  onClear?: () => void;
  placeholder?: string;
  accessibilityLabel?: string;
  onPress?: () => void;
  isInput?: boolean;
  showBack?: boolean;
  autoFocus?: boolean;
  containerStyle?: any;
  inputContainerStyle?: any;
  inputStyle?: any;
  placeholderTextColor?: string;
  searchIconColor?: string;
  variant?: "default" | "topic";
};

export function SearchBar({
  value = "",
  onChangeText,
  onSubmit,
  onClear,
  placeholder = "Search by subject, title, author, teacher...",
  accessibilityLabel = "Search input",
  onPress,
  isInput = false,
  showBack = false,
  autoFocus = false,
  containerStyle,
  inputContainerStyle,
  inputStyle,
  placeholderTextColor = "#8A8A8A",
  searchIconColor = "#8A8A8A",
  variant = "default",
}: SearchBarProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push("/search" as never);
    }
  };

  if (isInput) {
    return (
      <View style={styles.inputRow}>
        {showBack && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Icon name="arrow-left" size={22} color="#111111" />
          </Pressable>
        )}

        <View
          style={[
            styles.inputContainer,
            variant === "topic" && styles.topicInputContainer,
            inputContainerStyle,
          ]}
        >
          <TextInput
            accessibilityLabel={accessibilityLabel}
            value={value}
            onChangeText={onChangeText}
            onSubmitEditing={onSubmit}
            placeholder={placeholder}
            placeholderTextColor={placeholderTextColor}
            style={[styles.input, inputStyle]}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus={autoFocus}
          />
          {value.length > 0 && onClear && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear text"
              onPress={onClear}
              style={styles.clearBtn}
            >
              <Icon name="x" size={16} color="#8A8A8A" />
            </Pressable>
          )}
          {onSubmit && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Submit search"
              onPress={onSubmit}
              style={styles.submitBtn}
            >
              <Icon name="search" size={18} color="#FFFFFF" />
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={handlePress}
      style={styles.container}
    >
      <Icon name="search" size={18} color="#8A8A8A" />
      <Text style={styles.placeholderText} numberOfLines={1}>
        {placeholder}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    height: 45,
    paddingHorizontal: spacing.md,
    borderRadius: 100,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#D9D9D9",
  },
  placeholderText: {
    flex: 1,
    marginLeft: spacing.sm,
    color: "#8A8A8A",
    fontSize: 14,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginVertical: spacing.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    paddingLeft: spacing.md,
    paddingRight: 4,
    borderRadius: 28,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  topicInputContainer: {
    height: 48,
    borderRadius: 24,
    borderColor: "#D9D9D9",
    backgroundColor: colors.white,
  },
  searchIcon: {
    marginRight: 6,
  },
  input: {
    flex: 1,
    height: "100%",
    color: colors.primary,
    fontSize: 12,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 6,
    marginRight: 4,
  },
  submitBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
