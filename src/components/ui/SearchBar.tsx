import { Feather as Icon } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import type { RefObject } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { spacing } from "../../constants/theme";
import { useTheme } from "../../contexts/ThemeContext";
import type { SearchCategory } from "../../hooks/useGlobalSearch";

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
  inputRef?: RefObject<TextInput | null>;
  containerStyle?: any;
  inputContainerStyle?: any;
  inputStyle?: any;
  placeholderTextColor?: string;
  searchIconColor?: string;
  variant?: "default" | "topic";
  onBack?: () => void;
  category?: SearchCategory;
  source?: "library";
  hideChips?: boolean;
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
  inputRef,
  containerStyle,
  inputContainerStyle,
  inputStyle,
  placeholderTextColor = "#8A8A8A",
  searchIconColor = "#8A8A8A",
  variant = "default",
  onBack,
  category,
  source,
  hideChips = false,
}: SearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { colors } = useTheme();
  const resolvedPlaceholderColor =
    placeholderTextColor === "#8A8A8A" ? colors.subtitle : placeholderTextColor;
  const resolvedSearchIconColor =
    searchIconColor === "#8A8A8A" ? colors.subtitle : searchIconColor;

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push({
        pathname: "/(search)/search",
        params: {
          ...(pathname && pathname !== "/(search)/search"
            ? { returnTo: pathname }
            : {}),
          ...(category ? { category } : {}),
          ...(source ? { source } : {}),
          ...(hideChips ? { hideChips: "true" } : {}),
        },
      } as never);
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
            onPress={() => {
              if (onBack) {
                onBack();
              } else if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/" as never);
              }
            }}
            style={styles.backButton}
          >
            <Icon name="arrow-left" size={22} color={colors.text} />
          </Pressable>
        )}

        <View
          style={[
            styles.inputContainer,
            { backgroundColor: colors.white },
            {
              borderColor: variant === "topic" ? colors.border : colors.primary,
            },
            variant === "topic" && styles.topicInputContainer,
            inputContainerStyle,
          ]}
        >
          <TextInput
            ref={inputRef}
            accessibilityLabel={accessibilityLabel}
            value={value}
            onChangeText={onChangeText}
            onSubmitEditing={onSubmit}
            placeholder={placeholder}
            placeholderTextColor={resolvedPlaceholderColor}
            style={[styles.input, { color: colors.text }, inputStyle]}
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
              <Icon name="x" size={16} color={colors.subtitle} />
            </Pressable>
          )}
          {onSubmit && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Submit search"
              onPress={onSubmit}
              style={[styles.submitBtn, { backgroundColor: colors.primary }]}
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
      style={[
        styles.container,
        { backgroundColor: colors.white, borderColor: colors.border },
      ]}
    >
      <Icon name="search" size={18} color={resolvedSearchIconColor} />
      <Text
        style={[styles.placeholderText, { color: colors.subtitle }]}
        numberOfLines={1}
      >
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
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  placeholderText: {
    flex: 1,
    marginLeft: spacing.sm,
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
    borderWidth: 1.5,
  },
  topicInputContainer: {
    height: 48,
    borderRadius: 24,
  },
  searchIcon: {
    marginRight: 6,
  },
  input: {
    flex: 1,
    height: "100%",
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
    alignItems: "center",
    justifyContent: "center",
  },
});
