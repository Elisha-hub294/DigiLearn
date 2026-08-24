import {
  useFocusEffect,
  useLocalSearchParams,
  useNavigation,
  useRouter,
} from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import fallbackAvatar from "../../assets/images/panda.png";
import { AssistantHeader } from "../components/assistant/AssistantHeader";
import { ChatBubble } from "../components/assistant/ChatBubble";
import { ConversationList } from "../components/assistant/ConversationList";
import { MessageComposer } from "../components/assistant/MessageComposer";
import { PromptChip } from "../components/assistant/PromptChip";
import { TypingIndicator } from "../components/assistant/TypingIndicator";
import { colors, radius, spacing } from "../constants/theme";
import {
  getAssistantContent,
  isAssistantEnabled,
} from "../services/aiAssistantService";
import {
  generateAssistantReply,
  loadConversationHistory,
  persistConversation,
  type ChatMessage,
  type ConversationRecord,
} from "../services/assistantChatService";

export default function AssistantScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ initialPrompt?: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [gifUri, setGifUri] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [message, setMessage] = useState(
    typeof params.initialPrompt === "string" ? params.initialPrompt : "",
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [failedPrompt, setFailedPrompt] = useState<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [assistantAvatar, setAssistantAvatar] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (
      typeof params.initialPrompt === "string" &&
      params.initialPrompt.trim()
    ) {
      setMessage(params.initialPrompt.trim());
    }
  }, [params.initialPrompt]);

  useEffect(() => {
    let active = true;

    const loadScreenData = async () => {
      try {
        const enabled = await isAssistantEnabled();
        if (!enabled) {
          if (active) {
            router.replace("/" as never);
          }
          return;
        }

        const content = await getAssistantContent(true);
        if (!active) {
          return;
        }

        const resolvedAvatar = content.avatar ?? fallbackAvatar;
        setAssistantAvatar(resolvedAvatar);
        setSuggestions(content.suggestions ?? content.messages.slice(0, 6));
        setGifUri(typeof resolvedAvatar === "string" ? resolvedAvatar : null);
        const history = await loadConversationHistory();
        if (active) {
          setConversations(history);
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
    setFailedPrompt(null);
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
      const message =
        error instanceof Error && error.message
          ? error.message
          : "DigiLearn AI couldn't respond right now. Please try again in a moment.";
      setErrorText(message);
      setFailedPrompt(prompt);
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
    setFailedPrompt(null);
  };

  const handleBackToMain = () => {
    if (hasStartedConversation) {
      setMessages([]);
      setMessage("");
      setIsTyping(false);
      setErrorText(null);
      setFailedPrompt(null);
      setActiveConversationId(null);
      return;
    }

    router.back();
  };

  useFocusEffect(
    useCallback(() => {
      const handleSystemBack = () => {
        if (!hasStartedConversation) {
          return false;
        }

        handleBackToMain();
        return true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        handleSystemBack,
      );
      const unsubscribe = navigation.addListener("beforeRemove", (event) => {
        if (!hasStartedConversation) {
          return;
        }

        event.preventDefault();
        handleBackToMain();
      });

      return () => {
        subscription.remove();
        unsubscribe();
      };
    }, [hasStartedConversation, navigation]),
  );

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
          <AssistantHeader
            title="DigiLearn AI"
            subtitle="Study support"
            onBack={handleBackToMain}
          />

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
                <ScrollView
                  style={styles.bodyScroll}
                  contentContainerStyle={styles.bodyContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.heroArea}>
                    <View style={styles.avatarGlow} />
                    <Image
                      source={gifUri ? { uri: gifUri } : fallbackAvatar}
                      style={styles.avatar}
                      resizeMode="contain"
                    />
                    <Text style={styles.greeting}>
                      How can I help you today?
                    </Text>
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

                  <View style={styles.conversationSection}>
                    <ConversationList
                      conversations={conversations}
                      onSelectConversation={handleSelectConversation}
                    />
                  </View>
                </ScrollView>
              ) : (
                <View style={styles.chatArea}>
                  <ScrollView
                    ref={scrollViewRef}
                    style={styles.messagesArea}
                    contentContainerStyle={styles.messagesContent}
                    showsVerticalScrollIndicator={false}
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
                              assistantAvatar &&
                              typeof assistantAvatar === "string"
                                ? { uri: assistantAvatar }
                                : fallbackAvatar
                            }
                            style={styles.avatarSmall}
                            resizeMode="contain"
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

              {errorText ? (
                <View style={styles.errorCard}>
                  <Text style={styles.errorText}>{errorText}</Text>
                  <Pressable
                    onPress={() => handleSend(failedPrompt ?? undefined)}
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
  bodyScroll: {
    flex: 1,
    minHeight: 0,
  },
  bodyContent: {
    flexGrow: 1,
    paddingBottom: spacing.lg,
  },
  heroArea: {
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
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
    width: "100%",
    maxWidth: 320,
    paddingHorizontal: spacing.md,
    flexShrink: 1,
  },
  suggestionWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: spacing.md,
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
    width: "100%",
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
