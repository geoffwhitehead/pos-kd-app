# Kitchen Display API Base URL Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configure the kitchen display app to call the live POS backend through `VITE_API_BASE_URL` instead of relative URLs, with the current local target set to `https://positive-server.herokuapp.com`.

**Architecture:** Add one tiny API config module that reads `import.meta.env.VITE_API_BASE_URL` and exposes a normalized base URL. Update the auth sign-in helper and authenticated board fetch helper to compose absolute URLs from that shared config, then add a local `.env` file plus focused request-composition tests so the app fails fast when config is missing and stays easy to retarget later.

**Tech Stack:** React, TypeScript, Vite, Vitest, Testing Library, CSS modules

---

## File Structure

- Create: `.env`
- Create: `src/config/api.ts`
- Create: `src/config/api.test.ts`
- Modify: `src/api/auth.ts`
- Modify: `src/api/fetchKitchenDisplay.ts`
- Modify: `src/hooks/useKitchenDisplayPolling.test.tsx`

### Task 1: Add Shared API Base URL Config

**Files:**
- Create: `src/config/api.ts`
- Create: `src/config/api.test.ts`

- [ ] **Step 1: Write the failing config test**

```ts
import { describe, expect, it } from "vitest";
import { buildApiUrl } from "./api";

describe("api config", () => {
  it("builds absolute API URLs from the configured base URL", () => {
    expect(buildApiUrl("https://positive-server.herokuapp.com", "/api/kd/board")).toBe(
      "https://positive-server.herokuapp.com/api/kd/board"
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/config/api.test.ts`
Expected: FAIL because `src/config/api.ts` does not exist.

- [ ] **Step 3: Implement the shared API config helper**

```ts
// src/config/api.ts
const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL;

export function getApiBaseUrl() {
  if (rawApiBaseUrl == null || rawApiBaseUrl.trim() === "") {
    throw new Error("Missing VITE_API_BASE_URL");
  }

  return rawApiBaseUrl.replace(/\/+$/, "");
}

export function buildApiUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test src/config/api.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/config/api.ts src/config/api.test.ts
git commit -m "feat: add kitchen display api base url config"
```

### Task 2: Point Auth And Board Requests At The Configured Host

**Files:**
- Modify: `src/api/auth.ts`
- Modify: `src/api/fetchKitchenDisplay.ts`
- Modify: `src/hooks/useKitchenDisplayPolling.test.tsx`

- [ ] **Step 1: Write the failing request-composition test**

```tsx
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { sampleKitchenDisplayResponse } from "../test/fixtures/kitchenDisplay";
import { useKitchenDisplayPolling } from "./useKitchenDisplayPolling";

vi.mock("../config/api", () => ({
  getApiBaseUrl: () => "https://positive-server.herokuapp.com"
}));

describe("useKitchenDisplayPolling", () => {
  it("calls the fully qualified board URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers(),
      json: async () => sampleKitchenDisplayResponse
    });

    vi.stubGlobal("fetch", fetchMock);

    renderHook(() =>
      useKitchenDisplayPolling({
        accessToken: "access_123",
        refreshToken: "refresh_456"
      })
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "https://positive-server.herokuapp.com/api/kd/board",
        expect.any(Object)
      );
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/hooks/useKitchenDisplayPolling.test.tsx`
Expected: FAIL because the fetch helper still uses the relative `/api/kd/board` path.

- [ ] **Step 3: Update request helpers to use the shared config**

```ts
// src/api/auth.ts
import { buildApiUrl, getApiBaseUrl } from "../config/api";
import type { SignInParams, SignInResponse } from "../types/auth";

export async function signInRequest(
  params: SignInParams
): Promise<SignInResponse> {
  const response = await fetch(
    buildApiUrl(getApiBaseUrl(), "/api/auth/signin"),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(params)
    }
  );

  if (!response.ok) {
    throw new Error("Sign in failed");
  }

  const payload = await response.json();

  return {
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken
  };
}
```

```ts
// src/api/fetchKitchenDisplay.ts
import { buildApiUrl, getApiBaseUrl } from "../config/api";
import type { AuthSession } from "../types/auth";
import type { KitchenDisplayResponse } from "../types/kitchenDisplay";

const DEFAULT_ENDPOINT = "/api/kd/board";

export type AuthenticatedBoardResponse = {
  data: KitchenDisplayResponse;
  nextSession: AuthSession | null;
};

export async function fetchKitchenDisplay(
  session: AuthSession,
  endpoint = DEFAULT_ENDPOINT
): Promise<AuthenticatedBoardResponse> {
  const response = await fetch(buildApiUrl(getApiBaseUrl(), endpoint), {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      "x-refresh-token": session.refreshToken
    }
  });

  if (!response.ok) {
    throw new Error(`Kitchen display request failed: ${response.status}`);
  }

  const nextAccessToken = response.headers
    .get("authorization")
    ?.replace("Bearer ", "");
  const nextRefreshToken = response.headers.get("x-refresh-token");

  return {
    data: (await response.json()) as KitchenDisplayResponse,
    nextSession:
      nextAccessToken != null && nextRefreshToken != null
        ? {
            accessToken: nextAccessToken,
            refreshToken: nextRefreshToken
          }
        : null
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test src/hooks/useKitchenDisplayPolling.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/api/auth.ts src/api/fetchKitchenDisplay.ts src/hooks/useKitchenDisplayPolling.test.tsx
git commit -m "feat: route kitchen display requests through api base url"
```

### Task 3: Add Local Environment Config And Verify The App Suite

**Files:**
- Create: `.env`

- [ ] **Step 1: Create the local environment file**

```env
VITE_API_BASE_URL=https://positive-server.herokuapp.com
```

- [ ] **Step 2: Run the full test suite**

Run: `yarn test`
Expected: PASS with the request helpers now using the configured absolute URLs.

- [ ] **Step 3: Commit**

```bash
git add .env
git commit -m "chore: configure kitchen display api base url"
```

## Self-Review

- Spec coverage:
  - shared API base URL helper: covered by Task 1
  - auth request uses base URL: covered by Task 2
  - board request uses base URL: covered by Task 2
  - local `.env` set to hosted backend: covered by Task 3
  - fail-fast config behavior: covered by Task 1
- Placeholder scan:
  - no TBD/TODO placeholders remain
  - each task includes exact files, commands, and code snippets
- Type consistency:
  - `buildApiUrl` and `getApiBaseUrl` are defined once in Task 1 and reused consistently in Task 2
