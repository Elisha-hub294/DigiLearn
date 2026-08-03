import { Feather as Icon } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import React from "react";
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
  onBackPress?: () => void;
  isInput?: boolean;
  showBack?: boolean;
  autoFocus?: boolean;
  fromScreen?: string;
};

export function SearchBar({
  value = "",
  onChangeText,
  onSubmit,
  onClear,
  placeholder = "Search by subject, title, author, teacher...",
  accessibilityLabel = "Search input",
  onPress,
  onBackPress,
  isInput = false,
  showBack = false,
  autoFocus = false,
  fromScreen,
}: SearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const getOriginScreen = () => {
    if (fromScreen) return fromScreen;
    if (pathname.includes("library")) return "/library";
    if (pathname.includes("videos")) return "/videos";
    return "/";
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      const origin = getOriginScreen();
      router.push({
        pathname: "/search",
        params: { fromScreen: origin },
      } as never);
    }
  };

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
      return;
    }

    const targetScreen = getOriginScreen();

    if (targetScreen === "/library") {
      router.navigate("/library" as never);
    } else if (targetScreen === "/videos") {
      router.navigate("/videos" as never);
    } else if (targetScreen === "/") {
      router.navigate("/" as never);
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.navigate("/" as never);
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
            onPress={handleBack}
            style={styles.backButton}
          >
            <Icon name="arrow-left" size={22} color="#111111" />
          </Pressable>
        )}

        <View style={styles.inputContainer}>
          <Icon name="search" size={18} color="#8A8A8A" style={styles.searchIcon} />
          <TextInput
            accessibilityLabel={accessibilityLabel}
            value={value}
            onChangeText={onChangeText}
            onSubmitEditing={onSubmit}
            placeholder={placeholder}
            placeholderTextColor="#8A8A8A"
            style={styles.input}
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
    height: 52,
    paddingHorizontal: spacing.md,
    borderRadius: 100,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#D9D9D9",
    marginBottom: spacing.md,
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
    gap: 10,
    marginBottom: spacing.md,
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
    borderColor: "#111111",
  },
  searchIcon: {
    marginRight: 6,
  },
  input: {
    flex: 1,
    height: "100%",
    color: "#111111",
    fontSize: 15,
    fontWeight: "500",
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
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
});
