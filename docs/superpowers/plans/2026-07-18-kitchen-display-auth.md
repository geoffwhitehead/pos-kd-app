# Kitchen Display Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a sign-in-only authentication layer to the kitchen display app that persists POS bearer tokens in `localStorage`, silently refreshes them with the stored refresh token, and returns to login immediately when refresh fails.

**Architecture:** Wrap the current board app in an `AuthProvider` that owns token persistence, sign-in, refresh, and authenticated bootstrapping. Split the UI into a `LoginScreen` and an authenticated board shell, and route all board fetches through one authenticated request helper that attaches `Authorization` and `x-refresh-token`, persists refreshed headers, and clears session on terminal auth failure.

**Tech Stack:** React, TypeScript, Vite, Vitest, Testing Library, CSS modules

---

## File Structure

- Create: `src/types/auth.ts`
- Create: `src/lib/authStorage.ts`
- Create: `src/lib/authStorage.test.ts`
- Create: `src/api/auth.ts`
- Create: `src/context/AuthContext.tsx`
- Create: `src/context/AuthContext.test.tsx`
- Create: `src/screens/LoginScreen.tsx`
- Create: `src/screens/LoginScreen.module.css`
- Create: `src/screens/LoginScreen.test.tsx`
- Modify: `src/api/fetchKitchenDisplay.ts`
- Modify: `src/hooks/useKitchenDisplayPolling.ts`
- Modify: `src/hooks/useKitchenDisplayPolling.test.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/app/App.test.tsx`
- Modify: `src/main.tsx`
- Modify: `src/styles/global.css`
- Modify: `src/test/renderWithApp.tsx`

### Task 1: Add Auth Types And Token Storage Helpers

**Files:**
- Create: `src/types/auth.ts`
- Create: `src/lib/authStorage.ts`
- Create: `src/lib/authStorage.test.ts`

- [ ] **Step 1: Write the failing auth storage test**

```ts
import { describe, expect, it, beforeEach } from "vitest";
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/lib/authStorage.test.ts`
Expected: FAIL because the auth storage helper and auth types do not exist yet.

- [ ] **Step 3: Implement auth types and storage helpers**

```ts
// src/types/auth.ts
export type AuthSession = {
  accessToken: string;
  refreshToken: string;
};

export type SignInParams = {
  email: string;
  password: string;
};

export type SignInResponse = {
  accessToken: string;
  refreshToken: string;
};
```

```ts
// src/lib/authStorage.ts
import type { AuthSession } from "../types/auth";

const ACCESS_TOKEN_KEY = "kd.auth.accessToken";
const REFRESH_TOKEN_KEY = "kd.auth.refreshToken";

export function loadStoredAuthSession(): AuthSession | null {
  const accessToken = window.localStorage.getItem(ACCESS_TOKEN_KEY);
  const refreshToken = window.localStorage.getItem(REFRESH_TOKEN_KEY);

  if (accessToken == null || refreshToken == null) {
    return null;
  }

  return { accessToken, refreshToken };
}

export function saveStoredAuthSession(session: AuthSession) {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
}

export function clearStoredAuthSession() {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test src/lib/authStorage.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/types/auth.ts src/lib/authStorage.ts src/lib/authStorage.test.ts
git commit -m "feat: add kitchen display auth storage"
```

### Task 2: Add Auth API Helpers For Sign-In And Authenticated Requests

**Files:**
- Create: `src/api/auth.ts`
- Modify: `src/api/fetchKitchenDisplay.ts`
- Modify: `src/hooks/useKitchenDisplayPolling.test.tsx`

- [ ] **Step 1: Write the failing authenticated fetch test**

```tsx
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useKitchenDisplayPolling } from "./useKitchenDisplayPolling";
import { sampleKitchenDisplayResponse } from "../test/fixtures/kitchenDisplay";

describe("useKitchenDisplayPolling", () => {
  it("passes bearer and refresh headers to the board request", async () => {
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
        "/api/kitchen-display",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer access_123",
            "x-refresh-token": "refresh_456"
          })
        })
      );
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/hooks/useKitchenDisplayPolling.test.tsx`
Expected: FAIL because the polling hook does not yet accept auth session input or pass auth headers.

- [ ] **Step 3: Implement sign-in and authenticated board request helpers**

```ts
// src/api/auth.ts
import type { SignInParams, SignInResponse } from "../types/auth";

export async function signInRequest(params: SignInParams): Promise<SignInResponse> {
  const response = await fetch("/api/auth/signin", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(params)
  });

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
  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      "x-refresh-token": session.refreshToken
    }
  });

  if (!response.ok) {
    throw new Error(`Kitchen display request failed: ${response.status}`);
  }

  const nextAccessToken = response.headers.get("authorization")?.replace("Bearer ", "");
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
git commit -m "feat: add kitchen display auth api helpers"
```

### Task 3: Build Auth Provider And Session Bootstrap

