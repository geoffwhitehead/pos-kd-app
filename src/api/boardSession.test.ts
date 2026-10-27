import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchKitchenDisplay } from "./fetchKitchenDisplay";
import { loadStoredAuthSession } from "../lib/authStorage";

vi.mock("../config/api", () => ({
  getApiBaseUrl: () => "",
  buildApiUrl: (_base: string, path: string) => path,
}));
const session = { accessToken: "expired", refreshToken: "pos2.board.old" };
const next = { accessToken: "fresh", refreshToken: "pos2.board.new" };
describe("board session recovery", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());
  it("renews an expired session then retries the board with the new credentials", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(Response.json(next))
      .mockResolvedValueOnce(
        Response.json({
          source: "diary",
          warnings: [],
          freshness: { bookingsLastSuccessAt: "2026-10-27T12:00:00Z" },
          boardRows: [],
          activeOrders: { inHouse: [], takeaway: [] },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);
    const result = await fetchKitchenDisplay(session);
    expect(result.nextSession).toEqual(next);
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "/api/kd/board/diary",
      "/api/auth/refresh-tokens",
      "/api/kd/board/diary",
    ]);
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe(
      "Bearer fresh",
    );
  });
  it("retains renewed credentials even when the subsequent board request fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(Response.json(next))
      .mockResolvedValueOnce(new Response(null, { status: 503 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(fetchKitchenDisplay(session)).rejects.toThrow("503");
    expect(loadStoredAuthSession()).toEqual(next);
  });
});
