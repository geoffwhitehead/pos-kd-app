import { afterEach, describe, expect, it, vi } from "vitest";
import { registerPwa } from "./registerPwa";

describe("registerPwa", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("registers the service worker in production when supported", async () => {
    const register = vi.fn().mockResolvedValue(undefined);
    const addEventListener = vi.fn((_event: string, handler: () => void) => {
      handler();
    });

    vi.stubEnv("PROD", true as never);
    vi.stubGlobal("window", { addEventListener });
    vi.stubGlobal("navigator", {
      serviceWorker: { register }
    });

    await registerPwa();

    expect(addEventListener).toHaveBeenCalledWith("load", expect.any(Function));
    expect(register).toHaveBeenCalledWith("/sw.js");
  });

  it("does nothing outside production", async () => {
    const register = vi.fn();
    const addEventListener = vi.fn();

    vi.stubEnv("PROD", false as never);
    vi.stubGlobal("window", { addEventListener });
    vi.stubGlobal("navigator", {
      serviceWorker: { register }
    });

    await registerPwa();

    expect(addEventListener).not.toHaveBeenCalled();
    expect(register).not.toHaveBeenCalled();
  });
});
