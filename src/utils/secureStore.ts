import * as SecureStore from 'expo-secure-store';

/**
 * Wrapper utilities for securely storing and retrieving sensitive data.
 */
export async function setSecureItem(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED,
  });
}

export async function getSecureItem(key: string): Promise<string | null> {
  return await SecureStore.getItemAsync(key);
}

/** Specific helpers for our app */
const GEMINI_KEY = 'geminiApiKey';
const ASSISTANT_ENABLED_KEY = 'assistantEnabled';

export async function setGeminiApiKey(key: string): Promise<void> {
  await setSecureItem(GEMINI_KEY, key);
}

export async function getGeminiApiKey(): Promise<string | null> {
  return await getSecureItem(GEMINI_KEY);
}

export async function setAssistantEnabledFlag(enabled: boolean): Promise<void> {
  await setSecureItem(ASSISTANT_ENABLED_KEY, enabled ? 'true' : 'false');
}

export async function getAssistantEnabledFlag(): Promise<boolean> {
  const val = await getSecureItem(ASSISTANT_ENABLED_KEY);
  return val === 'true' || val === null; // default to true if not set
}
