import AsyncStorage from "@react-native-async-storage/async-storage";

export const DAILY_AI_LIMIT = 15;
const COOLDOWN_SECONDS = 4;

const USAGE_PREFIX = "@digilearn_ai_usage_";
const LAST_SENT_KEY = "@digilearn_ai_last_sent";

function getTodayKey(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${USAGE_PREFIX}${year}-${month}-${day}`;
}

export interface AiUsageStatus {
  allowed: boolean;
  remainingQuota: number;
  dailyLimit: number;
  errorMessage?: string;
}

/**
 * Checks if the user is allowed to send another AI prompt based on daily quota and cooldown.
 */
export async function checkCanSendAiPrompt(): Promise<AiUsageStatus> {
  try {
    const todayKey = getTodayKey();
    const [rawCount, rawLastSent] = await Promise.all([
      AsyncStorage.getItem(todayKey),
      AsyncStorage.getItem(LAST_SENT_KEY),
    ]);

    const count = rawCount ? parseInt(rawCount, 10) : 0;
    const remaining = Math.max(0, DAILY_AI_LIMIT - count);

    // 1. Check daily budget
    if (count >= DAILY_AI_LIMIT) {
      return {
        allowed: false,
        remainingQuota: 0,
        dailyLimit: DAILY_AI_LIMIT,
        errorMessage: `You've reached your daily limit of ${DAILY_AI_LIMIT} AI questions. It resets at midnight!`,
      };
    }

    // 2. Check spam / cooldown
    if (rawLastSent) {
      const lastSentTime = parseInt(rawLastSent, 10);
      const diffMs = Date.now() - lastSentTime;
      const cooldownMs = COOLDOWN_SECONDS * 1000;
      if (diffMs < cooldownMs) {
        const waitSec = Math.ceil((cooldownMs - diffMs) / 1000);
        return {
          allowed: false,
          remainingQuota: remaining,
          dailyLimit: DAILY_AI_LIMIT,
          errorMessage: `Please wait ${waitSec}s before asking another question.`,
        };
      }
    }

    return {
      allowed: true,
      remainingQuota: remaining,
      dailyLimit: DAILY_AI_LIMIT,
    };
  } catch (err) {
    console.warn("Error checking AI quota:", err);
    return {
      allowed: true,
      remainingQuota: DAILY_AI_LIMIT,
      dailyLimit: DAILY_AI_LIMIT,
    };
  }
}

/**
 * Increments daily usage counter and records timestamp after a prompt is sent.
 */
export async function recordAiPromptSent(): Promise<number> {
  try {
    const todayKey = getTodayKey();
    const rawCount = await AsyncStorage.getItem(todayKey);
    const count = (rawCount ? parseInt(rawCount, 10) : 0) + 1;

    await Promise.all([
      AsyncStorage.setItem(todayKey, String(count)),
      AsyncStorage.setItem(LAST_SENT_KEY, String(Date.now())),
    ]);

    return Math.max(0, DAILY_AI_LIMIT - count);
  } catch (err) {
    console.warn("Error recording AI prompt usage:", err);
    return DAILY_AI_LIMIT;
  }
}

/**
 * Gets the current daily quota status for UI display.
 */
export async function getAiQuotaStatus(): Promise<{
  remaining: number;
  limit: number;
}> {
  try {
    const todayKey = getTodayKey();
    const rawCount = await AsyncStorage.getItem(todayKey);
    const count = rawCount ? parseInt(rawCount, 10) : 0;
    return {
      remaining: Math.max(0, DAILY_AI_LIMIT - count),
      limit: DAILY_AI_LIMIT,
    };
  } catch {
    return { remaining: DAILY_AI_LIMIT, limit: DAILY_AI_LIMIT };
  }
}
