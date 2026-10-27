import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useKitchenDisplayPolling } from "./useKitchenDisplayPolling";
import {
  loadStoredAuthSession,
  saveStoredAuthSession,
} from "../lib/authStorage";

vi.mock("../config/api", () => ({
  getApiBaseUrl: () => "",
  buildApiUrl: (_base: string, path: string) => path,
}));

const session = { accessToken: "expired", refreshToken: "pos2.outage.old" };
const next = { accessToken: "fresh", refreshToken: "pos2.outage.new" };
const latest = { accessToken: "recovered", refreshToken: "pos2.outage.latest" };
const board = {
  source: "diary",
  warnings: [],
  freshness: { bookingsLastSuccessAt: "2026-10-27T12:00:00Z" },
  boardRows: [],
  activeOrders: { inHouse: [], takeaway: [] },
};

describe("outage recovery", () => {
  beforeEach(() => {
    localStorage.clear();
    saveStoredAuthSession(session);
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-27T10:00:00Z"));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    localStorage.clear();
  });

  it("recovers after a 12-hour outage following a successful renewal and failed board load", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(Response.json(next))
      .mockResolvedValue(new Response(null, { status: 503 }));
    vi.stubGlobal("fetch", fetchMock);
    const onAuthFailure = vi.fn();
    const onSessionRefresh = vi.fn();
    const { result } = renderHook(() =>
      useKitchenDisplayPolling(session, { onAuthFailure, onSessionRefresh }),
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(loadStoredAuthSession()).toEqual(next);
    expect(onSessionRefresh).not.toHaveBeenCalled();

    // The UI still has the original credentials while the saved token also expires.
    vi.setSystemTime(new Date("2026-10-27T22:00:00Z"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(onAuthFailure).not.toHaveBeenCalled();
    expect(loadStoredAuthSession()).toEqual(next);
    fetchMock.mockClear();
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(Response.json(latest))
      .mockResolvedValueOnce(Response.json(board));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe(
      "Bearer fresh",
    );
    expect(fetchMock.mock.calls[1][1].headers["x-refresh-token"]).toBe(
      next.refreshToken,
    );
    expect(result.current.error).toBeNull();
    expect(result.current.data).not.toBeNull();
    expect(onSessionRefresh).toHaveBeenCalledWith(latest);
    expect(onAuthFailure).not.toHaveBeenCalled();
  });

  it("retries temporary renewal failures with the same attempt identifier", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(Response.json(next))
      .mockResolvedValueOnce(Response.json(board));
    vi.stubGlobal("fetch", fetchMock);
    const onAuthFailure = vi.fn();
    const { result } = renderHook(() =>
      useKitchenDisplayPolling(session, { onAuthFailure }),
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(result.current.error).toContain("503");
    expect(loadStoredAuthSession()).toEqual(session);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(fetchMock.mock.calls[1][1].headers["x-refresh-request-id"]).toBe(
      fetchMock.mock.calls[3][1].headers["x-refresh-request-id"],
    );
    expect(result.current.error).toBeNull();
    expect(onAuthFailure).not.toHaveBeenCalled();
  });

  it("does not discard pairing for a board 401 after successful renewal", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(Response.json(next))
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(Response.json(board));
    vi.stubGlobal("fetch", fetchMock);
    const onAuthFailure = vi.fn();
    const { result } = renderHook(() =>
      useKitchenDisplayPolling(session, { onAuthFailure }),
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(result.current.error).toContain("401");
    expect(onAuthFailure).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(result.current.error).toBeNull();
  });

  it("still reports a rejected refresh token as a terminal authentication failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockImplementation(() =>
          Promise.resolve(new Response(null, { status: 401 })),
        ),
    );
    const onAuthFailure = vi.fn();
    renderHook(() => useKitchenDisplayPolling(session, { onAuthFailure }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(onAuthFailure).toHaveBeenCalledTimes(1);
  });

  it.each(["online", "pageshow", "visibilitychange"])(
    "retries immediately on %s and removes the listener on unmount",
    async (event) => {
      const fetchMock = vi
        .fn()
        .mockRejectedValueOnce(new TypeError("Failed to fetch"))
        .mockImplementation(() => Promise.resolve(Response.json(board)));
      vi.stubGlobal("fetch", fetchMock);
      const { result, unmount } = renderHook(() =>
        useKitchenDisplayPolling(session),
      );
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      const target = event === "visibilitychange" ? document : window;
      await act(async () => {
        target.dispatchEvent(new Event(event));
      });
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(result.current.error).toBeNull();
      unmount();
      target.dispatchEvent(new Event(event));
      expect(fetchMock).toHaveBeenCalledTimes(2);
    },
  );
});
