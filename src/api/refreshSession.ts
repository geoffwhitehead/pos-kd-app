import { buildApiUrl, getApiBaseUrl } from "../config/api";
import {
  loadStoredAuthSession,
  saveStoredAuthSession,
} from "../lib/authStorage";
import type { AuthSession } from "../types/auth";

const ATTEMPT_KEY = "kd.auth.refreshAttempt";
const pending = new Map<string, Promise<AuthSession>>();

async function rotate(session: AuthSession): Promise<AuthSession> {
  const stored = loadStoredAuthSession();
  if (
    stored &&
    stored.refreshToken !== session.refreshToken &&
    stored.refreshToken.split(".")[1] === session.refreshToken.split(".")[1]
  )
    return stored;

  let attempt: { token: string; id: string } | null = null;
  try {
    attempt = JSON.parse(localStorage.getItem(ATTEMPT_KEY) ?? "null");
  } catch {
    /* Start a new attempt. */
  }
  if (attempt?.token !== session.refreshToken) {
    attempt = { token: session.refreshToken, id: crypto.randomUUID() };
    localStorage.setItem(ATTEMPT_KEY, JSON.stringify(attempt));
  }
  // Persist the identifier before requesting rotation so a lost response can be recovered.
  const response = await fetch(
    buildApiUrl(getApiBaseUrl(), "/api/auth/refresh-tokens"),
    {
      method: "PUT",
      headers: {
        "X-Kitchen-Request": "1",
        "x-refresh-token": session.refreshToken,
        "x-refresh-request-id": attempt.id,
      },
      signal: AbortSignal.timeout(25_000),
    },
  );
  if (!response.ok)
    throw new Error(`Session renewal failed: ${response.status}`);
  const payload = await response.json();
  if (
    typeof payload.accessToken !== "string" ||
    typeof payload.refreshToken !== "string"
  ) {
    throw new Error("Session renewal returned invalid tokens");
  }
  const next = {
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
  };
  saveStoredAuthSession(next);
  localStorage.removeItem(ATTEMPT_KEY);
  return next;
}

export function refreshSession(session: AuthSession): Promise<AuthSession> {
  const existing = pending.get(session.refreshToken);
  if (existing) return existing;
  // Serialize refreshes across tabs as well as concurrent board requests.
  const result = Promise.resolve(
    navigator.locks
      ? navigator.locks.request("kd-session-refresh", () => rotate(session))
      : rotate(session),
  ).finally(() => pending.delete(session.refreshToken));
  pending.set(session.refreshToken, result);
  return result;
}
