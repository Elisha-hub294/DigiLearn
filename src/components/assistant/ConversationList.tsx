import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing } from "../../constants/theme";

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
          style={styles.card}
        >
          <Text style={styles.cardTitle}>{conversation.title}</Text>
          <Text style={styles.cardBody} numberOfLines={2}>
            {conversation.firstMessage}
          </Text>
          <Text style={styles.cardMeta}>{conversation.updatedAt}</Text>
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
