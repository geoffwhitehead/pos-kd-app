import { beforeEach, describe, expect, it } from "vitest";
import {
  clearStoredAuthSession,
  loadStoredAuthSession,
  saveStoredAuthSession
} from "./authStorage";

describe("authStorage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("saves and loads access and refresh tokens", () => {
    saveStoredAuthSession({
      accessToken: "access_123",
      refreshToken: "refresh_456"
    });

    expect(loadStoredAuthSession()).toEqual({
      accessToken: "access_123",
      refreshToken: "refresh_456"
    });
  });

  it("clears the stored session", () => {
    saveStoredAuthSession({
      accessToken: "access_123",
      refreshToken: "refresh_456"
    });

    clearStoredAuthSession();

    expect(loadStoredAuthSession()).toBeNull();
  });
});
