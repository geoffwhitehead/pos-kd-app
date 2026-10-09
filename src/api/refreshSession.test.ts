import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { refreshSession } from "./refreshSession";
import { loadStoredAuthSession } from "../lib/authStorage";

vi.mock("../config/api", () => ({
  getApiBaseUrl: () => "",
  buildApiUrl: (_base: string, path: string) => path,
}));
const session = { accessToken: "expired", refreshToken: "pos2.session.old" };
const next = { accessToken: "fresh", refreshToken: "pos2.session.new" };

describe("device session renewal", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

  it("shares concurrent refreshes and persists the replacement before returning", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(next));
    vi.stubGlobal("fetch", fetchMock);
    const results = await Promise.all([
      refreshSession(session),
      refreshSession(session),
    ]);
    expect(results).toEqual([next, next]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(loadStoredAuthSession()).toEqual(next);
    expect(await refreshSession(session)).toEqual(next);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reuses the attempt identifier after a lost response", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("Offline"))
      .mockResolvedValueOnce(Response.json(next));
    vi.stubGlobal("fetch", fetchMock);
    await expect(refreshSession(session)).rejects.toThrow("Offline");
    await expect(refreshSession(session)).resolves.toEqual(next);
    expect(fetchMock.mock.calls[0][1].headers["x-refresh-request-id"]).toBe(
      fetchMock.mock.calls[1][1].headers["x-refresh-request-id"],
    );
  });

  it("keeps a terminal revocation distinguishable from a temporary outage", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 401 })),
    );
    await expect(refreshSession(session)).rejects.toThrow("401");
    expect(loadStoredAuthSession()).toBeNull();
  });
});
