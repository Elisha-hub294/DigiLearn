import { collection, getDocs } from "firebase/firestore";

import { db } from "../../firebaseConfig";

export type AssistantContent = {
  messages: string[];
  avatar: string | null;
  geminiApiKey: string | null;
};

let assistantContentCache: AssistantContent | null = null;
let assistantContentPromise: Promise<AssistantContent> | null = null;
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

export function getCachedAssistantMessage(): string | null {
  return cachedLastMessage;
}

export function setCachedAssistantMessage(message: string): void {
  cachedLastMessage = message;
}

export function getCachedGeminiApiKey(): string | null {
  return assistantContentCache?.geminiApiKey ?? null;
}
