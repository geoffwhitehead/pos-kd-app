import { afterEach, describe, expect, it, vi } from "vitest";
import { registerPwa } from "./registerPwa";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

function setup(controller: object | null = {}) {
  const update = vi.fn().mockResolvedValue(undefined);
  const register = vi.fn().mockResolvedValue({ update });
  const reload = vi.fn();
  const events = new Map<string, () => void>();
  const intervals: Array<() => void> = [];
  vi.stubEnv("PROD", true as never);
  vi.stubGlobal("document", {
    readyState: "complete",
    visibilityState: "visible",
    addEventListener: vi.fn(),
  });
  vi.stubGlobal("window", {
    location: { reload },
    addEventListener: vi.fn(),
    setInterval: vi.fn((callback: () => void) => intervals.push(callback)),
  });
  vi.stubGlobal("navigator", {
    serviceWorker: {
      controller,
      register,
      addEventListener: (event: string, handler: () => void) =>
        events.set(event, handler),
    },
  });
  return { register, update, reload, events, intervals };
}

describe("registerPwa", () => {
  it("bypasses script caching and checks for updates periodically", async () => {
    const mocks = setup();
    await registerPwa();
    expect(mocks.register).toHaveBeenCalledWith("/sw.js", {
      updateViaCache: "none",
    });
    expect(mocks.update).toHaveBeenCalledTimes(1);
    mocks.intervals[0]();
    expect(mocks.update).toHaveBeenCalledTimes(2);
  });

  it("reloads once when an existing worker is replaced", async () => {
    const mocks = setup();
    await registerPwa();
    mocks.events.get("controllerchange")!();
    mocks.events.get("controllerchange")!();
    expect(mocks.reload).toHaveBeenCalledTimes(1);
  });

  it("does not reload on initial installation", async () => {
    const mocks = setup(null);
    await registerPwa();
    mocks.events.get("controllerchange")!();
    expect(mocks.reload).not.toHaveBeenCalled();
  });

  it("does nothing outside production", async () => {
    const mocks = setup();
    vi.stubEnv("PROD", false as never);
    await registerPwa();
    expect(mocks.register).not.toHaveBeenCalled();
  });
});
