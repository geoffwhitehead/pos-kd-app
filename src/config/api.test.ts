import { afterEach, describe, expect, it, vi } from "vitest";
import { buildApiUrl, getApiBaseUrl } from "./api";

describe("api config", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("builds absolute API URLs from the configured base URL", () => {
    expect(
      buildApiUrl("https://positive-server.herokuapp.com", "/api/kd/board")
    ).toBe("https://positive-server.herokuapp.com/api/kd/board");
  });

  it("reads the configured base URL from Vite env", () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://positive-server.herokuapp.com/");

    expect(getApiBaseUrl()).toBe("https://positive-server.herokuapp.com");
  });
});
