// The extension stores the JWT in chrome.storage.local (not localStorage —
// content scripts run in the page's context and can't see extension
// storage any other way, and chrome.storage.local is isolated per-extension).
const TOKEN_KEY = "ip_token";

export async function getToken(): Promise<string | null> {
  const result = await chrome.storage.local.get(TOKEN_KEY);
  return result[TOKEN_KEY] || null;
}

export async function setToken(token: string): Promise<void> {
  await chrome.storage.local.set({ [TOKEN_KEY]: token });
}

export async function clearToken(): Promise<void> {
  await chrome.storage.local.remove(TOKEN_KEY);
}
