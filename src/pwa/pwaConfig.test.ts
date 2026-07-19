import { describe, expect, it } from "vitest";
import { pwaManifest, pwaOptions } from "./pwaConfig";

describe("pwaConfig", () => {
  it("describes a fullscreen kitchen-display installation", () => {
    expect(pwaManifest.name).toBe("Nomi Kitchen Display");
    expect(pwaManifest.short_name).toBe("Kitchen");
    expect(pwaManifest.display).toBe("fullscreen");
    expect(pwaManifest.theme_color).toBe("#101716");
  });

  it("uses shell caching without runtime API caching", () => {
    expect(pwaOptions.registerType).toBe("autoUpdate");
    expect(pwaOptions.injectRegister).toBe(false);
    expect(pwaOptions.workbox.navigateFallback).toBe("/index.html");
    expect(pwaOptions.workbox.runtimeCaching).toEqual([]);
    expect(pwaOptions.includeAssets).toEqual([
      "icons/icon-192.png",
      "icons/icon-512.png"
    ]);
  });
});
