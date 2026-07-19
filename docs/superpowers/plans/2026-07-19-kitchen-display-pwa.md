# Kitchen Display PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the kitchen display app installable as a dedicated fullscreen PWA with shell caching, while keeping live board data network-driven and falling back to the existing unavailable state when offline.

**Architecture:** Use `vite-plugin-pwa` to generate the web app manifest and service worker inside the current Vite build. Cache only the static shell assets and icons, register the worker from the React entrypoint, and leave the existing auth and board requests network-first by excluding them from runtime API caching.

**Tech Stack:** React 19, TypeScript, Vite 7, vite-plugin-pwa, Vitest, Testing Library, CSS

---

### Task 1: Add PWA regression tests first

**Files:**
- Create: `src/pwa/registerPwa.test.ts`
- Modify: `src/app/App.test.tsx`
- Test: `src/pwa/registerPwa.test.ts`

- [ ] **Step 1: Write the failing service worker registration test**

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { registerPwa } from "./registerPwa";

describe("registerPwa", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("registers the service worker in production when supported", async () => {
    const register = vi.fn().mockResolvedValue(undefined);

    vi.stubEnv("PROD", true);
    vi.stubGlobal("window", {
      addEventListener: vi.fn((_event, handler) => {
        void handler();
      })
    });
    vi.stubGlobal("navigator", {
      serviceWorker: { register }
    });

    await registerPwa();

    expect(register).toHaveBeenCalledWith("/sw.js");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/pwa/registerPwa.test.ts`
Expected: FAIL because `src/pwa/registerPwa.ts` does not exist yet.

- [ ] **Step 3: Write the failing startup smoke assertion**

```ts
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { App } from "./App";

vi.mock("../hooks/useKitchenDisplayPolling", () => ({
  useKitchenDisplayPolling: () => ({
    data: null,
    error: "Data unavailable",
    isLoading: false
  })
}));

describe("App", () => {
  it("still renders the authenticated shell when live data is unavailable", () => {
    render(<App />);

    expect(screen.getByText(/data unavailable/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Run the app test to verify it fails only if startup behavior changes**

Run: `yarn test src/app/App.test.tsx`
Expected: PASS now or fail for a precise missing mock adjustment, but remain as the guard for later PWA changes.

- [ ] **Step 5: Commit**

```bash
git add src/pwa/registerPwa.test.ts src/app/App.test.tsx
git commit -m "test: add pwa registration coverage"
```

### Task 2: Add the Vite PWA integration

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`
- Create: `src/pwa/registerPwa.ts`
- Modify: `src/main.tsx`
- Test: `src/pwa/registerPwa.test.ts`

- [ ] **Step 1: Install the failing dependency expectation**

```ts
import { VitePWA } from "vite-plugin-pwa";
```

- [ ] **Step 2: Run build to verify it fails before installing**

Run: `yarn build`
Expected: FAIL with module resolution error for `vite-plugin-pwa`.

- [ ] **Step 3: Add the dependency and minimal implementation**

```json
{
  "devDependencies": {
    "vite-plugin-pwa": "^1.0.0"
  }
}
```

```ts
// vite.config.ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false,
      includeAssets: ["icons/icon-192.png", "icons/icon-512.png"],
      manifest: {
        name: "Nomi Kitchen Display",
        short_name: "Kitchen",
        start_url: "/",
        display: "fullscreen",
        background_color: "#101716",
        theme_color: "#101716",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,ico}"],
        runtimeCaching: []
      }
    })
  ]
});
```

```ts
// src/pwa/registerPwa.ts
export async function registerPwa() {
  if (!import.meta.env.PROD) {
    return;
  }

  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js");
  });
}
```

```ts
// src/main.tsx
import { registerPwa } from "./pwa/registerPwa";

void registerPwa();
```

- [ ] **Step 4: Run the focused PWA registration test to verify it passes**

Run: `yarn test src/pwa/registerPwa.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json vite.config.ts src/pwa/registerPwa.ts src/main.tsx src/pwa/registerPwa.test.ts yarn.lock
git commit -m "feat: add pwa manifest and service worker registration"
```

### Task 3: Add manifest metadata and dedicated display assets

**Files:**
- Modify: `index.html`
- Create: `public/icons/icon-192.png`
- Create: `public/icons/icon-512.png`
- Test: `yarn build`

- [ ] **Step 1: Write the failing metadata expectation by checking built output**

Run: `yarn build`
Expected: FAIL to include the desired icon assets until they are created.

- [ ] **Step 2: Add minimal head metadata**

```html
<meta name="theme-color" content="#101716" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Kitchen Display" />
<link rel="apple-touch-icon" href="/icons/icon-192.png" />
```

- [ ] **Step 3: Add install icons**

Create two square PNG icons in:

```text
public/icons/icon-192.png
public/icons/icon-512.png
```

They should use the existing dark board palette and a simple high-contrast kitchen-display mark or monogram rather than generic placeholder art.

- [ ] **Step 4: Run build to verify manifest and icon generation pass**

Run: `yarn build`
Expected: PASS with generated manifest and service worker assets in `dist/`

- [ ] **Step 5: Commit**

```bash
git add index.html public/icons/icon-192.png public/icons/icon-512.png
git commit -m "feat: add pwa display metadata and icons"
```

### Task 4: Keep live data network-driven and preserve unavailable-state behavior

**Files:**
- Modify: `vite.config.ts`
- Modify: `src/pwa/registerPwa.test.ts`
- Modify: `src/hooks/useKitchenDisplayPolling.test.tsx`
- Test: `src/hooks/useKitchenDisplayPolling.test.tsx`

- [ ] **Step 1: Write the failing caching policy expectation**

```ts
it("does not define runtime caching for board and auth API traffic", async () => {
  const config = await import("../../vite.config");

  expect(JSON.stringify(config.default)).not.toContain("/api/kd/board");
  expect(JSON.stringify(config.default)).not.toContain("/api/auth");
});
```

- [ ] **Step 2: Run the focused test to verify it fails if config is not inspectable**

Run: `yarn test src/pwa/registerPwa.test.ts`
Expected: FAIL until the config assertion is adjusted or the config is made test-friendly.

- [ ] **Step 3: Implement the minimal safe caching behavior**

```ts
workbox: {
  globPatterns: ["**/*.{js,css,html,png,svg,ico}"],
  navigateFallback: "/index.html",
  runtimeCaching: []
}
```

Keep API requests out of runtime caching so existing hooks remain the source of unavailable-state behavior.

- [ ] **Step 4: Run the polling tests to verify unavailable behavior still passes**

Run: `yarn test src/hooks/useKitchenDisplayPolling.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add vite.config.ts src/pwa/registerPwa.test.ts src/hooks/useKitchenDisplayPolling.test.tsx
git commit -m "test: preserve network-first live data behavior"
```

### Task 5: Verify end-to-end PWA output

**Files:**
- Verify only: `dist/manifest.webmanifest`, `dist/sw.js`, `dist/workbox-*.js`

- [ ] **Step 1: Run the full test suite**

Run: `yarn test`
Expected: PASS with all existing and new tests green.

- [ ] **Step 2: Run the production build**

Run: `yarn build`
Expected: PASS with generated PWA assets.

- [ ] **Step 3: Check built output**

Run: `find dist -maxdepth 2 \\( -name \"manifest*.webmanifest\" -o -name \"sw.js\" -o -name \"workbox-*.js\" \\)`
Expected: output includes a manifest file and service worker artifacts.

- [ ] **Step 4: Commit**

```bash
git add dist
git commit -m "chore: verify pwa production output"
```
