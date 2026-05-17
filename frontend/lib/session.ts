// Session storage for the bearer token. Cleared when the tab closes.

const KEY = "deck_auditor_token";

export function saveToken(token: string) {
  try {
    sessionStorage.setItem(KEY, token);
  } catch {
    // No-op (private mode etc.)
  }
}

export function loadToken(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function clearToken() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // No-op
  }
}
