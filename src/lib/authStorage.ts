import type { AuthSession } from "../types/auth";

const ACCESS_TOKEN_KEY = "kd.auth.accessToken";
const REFRESH_TOKEN_KEY = "kd.auth.refreshToken";
const SESSION_KEY = "kd.auth.session";

export function loadStoredAuthSession(): AuthSession | null {
  const stored = window.localStorage.getItem(SESSION_KEY);
  if (stored) {
    try {
      const session = JSON.parse(stored);
      if (
        typeof session.accessToken === "string" &&
        typeof session.refreshToken === "string"
      )
        return session;
    } catch {
      /* Fall back to the previous storage format. */
    }
  }
  const accessToken = window.localStorage.getItem(ACCESS_TOKEN_KEY);
  const refreshToken = window.localStorage.getItem(REFRESH_TOKEN_KEY);

  if (accessToken == null || refreshToken == null) {
    return null;
  }

  return { accessToken, refreshToken };
}

export function saveStoredAuthSession(session: AuthSession) {
  // Keep rotating token pairs atomic across reloads and power loss.
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function clearStoredAuthSession() {
  window.localStorage.removeItem(SESSION_KEY);
  window.localStorage.removeItem("kd.auth.refreshAttempt");
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}
