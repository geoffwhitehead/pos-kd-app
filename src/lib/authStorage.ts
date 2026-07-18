import type { AuthSession } from "../types/auth";

const ACCESS_TOKEN_KEY = "kd.auth.accessToken";
const REFRESH_TOKEN_KEY = "kd.auth.refreshToken";

export function loadStoredAuthSession(): AuthSession | null {
  const accessToken = window.localStorage.getItem(ACCESS_TOKEN_KEY);
  const refreshToken = window.localStorage.getItem(REFRESH_TOKEN_KEY);

  if (accessToken == null || refreshToken == null) {
    return null;
  }

  return { accessToken, refreshToken };
}

export function saveStoredAuthSession(session: AuthSession) {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
}

export function clearStoredAuthSession() {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}
