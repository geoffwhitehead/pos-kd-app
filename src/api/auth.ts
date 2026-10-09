import { buildApiUrl, getApiBaseUrl } from "../config/api";
import type { SignInParams, SignInResponse } from "../types/auth";

function getBearerToken(authorizationHeader: string | null) {
  return authorizationHeader?.replace(/^Bearer\s+/i, "") ?? null;
}

export async function signInRequest(
  params: SignInParams,
): Promise<SignInResponse> {
  const response = await fetch(
    buildApiUrl(getApiBaseUrl(), "/api/security/pair"),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Kitchen-Request": "1",
      },
      body: JSON.stringify(params),
    },
  );

  if (!response.ok) {
    throw new Error(
      response.status === 401
        ? "Pairing code is invalid or expired. Generate a new code in backoffice."
        : "Could not pair this display. Please try again.",
    );
  }

  const payload = await response.json();
  const accessToken =
    getBearerToken(response.headers.get("authorization")) ??
    payload.accessToken ??
    null;
  const refreshToken =
    response.headers.get("x-refresh-token") ?? payload.refreshToken ?? null;

  if (accessToken == null || refreshToken == null) {
    throw new Error("Sign in response did not include auth tokens");
  }

  return {
    accessToken,
    refreshToken,
  };
}
