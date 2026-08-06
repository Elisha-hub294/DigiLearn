import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing } from "../../constants/theme";

function formatConversationTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const now = new Date();
  const diffMs = now.getTime() - parsed.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 24) {
    return parsed.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) {
    return "Yesterday";
  }

  return parsed.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

export type ConversationSummary = {
  id: string;
  title: string;
  firstMessage: string;
  updatedAt: string;
};

export function ConversationList({
  conversations,
  onSelectConversation,
}: {
  conversations: ConversationSummary[];
  onSelectConversation: (conversationId: string) => void;
}) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>Recent conversations</Text>
      {conversations.map((conversation) => (
        <Pressable
          key={conversation.id}
          accessibilityRole="button"
          onPress={() => onSelectConversation(conversation.id)}
          style={({ pressed, hovered }) => [
            styles.card,
            pressed && styles.cardPressed,
            hovered && styles.cardHovered,
          ]}
        >
          <Text style={styles.cardTitle}>{conversation.title}</Text>
          <Text style={styles.cardBody} numberOfLines={2}>
            {conversation.firstMessage}
          </Text>
          <Text style={styles.cardMeta}>
            {formatConversationTime(conversation.updatedAt)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: spacing.lg,
    width: "100%",
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: spacing.md,
  },
  card: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.lightBackground,
    marginBottom: spacing.sm,
  },
  cardHovered: {
    backgroundColor: colors.white,
    transform: [{ scale: 1.01 }],
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.95,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  cardBody: {
    color: colors.subtitle,
    fontSize: 13,
    marginTop: 4,
  },
  cardMeta: {
    color: colors.primary,
    fontSize: 12,
    marginTop: 6,
  },
});
