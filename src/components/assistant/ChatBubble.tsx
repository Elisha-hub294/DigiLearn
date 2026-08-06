import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import Markdown from "react-native-markdown-display";

import fallbackAvatar from "../../../assets/images/panda.png";
import { colors, spacing } from "../../constants/theme";

export function ChatBubble({
  role,
  message,
  avatar,
}: {
  role: "user" | "assistant";
  message: string;
  avatar?: string | null;
}) {
  const isUser = role === "user";

  return (
    <View
      style={[styles.wrap, isUser ? styles.userWrap : styles.assistantWrap]}
    >
      {!isUser ? (
        <View style={styles.avatarWrap}>
          <Image
            source={avatar ? { uri: avatar } : fallbackAvatar}
            style={styles.avatar}
            contentFit="cover"
          />
        </View>
      ) : null}

      <View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.assistantBubble,
        ]}
      >
        {isUser ? (
          <Text style={styles.userText}>{message}</Text>
        ) : (
          <Markdown style={markdownStyles}>{message}</Markdown>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: spacing.md,
    maxWidth: "100%",
  },
  userWrap: {
    justifyContent: "flex-end",
  },
  assistantWrap: {
    justifyContent: "flex-start",
  },
  avatarWrap: {
    width: 32,
    height: 32,
    overflow: "hidden",
    marginRight: spacing.sm,
  },
  avatar: {
    width: 32,
    height: 32,
  },
  bubble: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 22,
    maxWidth: "80%",
  },
  userBubble: {
    backgroundColor: colors.primary,
  },
  assistantBubble: {
    backgroundColor: "#ededf5",
  },
  userText: {
    color: colors.white,
    fontSize: 14,
    lineHeight: 21,
  },
});

const markdownStyles: Record<string, any> = {
  body: {
    color: "#2e2e2e",
    fontSize: 14,
    lineHeight: 22,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 6,
  },
  strong: {
    fontWeight: "600",
    color: "#001b5a",
  },
  bullet_list: {
    marginBottom: 6,
  },
  ordered_list: {
    marginBottom: 6,
  },
  code_inline: {
    backgroundColor: "#E5E7EB",
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
    color: "#111827",
  },
  code_block: {
    backgroundColor: "#E5E7EB",
    borderRadius: 8,
    padding: 8,
    marginVertical: 6,
  },
  table: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
  },
  table_header: {
    backgroundColor: "#E5E7EB",
  },
};
