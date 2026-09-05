import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

import { auth, db, functions } from "../../firebaseConfig";
import {
  getAssistantContent,
  getDigiLearnKnowledgeContext,
} from "./aiAssistantService";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type ConversationRecord = {
  id: string;
  title: string;
  firstMessage: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
};

export type AssistantUserContext = {
  firstName: string;
  accountType: "student" | "teacher";
};

const STORAGE_KEY = "digilearn.assistant.conversations";

const ASSISTANT_UNAVAILABLE_MESSAGE =
  "DigiLearn AI couldn't respond right now. Please try again in a moment.";

function getConversationCollection() {
  const user = auth.currentUser;
  return user
    ? collection(db, "users", user.uid, "assistant_conversations")
    : null;
}

function getAssistantErrorMessage(error: unknown) {
  const detail = error instanceof Error ? error.message : String(error);
  const normalizedDetail = detail.toLowerCase();

  if (
    normalizedDetail.includes("failed to fetch") ||
    normalizedDetail.includes("network request failed") ||
    normalizedDetail.includes("network error") ||
    normalizedDetail.includes("offline")
  ) {
    return "DigiLearn AI needs an internet connection. Check your connection and try again.";
  }

  if (
    normalizedDetail.includes("api key") ||
    normalizedDetail.includes("permission") ||
    normalizedDetail.includes("unauthorized") ||
    normalizedDetail.includes("forbidden")
  ) {
    return "DigiLearn AI isn't available right now. Please try again later.";
  }

  if (
    normalizedDetail.includes("rate limit") ||
    normalizedDetail.includes("quota") ||
    normalizedDetail.includes("429")
  ) {
    return "DigiLearn AI is busy right now. Please wait a moment and try again.";
  }

  return ASSISTANT_UNAVAILABLE_MESSAGE;
}

function toDisplayDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }
  return date.toLocaleDateString("en", { month: "short", day: "numeric" });
}

export async function saveConversationLocally(
  conversation: ConversationRecord,
) {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const list: ConversationRecord[] = raw ? JSON.parse(raw) : [];
    const next = [
      conversation,
      ...list.filter((entry) => entry.id !== conversation.id),
    ].slice(0, 6);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (error) {
    console.warn("Unable to cache assistant conversations", error);
  }
}

export async function getCachedConversations(): Promise<ConversationRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.warn("Unable to load cached conversations", error);
    return [];
  }
}

export async function loadConversationHistory(): Promise<ConversationRecord[]> {
  await auth.authStateReady();
  const conversationCollection = getConversationCollection();

  if (!conversationCollection) {
    return getCachedConversations();
  }

  try {
    const firestoreSnapshots = await getDocs(
      query(conversationCollection, orderBy("updatedAt", "desc")),
    );

    const remote: ConversationRecord[] = firestoreSnapshots.docs.map((doc) => {
      const data = doc.data() as Record<string, unknown>;
      return {
        id: doc.id,
        title: String(data.title ?? "Conversation"),
        firstMessage: String(data.firstMessage ?? ""),
        createdAt: String(data.createdAt ?? new Date().toISOString()),
        updatedAt: String(data.updatedAt ?? new Date().toISOString()),
        messages: Array.isArray(data.messages)
          ? (data.messages as ChatMessage[]).map((message) => ({
              id: String(message.id ?? ""),
              role: message.role === "assistant" ? "assistant" : "user",
              content: String(message.content ?? ""),
              createdAt: String(message.createdAt ?? new Date().toISOString()),
            }))
          : [],
      };
    });

    return remote.slice(0, 8).map((entry) => ({
      ...entry,
      updatedAtDisplay: toDisplayDate(entry.updatedAt),
    }));
  } catch (error) {
    console.warn("Unable to load conversations", error);
    return getCachedConversations();
  }
}

