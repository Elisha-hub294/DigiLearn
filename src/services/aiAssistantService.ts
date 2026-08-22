import { GoogleGenAI } from "@google/genai";
import { collection, getDocs } from "firebase/firestore";

import { db } from "../../firebaseConfig";

export type AssistantContent = {
  messages: string[];
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

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const getAvatarFromData = (data: Record<string, unknown>): string | null => {
  const candidates = [
    data.avatar,
    data.gif
  ];

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

async function generateFloatingMessagesFromAI(
  geminiApiKey: string | null,
  appOverview: string | null,
): Promise<string[]> {
  if (!geminiApiKey) {
    return DEFAULT_FLOATING_MESSAGES;
  }

  const prompt = [
    "You are DigiLearn's AI Assistant for a mobile learning app.",
    appOverview
      ? `App Overview:\n${appOverview}`
      : "DigiLearn is an interactive educational app offering study resources, revision, and academic support for students.",
    "Generate exactly 5 distinct, engaging, short messages (maximum 60 characters each) to display in a floating assistant speech bubble on the app's home screen.",
    "The messages should invite students to ask questions, revise, or explore study tools in DigiLearn.",
    'Return ONLY a valid JSON array containing exactly 5 string items. Example: ["Message 1", "Message 2", "Message 3", "Message 4", "Message 5"]',
  ].join("\n\n");

  try {
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    const text = response.text ? response.text.trim() : "";
    const cleaned = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/, "")
      .replace(/\s*```$/, "")
      .trim();

    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      const items = parsed
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter((item) => item.length > 0);

      if (items.length >= 5) {
        return items.slice(0, 5);
      }
      if (items.length > 0) {
        const filled = [...items];
        for (const fallback of DEFAULT_FLOATING_MESSAGES) {
          if (filled.length >= 5) break;
          if (!filled.includes(fallback)) {
            filled.push(fallback);
          }
        }
        return filled.slice(0, 5);
      }
    }
  } catch (error) {
    console.warn("Unable to generate AI floating messages:", error);
  }

  return DEFAULT_FLOATING_MESSAGES;
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
    const [assistantSnapshot, configSnapshot, knowledgeContext] =
      await Promise.all([
        getDocs(collection(db, "ai assistant")),
        getDocs(collection(db, "config")),
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

    const geminiApiKey =
      configSnapshot.docs
        .map((doc) => (doc.data() as Record<string, unknown>).gemini_api_key)
        .find(isNonEmptyString) ?? null;

    const messages = await generateFloatingMessagesFromAI(
      geminiApiKey,
      knowledgeContext.appOverview,
    );

    const content = {
      avatar: firstAvatar,
      messages,
      geminiApiKey,
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
