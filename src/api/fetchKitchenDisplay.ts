import { buildApiUrl, getApiBaseUrl } from "../config/api";
import type { AuthSession } from "../types/auth";
import type { KitchenDisplayResponse } from "../types/kitchenDisplay";

const DEFAULT_ENDPOINT = "/api/kd/board";

export type AuthenticatedBoardResponse = {
  data: KitchenDisplayResponse;
  nextSession: AuthSession | null;
};

export async function fetchKitchenDisplay(
  session: AuthSession,
  endpoint = DEFAULT_ENDPOINT
): Promise<AuthenticatedBoardResponse> {
  const response = await fetch(buildApiUrl(getApiBaseUrl(), endpoint), {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      "x-refresh-token": session.refreshToken
    }
  });

  if (!response.ok) {
    throw new Error(`Kitchen display request failed: ${response.status}`);
  }

  const nextAccessToken = response.headers
    .get("authorization")
    ?.replace("Bearer ", "");
  const nextRefreshToken = response.headers.get("x-refresh-token");

  return {
    data: (await response.json()) as KitchenDisplayResponse,
    nextSession:
      nextAccessToken != null && nextRefreshToken != null
        ? {
            accessToken: nextAccessToken,
            refreshToken: nextRefreshToken
          }
        : null
  };
}
