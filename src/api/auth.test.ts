import { afterEach, describe, expect, it, vi } from "vitest";
import { signInRequest } from "./auth";

vi.mock("../config/api", () => ({
  getApiBaseUrl: () => "https://positive-server.herokuapp.com",
  buildApiUrl: (baseUrl: string, path: string) =>
    `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`
}));

describe("signInRequest", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reads auth tokens from response headers after a successful sign in", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({
          authorization: "Bearer access_123",
          "x-refresh-token": "refresh_456"
        }),
        json: async () => ({
          success: true,
          data: {
            email: "chef@example.com"
          }
        })
      })
    );

    await expect(
      signInRequest({
        email: "chef@example.com",
        password: "password"
      })
    ).resolves.toEqual({
      accessToken: "access_123",
      refreshToken: "refresh_456"
    });
  });
});
