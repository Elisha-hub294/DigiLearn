import { GoogleGenerativeAI } from "@google/generative-ai";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    addDoc,
    collection,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
} from "firebase/firestore";

import { db } from "../../firebaseConfig";
import { getAssistantContent } from "./aiAssistantService";

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
  try {
    const [cached, firestoreSnapshots] = await Promise.all([
      getCachedConversations(),
      getDocs(
        query(
          collection(db, "assistant_conversations"),
          orderBy("updatedAt", "desc"),
        ),
      ),
    ]);

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

    const merged = [
      ...remote,
      ...cached.filter((entry) => !remote.some((item) => item.id === entry.id)),
    ];
    return merged.slice(0, 8).map((entry) => ({
      ...entry,
      updatedAtDisplay: toDisplayDate(entry.updatedAt),
    }));
  } catch (error) {
    console.warn("Unable to load conversations", error);
    return getCachedConversations();
  }
}

export async function persistConversation(conversation: ConversationRecord) {
  try {
    const docRef = await addDoc(collection(db, "assistant_conversations"), {
      title: conversation.title,
      firstMessage: conversation.firstMessage,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      messages: conversation.messages,
    });

    await updateDoc(docRef, {
      updatedAt: serverTimestamp(),
    });

    await saveConversationLocally({ ...conversation, id: docRef.id });
    return { ...conversation, id: docRef.id };
  } catch (error) {
    await saveConversationLocally(conversation);
    return conversation;
  }
}

export async function updateConversation(conversation: ConversationRecord) {
  try {
    if (conversation.id.startsWith("local-")) {
      await saveConversationLocally(conversation);
      return conversation;
    }

    await saveConversationLocally(conversation);
    return conversation;
  } catch (error) {
    await saveConversationLocally(conversation);
    return conversation;
  }
}

export async function generateAssistantReply(
  prompt: string,
  previousMessages: ChatMessage[],
) {
  const content = await getAssistantContent();
  const apiKey = content.geminiApiKey;

  if (!apiKey) {
    throw new Error("Gemini API key is not configured.");
  }

  const history = previousMessages
    .slice(-8)
    .map(
      (message) =>
        `${message.role === "user" ? "User" : "Assistant"}: ${message.content}`,
    )
    .join("\n");
  const systemPrompt = [
    "You are DigiLearn's academic study assistant.",
    "Help with math, biology, chemistry, physics, ICT, geography, history, English, literature, economics, entrepreneurship, art, exams, revision, study planning, notes, past papers, marking guides, textbooks, courses, and teacher explanations.",
    "Refuse unrelated requests politely and redirect to academic learning.",
    "When appropriate, suggest DigiLearn resources in a concise way.",
    "Format with markdown and short paragraphs.",
  ].join(" ");

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const response = await model.generateContent(`${systemPrompt}\n\nConversation:\n${history}\n\nUser prompt:\n${prompt}`);

    const text =
      response.text ??
      "I couldn't generate a response right now. Please check your connection and try again.";
    return text;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(
      detail.includes("API key") || detail.includes("permission")
        ? "The Gemini API key is missing or invalid. Please update the configuration in Firestore."
        : `Gemini request failed: ${detail}`,
    );
  }
}