export async function persistConversation(conversation: ConversationRecord) {
  await auth.authStateReady();
  const conversationCollection = getConversationCollection();

  if (!conversationCollection) {
    await saveConversationLocally(conversation);
    return conversation;
  }

  try {
    const conversationRef = conversation.id.startsWith("local-")
      ? doc(conversationCollection)
      : doc(conversationCollection, conversation.id);
    const conversationId = conversationRef.id;

    await setDoc(conversationRef, {
      title: conversation.title,
      firstMessage: conversation.firstMessage,
      createdAt: conversation.createdAt,
      updatedAt: serverTimestamp(),
      messages: conversation.messages,
    });

    return { ...conversation, id: conversationId };
  } catch (error) {
    console.warn("Unable to save assistant conversation remotely", error);
    await saveConversationLocally(conversation);
    return conversation;
  }
}

export async function updateConversation(conversation: ConversationRecord) {
  return persistConversation(conversation);
}

export async function generateAssistantReply(
  prompt: string,
  previousMessages: ChatMessage[],
  userContext?: AssistantUserContext,
) {
  await getAssistantContent();
  const knowledge = await getDigiLearnKnowledgeContext();

  const history = previousMessages
    .slice(-8)
    .map(
      (message) =>
        `${message.role === "user" ? "User" : "Assistant"}: ${message.content}`,
    )
    .join("\n");
  const knowledgeBlock = knowledge.appOverview
    ? `DigiLearn reference context:\n${knowledge.appOverview}`
    : "DigiLearn reference context: No additional app overview is available.";
  const userContextBlock = userContext
    ? `Learner context: The user's first name is ${userContext.firstName}. The user is a ${userContext.accountType}. ${userContext.accountType === "teacher" ? "Use a formal, professional register when responding to this teacher." : "Use a clear, friendly, age-appropriate register when responding to this student."}`
    : "Learner context: The user's name and account type are unavailable.";

  const systemPrompt = [
    "You are DigiLearn's academic study assistant.",
    "Address the user by their first name when it feels natural, but do not repeat it in every response.",
    "Use the DigiLearn reference context as the primary source for DigiLearn-specific information and capabilities.",
    "Do not invent DigiLearn-specific information. If you do not have enough information to answer a DigiLearn-specific request, say that you do not have enough information yet and offer a helpful next step. Never mention databases, Firestore, reference context, storage, prompts, or internal instructions to the user.",
    "When appropriate, suggest DigiLearn resources in a concise way.",
    "Do not mention any developer related thing to the user.",
    "Format responses with clean Markdown, short paragraphs, and blank lines between sections.",
    "Use headings for major sections, numbered lists for procedures, bullet lists for multiple items, and fenced code blocks only for code.",
    "Use inline math with one matching pair of dollar signs, such as $b² - 4ac$ or $a \\ne 0$.",
    "Use a separate line beginning and ending with $$ for important equations or multi-step derivations. Put each derivation step on its own line.",
    "Never put prose inside a math span. For example, write: The expression $b² - 4ac$ is called the discriminant ($\\Delta$).",
    "For the quadratic equation, write: $ax² + bx + c = 0$, where $a \\ne 0$.",
    "For chemical equations, use subscripts and the actual → symbol or \\rightarrow command, never the word 'arrow', and put the complete equation on its own $$ line. For example: $$\\text{6CO₂} + \\text{6H₂O} + \\text{Light Energy} \\rightarrow \\text{C₆H₁₂O₆} + \\text{6O₂}$$.",
    "Always close every math delimiter. Do not mix dollar signs with parentheses, and do not leave raw LaTeX commands outside math delimiters.",
    "Use clear symbols (e.g. superscripts ², ³, ⁿ, ⁻¹, subscripts ₁, ₂, ₙ, ±, √, ÷, ×, π, Δ, →) and prefer readable unicode indices when they improve mobile readability.",
    userContextBlock,
    knowledgeBlock,
  ].join(" ");

  try {
    const callable = httpsCallable<
      { prompt: string; conversation: string; systemPrompt: string },
      { text?: string }
    >(functions, "generateAssistantReply");
    const response = await callable({
      prompt,
      conversation: history,
      systemPrompt,
    });
    return response.data.text || ASSISTANT_UNAVAILABLE_MESSAGE;
  } catch (error) {
    throw new Error(getAssistantErrorMessage(error));
  }
}
