import { GoogleGenAI } from "@google/genai";
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

import { auth, db } from "../../firebaseConfig";
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
    return [];
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
    const conversationRef = doc(
      conversationCollection,
      conversation.id.startsWith("local-") ? undefined : conversation.id,
    );
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
    return conversation;
  }
}

export async function updateConversation(conversation: ConversationRecord) {
  return persistConversation(conversation);
}

export async function generateAssistantReply(
  prompt: string,
  previousMessages: ChatMessage[],
) {
  const content = await getAssistantContent();
  const knowledge = await getDigiLearnKnowledgeContext();
  const apiKey = content.geminiApiKey;

  if (!apiKey) {
    throw new Error(
      "DigiLearn AI isn't available right now. Please try again later.",
    );
  }

  const history = previousMessages
    .slice(-8)
    .map(
      (message) =>
        `${message.role === "user" ? "User" : "Assistant"}: ${message.content}`,
    )
    .join("\n");
  const knowledgeBlock = knowledge.appOverview
    ? `DigiLearn application knowledge from Firestore:\n${knowledge.appOverview}`
    : 'DigiLearn application knowledge from Firestore: No app overview information is available in the Firestore "ai knowledge" collection yet.';

  const systemPrompt = [
    "You are DigiLearn's academic study assistant.",
    "Use the Firestore knowledge block as the primary source for DigiLearn-specific information and capabilities.",
    "Do not invent DigiLearn database information. If the requested information or resource is not present in the provided knowledge or other DigiLearn Firestore data, say clearly that it could not be found.",
    "When appropriate, suggest DigiLearn resources in a concise way.",
    "Do not mention any developer related thing to the user.",
    "Format with markdown and short paragraphs.",
    "When writing mathematical or scientific equations, indices, powers, exponents, or chemical formulas (e.g. x², 10⁻³, H₂O, aₙ), use proper unicode superscript and subscript index characters instead of carets (^) or underscores (_).",
    "Format each equation on its own line using block math notation ($$ ... $$) or code blocks so it renders as a dedicated equation card in the UI. For inline math/variables, wrap them in single dollar signs ($ ... $) or backticks.",
    "Use clear symbols (e.g. superscripts ², ³, ⁿ, ⁻¹, subscripts ₁, ₂, ₙ, ±, √, ÷, ×, π, Δ, →) and format multi-step derivations line by line.",
    knowledgeBlock,
  ].join(" ");

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `${systemPrompt}\n\nConversation:\n${history}\n\nUser prompt:\n${prompt}`,
    });
    const text = response.text ?? ASSISTANT_UNAVAILABLE_MESSAGE;
    return text;
  } catch (error) {
    throw new Error(getAssistantErrorMessage(error));
  }
}
