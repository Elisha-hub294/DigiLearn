import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import fallbackAvatar from "../../assets/images/tr-default.png";
import { AssistantHeader } from "../components/assistant/AssistantHeader";
import { ChatBubble } from "../components/assistant/ChatBubble";
import { ConversationList } from "../components/assistant/ConversationList";
import { MessageComposer } from "../components/assistant/MessageComposer";
import { PromptChip } from "../components/assistant/PromptChip";
import { TypingIndicator } from "../components/assistant/TypingIndicator";
import { colors, radius, spacing } from "../constants/theme";
import { getAssistantContent } from "../services/aiAssistantService";
import {
    generateAssistantReply,
    getCachedConversations,
    loadConversationHistory,
    persistConversation,
    type ChatMessage,
    type ConversationRecord,
} from "../services/assistantChatService";

export default function AssistantScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [gifUri, setGifUri] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [assistantAvatar, setAssistantAvatar] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    let active = true;

    const loadScreenData = async () => {
      try {
        const [content, cachedConversations] = await Promise.all([
          getAssistantContent(),
          getCachedConversations(),
        ]);
        if (!active) {
          return;
        }

        setAssistantAvatar(content.avatar ?? null);
        setSuggestions(content.messages.slice(0, 6));
        setGifUri(content.avatar ?? null);
        const history = await loadConversationHistory();
        if (active) {
          setConversations(history);
        }
        if (cachedConversations.length > 0 && active) {
          setConversations(cachedConversations);
        }
      } catch (error) {
        if (active) {
          setSuggestions([
            "Explain Osmosis",
            "Revise Quadratic Equations",
            "Help me prepare for UNEB",
          ]);
          setGifUri(null);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadScreenData();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      requestAnimationFrame(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [messages, isTyping]);

  const hasStartedConversation = messages.length > 0;
  const contentMaxWidth = useMemo(
    () => (Platform.OS === "web" ? 760 : undefined),
    [],
  );

  const createConversationTitle = (prompt: string) => {
    const words = prompt.trim().split(/\s+/).slice(0, 4).join(" ");
    return words.length > 0 ? words : "Learning";
  };

  const handleSend = async (promptOverride?: string) => {
    const prompt = (promptOverride ?? message).trim();
    if (!prompt) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: prompt,
      createdAt: new Date().toISOString(),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setMessage("");
    setErrorText(null);
    setIsTyping(true);

    try {
      const reply = await generateAssistantReply(prompt, nextMessages);
      const assistantMessage: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        content: reply,
        createdAt: new Date().toISOString(),
      };

      const conversationMessages = [...nextMessages, assistantMessage];
      setMessages(conversationMessages);
      setIsTyping(false);

      const conversationPayload: ConversationRecord = {
        id: activeConversationId ?? `local-${Date.now()}`,
        title: activeConversationId
          ? (conversations.find((item) => item.id === activeConversationId)
              ?.title ?? createConversationTitle(prompt))
          : createConversationTitle(prompt),
        firstMessage: prompt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: conversationMessages,
      };

      const savedConversation = await persistConversation(conversationPayload);
      setActiveConversationId(savedConversation.id);
      setConversations((previous) => [
        savedConversation,
        ...previous.filter((item) => item.id !== savedConversation.id),
      ]);
    } catch (error) {
      setIsTyping(false);
      setErrorText(
        "I couldn't generate a response right now. Please check your connection and try again.",
      );
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    const selectedConversation = conversations.find(
      (entry) => entry.id === conversationId,
    );
    if (!selectedConversation) {
      return;
    }

    setActiveConversationId(conversationId);
    setMessages(selectedConversation.messages);
    setErrorText(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <View
          style={[
            styles.content,
            contentMaxWidth ? { maxWidth: contentMaxWidth } : null,
          ]}
        >
          <AssistantHeader title="DigiLearn AI" subtitle="Study support" />

          {isLoading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={styles.loadingText}>
                Preparing your study space...
              </Text>
            </View>
          ) : (
            <>
              {!hasStartedConversation ? (
                <View style={styles.heroArea}>
                  <View style={styles.avatarGlow} />
                  <Image
                    source={gifUri ? { uri: gifUri } : fallbackAvatar}
                    style={styles.avatar}
                    contentFit="contain"
                  />
                  <Text style={styles.greeting}>How can I help you today?</Text>
                  <View style={styles.suggestionWrap}>
                    {suggestions.map((suggestion) => (
                      <PromptChip
                        key={suggestion}
                        label={suggestion}
                        onPress={() => handleSend(suggestion)}
                      />
                    ))}
                  </View>
                </View>
              ) : (
                <View style={styles.chatArea}>
                  <ScrollView
                    ref={scrollViewRef}
                    style={styles.messagesArea}
                    contentContainerStyle={styles.messagesContent}
                  >
                    {messages.map((item) => (
                      <ChatBubble
                        key={item.id}
                        role={item.role}
                        message={item.content}
                        avatar={assistantAvatar}
                      />
                    ))}
                    {isTyping ? (
                      <View style={styles.typingRow}>
                        <View style={styles.avatarWrapSmall}>
                          <Image
                            source={
                              assistantAvatar
                                ? { uri: assistantAvatar }
                                : fallbackAvatar
                            }
                            style={styles.avatarSmall}
                            contentFit="contain"
                          />
                        </View>
                        <View style={styles.typingBubble}>
                          <TypingIndicator />
                        </View>
                      </View>
                    ) : null}
                  </ScrollView>
                </View>
              )}

              {!hasStartedConversation ? (
                <View style={styles.conversationSection}>
                  <ConversationList
                    conversations={conversations}
                    onSelectConversation={handleSelectConversation}
                  />
                </View>
              ) : null}

              {errorText ? (
                <View style={styles.errorCard}>
                  <Text style={styles.errorText}>{errorText}</Text>
                  <Pressable
                    onPress={() => handleSend(message || "Explain Osmosis")}
                    style={styles.retryButton}
                  >
                    <Text style={styles.retryText}>Retry</Text>
                  </Pressable>
                </View>
              ) : null}
            </>
          )}

          <MessageComposer
            value={message}
            onChangeText={setMessage}
            onSend={() => handleSend()}
            disabled={message.trim().length === 0 || isTyping}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    width: "100%",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    alignSelf: "center",
  },
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.subtitle,
  },
  heroArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
  },
  avatarGlow: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(59,130,246,0.1)",
    top: 24,
  },
  avatar: {
    width: 180,
    height: 180,
  },
  greeting: {
    color: colors.primary,
    fontSize: 30,
    fontWeight: "700",
    textAlign: "center",
    marginTop: spacing.md,
  },
  suggestionWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: spacing.lg,
  },
  chatArea: {
    flex: 1,
    minHeight: 240,
  },
  messagesArea: {
    flex: 1,
  },
  messagesContent: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  typingRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: spacing.md,
  },
  avatarWrapSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: "hidden",
    marginRight: spacing.sm,
  },
  avatarSmall: {
    width: 32,
    height: 32,
  },
  typingBubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: "#F3F4F6",
    borderRadius: 22,
  },
  conversationSection: {
    marginTop: spacing.md,
  },
  errorCard: {
    backgroundColor: "#FEF2F2",
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 13,
    lineHeight: 20,
  },
  retryButton: {
    alignSelf: "flex-start",
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  retryText: {
    color: colors.white,
    fontWeight: "700",
  },
});
