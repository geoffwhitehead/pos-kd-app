import { beforeEach, describe, expect, it } from "vitest";
import {
  clearStoredAuthSession,
  getLatestAuthSession,
  loadStoredAuthSession,
  saveStoredAuthSession,
} from "./authStorage";

describe("authStorage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("saves and loads access and refresh tokens", () => {
    saveStoredAuthSession({
      accessToken: "access_123",
      refreshToken: "refresh_456",
    });

    expect(loadStoredAuthSession()).toEqual({
      accessToken: "access_123",
      refreshToken: "refresh_456",
    });
  });

  it("clears the stored session", () => {
    saveStoredAuthSession({
      accessToken: "access_123",
      refreshToken: "refresh_456",
    });

    clearStoredAuthSession();

    expect(loadStoredAuthSession()).toBeNull();
  });

  it("only adopts changed credentials belonging to the same pairing", () => {
    const session = { accessToken: "old", refreshToken: "pos2.device.old" };
    saveStoredAuthSession(session);
    expect(getLatestAuthSession(session)).toBe(session);
    const next = { accessToken: "new", refreshToken: "pos2.device.new" };
    saveStoredAuthSession(next);
    expect(getLatestAuthSession(session)).toEqual(next);
    saveStoredAuthSession({
      accessToken: "other",
      refreshToken: "pos2.other.new",
    });
    expect(getLatestAuthSession(session)).toBe(session);
  });
});
