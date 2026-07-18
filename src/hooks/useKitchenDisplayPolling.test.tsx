import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { sampleKitchenDisplayResponse } from "../test/fixtures/kitchenDisplay";
import { useKitchenDisplayPolling } from "./useKitchenDisplayPolling";

vi.mock("../config/api", () => ({
  getApiBaseUrl: () => "https://positive-server.herokuapp.com",
  buildApiUrl: (baseUrl: string, path: string) =>
    `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`
}));

describe("useKitchenDisplayPolling", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("passes bearer and refresh headers to the board request", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers(),
      json: async () => sampleKitchenDisplayResponse
    });

    vi.stubGlobal("fetch", fetchMock);

    renderHook(() =>
      useKitchenDisplayPolling({
        accessToken: "access_123",
        refreshToken: "refresh_456"
      })
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "https://positive-server.herokuapp.com/api/kd/board",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer access_123",
            "x-refresh-token": "refresh_456"
          })
        })
      );
    });
  });

  it("notifies auth failure on terminal unauthorized requests", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        headers: new Headers()
      })
    );

    const onAuthFailure = vi.fn();

    renderHook(() =>
      useKitchenDisplayPolling(
        {
          accessToken: "access_123",
          refreshToken: "refresh_456"
        },
        {
          onAuthFailure,
          onSessionRefresh: () => {}
        }
      )
    );

    await waitFor(() => {
      expect(onAuthFailure).toHaveBeenCalled();
    });
  });
});