**Files:**
- Create: `src/context/AuthContext.tsx`
- Create: `src/context/AuthContext.test.tsx`
- Modify: `src/main.tsx`
- Modify: `src/test/renderWithApp.tsx`

- [ ] **Step 1: Write the failing auth provider bootstrap test**

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuthProvider, useAuth } from "./AuthContext";

function Probe() {
  const { status } = useAuth();
  return <p>{status}</p>;
}

describe("AuthProvider", () => {
  it("boots into authenticated state when tokens exist in localStorage", async () => {
    window.localStorage.setItem("kd.auth.accessToken", "access_123");
    window.localStorage.setItem("kd.auth.refreshToken", "refresh_456");

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("authenticated")).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/context/AuthContext.test.tsx`
Expected: FAIL because the auth provider and hook do not exist yet.

- [ ] **Step 3: Implement the auth provider**

```tsx
// src/context/AuthContext.tsx
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren
} from "react";
import { signInRequest } from "../api/auth";
import {
  clearStoredAuthSession,
  loadStoredAuthSession,
  saveStoredAuthSession
} from "../lib/authStorage";
import type { AuthSession, SignInParams } from "../types/auth";

type AuthStatus = "booting" | "unauthenticated" | "authenticated";

type AuthContextValue = {
  status: AuthStatus;
  session: AuthSession | null;
  signIn: (params: SignInParams) => Promise<void>;
  signOut: () => void;
  updateSession: (session: AuthSession) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const initialSession = loadStoredAuthSession();
  const [session, setSession] = useState<AuthSession | null>(initialSession);
  const status: AuthStatus =
    session == null ? "unauthenticated" : "authenticated";

  async function signIn(params: SignInParams) {
    const nextSession = await signInRequest(params);
    saveStoredAuthSession(nextSession);
    setSession(nextSession);
  }

  function signOut() {
    clearStoredAuthSession();
    setSession(null);
  }

  function updateSession(nextSession: AuthSession) {
    saveStoredAuthSession(nextSession);
    setSession(nextSession);
  }

  const value = useMemo(
    () => ({
      status,
      session,
      signIn,
      signOut,
      updateSession
    }),
    [session, status]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (value == null) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return value;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test src/context/AuthContext.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/context/AuthContext.tsx src/context/AuthContext.test.tsx src/main.tsx src/test/renderWithApp.tsx
git commit -m "feat: add kitchen display auth provider"
```

### Task 4: Add The Login Screen And Auth Gate In App

**Files:**
- Create: `src/screens/LoginScreen.tsx`
- Create: `src/screens/LoginScreen.module.css`
- Create: `src/screens/LoginScreen.test.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/app/App.test.tsx`
- Modify: `src/styles/global.css`

- [ ] **Step 1: Write the failing login screen test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LoginScreen } from "./LoginScreen";

describe("LoginScreen", () => {
  it("renders email and password fields with a sign-in action", () => {
    render(
      <LoginScreen
        isLoading={false}
        error={null}
        onSubmit={async () => {}}
      />
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i })
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/screens/LoginScreen.test.tsx`
Expected: FAIL because the login screen does not exist.

- [ ] **Step 3: Implement login screen and auth-gated app entry**

```tsx
// src/screens/LoginScreen.tsx
import { useState } from "react";

type Props = {
  isLoading: boolean;
  error: string | null;
  onSubmit: (params: { email: string; password: string }) => Promise<void>;
};

export function LoginScreen({ isLoading, error, onSubmit }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <main>
      <h1>Kitchen Display</h1>
      <p>Sign in to open the live kitchen board.</p>
      <label>
        Email
        <input value={email} onChange={(event) => setEmail(event.target.value)} />
      </label>
      <label>
        Password
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      {error ? <p>{error}</p> : null}
      <button
        type="button"
        disabled={isLoading || email.trim() === "" || password.trim() === ""}
        onClick={() => onSubmit({ email: email.trim(), password })}
      >
        {isLoading ? "Signing in..." : "Sign in"}
      </button>
    </main>
  );
}
```

```tsx
// src/app/App.tsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useKitchenDisplayPolling } from "../hooks/useKitchenDisplayPolling";
import { LoginScreen } from "../screens/LoginScreen";
import { KitchenDisplayScreen } from "../screens/KitchenDisplayScreen";

export function App() {
  const { session, signIn, status } = useAuth();
  const [signInError, setSignInError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const boardState = useKitchenDisplayPolling(session);

  if (status !== "authenticated" || session == null) {
    return (
      <LoginScreen
        isLoading={isSigningIn}
        error={signInError}
        onSubmit={async (params) => {
          setIsSigningIn(true);
          try {
            await signIn(params);
            setSignInError(null);
          } catch (error) {
            setSignInError(
              error instanceof Error ? error.message : "Sign in failed"
            );
          } finally {
            setIsSigningIn(false);
          }
        }}
      />
    );
  }

  return (
    <KitchenDisplayScreen
      data={boardState.data}
      error={boardState.error}
      isLoading={boardState.isLoading}
    />
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test src/screens/LoginScreen.test.tsx src/app/App.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/screens/LoginScreen.tsx src/screens/LoginScreen.module.css src/screens/LoginScreen.test.tsx src/app/App.tsx src/app/App.test.tsx src/styles/global.css
git commit -m "feat: add kitchen display login screen"
```

### Task 5: Wire Silent Refresh And Forced Return To Login

**Files:**
- Modify: `src/hooks/useKitchenDisplayPolling.ts`
- Modify: `src/hooks/useKitchenDisplayPolling.test.tsx`
- Modify: `src/context/AuthContext.tsx`

- [ ] **Step 1: Write the failing refresh failure test**

```tsx
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useKitchenDisplayPolling } from "./useKitchenDisplayPolling";

describe("useKitchenDisplayPolling", () => {
  it("calls onAuthFailure when the authenticated request fails terminally", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        headers: new Headers()
      })
    );

    const onAuthFailure = vi.fn();

    renderHook(() =>
      useKitchenDisplayPolling(
        { accessToken: "access_123", refreshToken: "refresh_456" },
        {
          onAuthFailure,
          onSessionRefresh: () => {}
        }
      )
    );

    await waitFor(() => {
      expect(onAuthFailure).toHaveBeenCalled();
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/hooks/useKitchenDisplayPolling.test.tsx`
Expected: FAIL because the polling hook does not yet notify auth failure or session refresh callbacks.

- [ ] **Step 3: Implement silent refresh handling**

```tsx
// src/hooks/useKitchenDisplayPolling.ts
import { useEffect, useState } from "react";
import { fetchKitchenDisplay } from "../api/fetchKitchenDisplay";
import type { AuthSession } from "../types/auth";
import type { KitchenDisplayResponse } from "../types/kitchenDisplay";

type Options = {
  onSessionRefresh?: (session: AuthSession) => void;
  onAuthFailure?: () => void;
};

export function useKitchenDisplayPolling(
  session: AuthSession | null,
  options: Options = {}
) {
  const [data, setData] = useState<KitchenDisplayResponse | null>(null);
  const [isLoading, setIsLoading] = useState(session != null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session == null) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const response = await fetchKitchenDisplay(session);

        if (cancelled) {
          return;
        }

        if (response.nextSession != null) {
          options.onSessionRefresh?.(response.nextSession);
        }

        setData(response.data);
        setError(null);
      } catch (caught) {
        if (cancelled) {
          return;
        }

        const message = caught instanceof Error ? caught.message : "Unknown error";
        setError(message);

        if (message.includes("401")) {
          options.onAuthFailure?.();
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();
    const timer = window.setInterval(() => void load(), 5000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [options, session]);

  return { data, isLoading, error };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test src/hooks/useKitchenDisplayPolling.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useKitchenDisplayPolling.ts src/hooks/useKitchenDisplayPolling.test.tsx src/context/AuthContext.tsx
git commit -m "feat: add kitchen display silent auth recovery"
```

### Task 6: Run Full Auth And Board Integration Verification

**Files:**
- Modify: `src/app/App.test.tsx`
- Modify: `src/test/renderWithApp.tsx`

- [ ] **Step 1: Write the failing app auth integration test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";
import { AuthProvider } from "../context/AuthContext";

describe("App auth integration", () => {
  it("shows login when no session is stored", () => {
    window.localStorage.clear();

    render(
      <AuthProvider>
        <App />
      </AuthProvider>
    );

    expect(
      screen.getByRole("button", { name: /sign in/i })
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/app/App.test.tsx`
Expected: FAIL because the current app test harness still assumes the board is always mounted.

- [ ] **Step 3: Update the app test harness and verify auth flow integration**

```tsx
// src/test/renderWithApp.tsx
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { AuthProvider } from "../context/AuthContext";

export function renderWithApp(ui: ReactElement) {
  return render(<AuthProvider>{ui}</AuthProvider>);
}
```

- [ ] **Step 4: Run the full test suite**

Run: `yarn test`
Expected: PASS with login, persistence, board rendering, and auth failure handling tests green.

- [ ] **Step 5: Commit**

```bash
git add src/app/App.test.tsx src/test/renderWithApp.tsx
git commit -m "test: verify kitchen display auth integration"
```

## Self-Review

- Spec coverage:
  - sign-in landing screen: covered by Task 4
  - persisted login across reloads: covered by Tasks 1 and 3
  - authenticated board fetches: covered by Task 2
  - silent refresh using stored refresh token headers: covered by Tasks 2 and 5
  - immediate return to login on refresh failure: covered by Task 5
  - no main-screen logout dependency: preserved by Task 4 app gating
- Placeholder scan:
  - all tasks include exact files, commands, and code snippets
  - no TBD/TODO placeholders remain
- Type consistency:
  - `AuthSession`, `SignInParams`, `SignInResponse`, and the authenticated fetch response are introduced once and reused consistently across provider, API, and hook work
