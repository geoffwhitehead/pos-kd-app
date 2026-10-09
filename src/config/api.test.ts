import { afterEach, describe, expect, it, vi } from "vitest";
import { buildApiUrl, getApiBaseUrl } from "./api";

describe("api config", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("builds absolute API URLs from the configured base URL", () => {
    expect(
      buildApiUrl("https://positive-server.herokuapp.com", "/api/kd/board"),
    ).toBe("https://positive-server.herokuapp.com/api/kd/board");
  });

  it("reads the configured base URL from Vite env", () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://positive-server.herokuapp.com/");

    expect(getApiBaseUrl()).toBe("https://positive-server.herokuapp.com");
  });

  it("defaults production to the same-origin proxy without a configured URL", () => {
    vi.stubEnv("PROD", true as never);
    vi.stubEnv("VITE_API_BASE_URL", "");
    expect(buildApiUrl(getApiBaseUrl(), "/api/kd/board")).toBe("/api/kd/board");
  });

  it("continues requiring an API URL in development", () => {
    vi.stubEnv("PROD", false as never);
    vi.stubEnv("VITE_API_BASE_URL", "");
    expect(() => getApiBaseUrl()).toThrow("Missing VITE_API_BASE_URL");
  });

  it("supports an explicit root URL for the same-origin proxy", () => {
    vi.stubEnv("VITE_API_BASE_URL", "/");
    expect(buildApiUrl(getApiBaseUrl(), "/api/device-sessions/pair")).toBe(
      "/api/device-sessions/pair",
    );
  });
});
