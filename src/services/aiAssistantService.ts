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

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const getAvatarFromData = (data: Record<string, unknown>): string | null => {
  const candidates = [
    data.avatar,
    data.Avatar,
    data.avatarUrl,
    data.avatar_url,
    data.image,
    data.imageUrl,
    data.image_url,
    data.gif,
    data.Gif,
    data.gifUrl,
    data.gif_url,
    data.photo,
    data.photoUrl,
    data.photo_url,
  ];

  return candidates.find(isNonEmptyString) ?? null;
};

const normalizeMessages = (data: Record<string, unknown>): string[] => {
  const explicitMessage = data.message;
  if (Array.isArray(data.Message)) {
    return data.Message.filter(isNonEmptyString);
  }

  if (Array.isArray(explicitMessage)) {
    return explicitMessage.filter(isNonEmptyString);
  }

  if (isNonEmptyString(explicitMessage)) {
    return [explicitMessage];
  }

  if (isNonEmptyString(data.Message)) {
    return [data.Message];
  }

  return [];
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
    const [assistantSnapshot, configSnapshot] = await Promise.all([
      getDocs(collection(db, "ai assistant")),
      getDocs(collection(db, "config")),
    ]);

    const assistantEntries = assistantSnapshot.docs
      .map((doc) => {
        const data = doc.data() as Record<string, unknown>;
        const avatar = getAvatarFromData(data);
        const messages = normalizeMessages(data);

        return { avatar, messages };
      })
      .filter((entry) => entry.avatar || entry.messages.length > 0);

    const fallbackAvatar = null;
    const firstAvatar =
      assistantEntries.find((entry) => entry.avatar)?.avatar ?? fallbackAvatar;
    const allMessages = assistantEntries.flatMap((entry) => entry.messages);

    const geminiApiKey =
      configSnapshot.docs
        .map((doc) => (doc.data() as Record<string, unknown>).gemini_api_key)
        .find(isNonEmptyString) ?? null;

    const content = {
      avatar: firstAvatar,
      messages:
        allMessages.length > 0 ? allMessages : ["Need help with your studies?"],
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
