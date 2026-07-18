import { act, renderHook, waitFor } from "@testing-library/react";
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
    vi.useRealTimers();
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

  it("does not immediately refetch when session tokens are refreshed", async () => {
    vi.useFakeTimers();

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({
        authorization: "Bearer access_456",
        "x-refresh-token": "refresh_789"
      }),
      json: async () => sampleKitchenDisplayResponse
    });

    vi.stubGlobal("fetch", fetchMock);

    const onSessionRefresh = vi.fn();

    const { rerender } = renderHook(
      ({ session }) =>
        useKitchenDisplayPolling(session, {
          onAuthFailure: () => {},
          onSessionRefresh
        }),
      {
        initialProps: {
          session: {
            accessToken: "access_123",
            refreshToken: "refresh_456"
          }
        }
      }
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    const initialCallCount = fetchMock.mock.calls.length;

    expect(initialCallCount).toBeGreaterThan(0);
    expect(onSessionRefresh).toHaveBeenCalledWith({
      accessToken: "access_456",
      refreshToken: "refresh_789"
    });

    rerender({
      session: {
        accessToken: "access_456",
        refreshToken: "refresh_789"
      }
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(4900);
    });

    expect(fetchMock).toHaveBeenCalledTimes(initialCallCount);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledTimes(initialCallCount + 1);
  });
});
