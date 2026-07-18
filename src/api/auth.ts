import { buildApiUrl, getApiBaseUrl } from "../config/api";
import type { SignInParams, SignInResponse } from "../types/auth";

export async function signInRequest(
  params: SignInParams
): Promise<SignInResponse> {
  const response = await fetch(buildApiUrl(getApiBaseUrl(), "/api/auth/signin"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    throw new Error("Sign in failed");
  }

  const payload = await response.json();

  return {
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken
  };
}
