import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, getDocs } from "firebase/firestore";

import { db } from "../../firebaseConfig";

const ASSISTANT_ENABLED_KEY = "digilearn.assistant.enabled";

export async function isAssistantEnabled(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(ASSISTANT_ENABLED_KEY);
    if (value === null) {
      return true; // Enabled by default
    }
    return value === "true";
  } catch {
    return true;
  }
}

export async function setAssistantEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(
      ASSISTANT_ENABLED_KEY,
      enabled ? "true" : "false",
    );
  } catch (error) {
    console.warn("Unable to save assistant enabled state", error);
  }
}

export type AssistantContent = {
  messages: string[];
  suggestions: string[];
  avatar: string | null;
  geminiApiKey: string | null;
};

export type AppKnowledgeContext = {
  appOverview: string | null;
  knowledge: Record<string, string>;
};

let assistantContentCache: AssistantContent | null = null;
let assistantContentPromise: Promise<AssistantContent> | null = null;
let appKnowledgeCache: AppKnowledgeContext | null = null;
let appKnowledgePromise: Promise<AppKnowledgeContext> | null = null;
let cachedLastMessage: string | null = null;

const DEFAULT_FLOATING_MESSAGES = [
  "Need help with your studies?",
  "Ask me anything about your topics!",
  "Ready for a quick revision session?",
  "I'm here to assist your learning!",
  "Let's boost your grades today!",
];

const DEFAULT_SUGGESTIONS = [
  "Explain Osmosis",
  "Revise Quadratic Equations",
  "Help me prepare for UNEB",
  "5 Quick Physics Quiz Questions",
  "Tips for effective study & revision",
  "Summarize key Biology topics",
];

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const getAvatarFromData = (data: Record<string, unknown>): string | null => {
  const candidates = [data.avatar, data.gif];

  return candidates.find(isNonEmptyString) ?? null;
};

const normalizeKnowledgeKey = (value: unknown): string => {
  if (!isNonEmptyString(value)) {
    return "";
  }

  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const coerceKnowledgeText = (value: unknown): string | null => {
  if (isNonEmptyString(value)) {
    return value.trim();
  }

  if (Array.isArray(value)) {
    const joined = value
      .map((entry) => coerceKnowledgeText(entry))
      .filter(isNonEmptyString)
      .join("\n");
    return joined || null;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const direct = [
      record.text,
      record.content,
      record.summary,
      record.description,
    ]
      .map((entry) => coerceKnowledgeText(entry))
      .find(isNonEmptyString);
    return direct ?? null;
  }

  return null;
};

const extractKnowledgeValue = (
  data: Record<string, unknown>,
  labels: string[],
): string | null => {
  const normalizedEntries = Object.entries(data).map(([key, value]) => ({
    key: normalizeKnowledgeKey(key),
    value,
  }));

  for (const label of labels) {
    const normalizedLabel = normalizeKnowledgeKey(label);
    const match = normalizedEntries.find(
      (entry) => entry.key === normalizedLabel,
    );
    const resolved = match ? coerceKnowledgeText(match.value) : null;
    if (resolved) {
      return resolved;
    }
  }

  return null;
};

async function generateAIContentFromKnowledge(
  _geminiApiKey: string | null,
  _appOverview: string | null,
): Promise<{ floatingMessages: string[]; suggestions: string[] }> {
  return {
    floatingMessages: DEFAULT_FLOATING_MESSAGES,
    suggestions: DEFAULT_SUGGESTIONS,
  };
}

export async function getAssistantContent(
  forceRefresh = false,
): Promise<AssistantContent> {
  if (!forceRefresh && assistantContentCache) {
    return assistantContentCache;
  }

  if (!forceRefresh && assistantContentPromise) {
    return assistantContentPromise;
  }

  assistantContentPromise = (async () => {
    const [assistantSnapshot, knowledgeContext] = await Promise.all([
      getDocs(collection(db, "ai assistant")),
      getDigiLearnKnowledgeContext(forceRefresh),
    ]);

    const assistantEntries = assistantSnapshot.docs
      .map((doc) => {
        const data = doc.data() as Record<string, unknown>;
        return { avatar: getAvatarFromData(data) };
      })
      .filter((entry) => entry.avatar);

    const firstAvatar =
      assistantEntries.find((entry) => entry.avatar)?.avatar ?? null;

    const { floatingMessages, suggestions } =
      await generateAIContentFromKnowledge(null, knowledgeContext.appOverview);

    const content = {
      avatar: firstAvatar,
      messages: floatingMessages,
      suggestions,
      geminiApiKey: null,
    };

    assistantContentCache = content;
    if (content.messages.length > 0 && cachedLastMessage === null) {
      cachedLastMessage = content.messages[0];
    }

    return content;
  })();

  try {
    return await assistantContentPromise;
  } finally {
    assistantContentPromise = null;
  }
}

export async function getDigiLearnKnowledgeContext(
  forceRefresh = false,
): Promise<AppKnowledgeContext> {
  if (!forceRefresh && appKnowledgeCache) {
    return appKnowledgeCache;
  }

  if (!forceRefresh && appKnowledgePromise) {
    return appKnowledgePromise;
  }

  appKnowledgePromise = (async () => {
    const snapshot = await getDocs(collection(db, "ai knowledge"));

    const knowledge: Record<string, string> = {};
    snapshot.docs.forEach((doc) => {
      const data = doc.data() as Record<string, unknown>;
      Object.entries(data).forEach(([key, value]) => {
        const normalizedKey = normalizeKnowledgeKey(key);
        if (!normalizedKey) {
          return;
        }

        const text = coerceKnowledgeText(value);
        if (text && !knowledge[normalizedKey]) {
          knowledge[normalizedKey] = text;
        }
      });
    });

    const appOverview = extractKnowledgeValue({ ...knowledge }, [
      "app overview",
      "app overview text",
      "app_overview",
      "appOverview",
    ]);

    const context = {
      appOverview,
      knowledge,
    };

    appKnowledgeCache = context;
    return context;
  })();

  try {
    return await appKnowledgePromise;
  } finally {
    appKnowledgePromise = null;
  }
}

export function getCachedAssistantMessage(): string | null {
  return cachedLastMessage;
}

export function setCachedAssistantMessage(message: string): void {
  cachedLastMessage = message;
}

export function getCachedGeminiApiKey(): string | null {
  return assistantContentCache?.geminiApiKey ?? null;
}
