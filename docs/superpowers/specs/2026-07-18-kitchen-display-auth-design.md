# Kitchen Display Auth Design

**Date:** July 18, 2026

**Repo:** `pos-kd-app`

**Goal:** Add a simple authentication layer to the kitchen display React app so staff land on a sign-in screen, stay signed in across reloads, and can access the authenticated kitchen board endpoint using the existing POS auth flow.

## Product Direction

This app should not invent a separate kitchen-display auth system.

It should reuse the existing POS sign-in flow and token model:

- sign in with the normal POS email and password
- store access and refresh tokens locally
- attach those tokens to authenticated board requests
- silently refresh when the access token expires
- return to login immediately if refresh fails

This is a kiosk-style display flow, not a general-purpose account-management interface.

## Scope

Included in this slice:

- landing page with sign-in form
- persisted login across reloads
- silent refresh using stored refresh token
- authenticated board fetches
- automatic return to login when refresh fails

Explicitly excluded:

- sign-up flow
- password reset flow
- visible logout in the main kitchen board UI
- multi-user switching UX
- a second auth backend

## Existing Backend Contract

The React app should align with the existing POS server auth model.

From the existing server shape:

- sign-in is handled by `POST /api/auth/signin`
- protected requests use `Authorization: Bearer <accessToken>`
- refresh uses `x-refresh-token`
- refreshed tokens may be returned in response headers

That means the kitchen display app should behave like a normal POS client from the server’s perspective.

## UX Model

### Logged Out

The user lands on a dedicated sign-in screen.

The screen should be intentionally simple:

- app title / kitchen display label
- email field
- password field
- primary `Sign in` button
- loading state during submit
- inline error state when sign-in fails

There should be no sign-up link and no password recovery controls in this app.

### Logged In

Once sign-in succeeds:

- persist tokens locally
- transition directly into the authenticated kitchen display
- allow silent session continuity across page reloads

The board should feel like a kiosk surface rather than a user-account UI.

### Session Expired

If the access token is expired:

- attempt silent refresh automatically

If refresh succeeds:

- update stored tokens
- continue without interrupting the board

If refresh fails:

- clear stored auth state
- immediately return to the login screen

No intermediate “session expired” screen is needed.

## Architecture

Use a small auth layer around the existing app shell.

### Recommended Structure

- `AuthProvider`
  - owns persisted tokens
  - exposes `signIn`, `signOut`, and auth status
  - handles bootstrap from storage
  - handles refresh and forced sign-out on refresh failure

- `LoginScreen`
  - submit email/password to the existing POS sign-in endpoint
  - show loading and failure states

- authenticated app shell
  - mounts the kitchen board only when auth state is valid

- authenticated API helper
  - sends `Authorization` and `x-refresh-token`
  - captures refreshed tokens from response headers
  - retries once after refresh when appropriate

This keeps auth state centralized and stops the display polling layer from becoming responsible for session management.

## Persistence Model

Use browser `localStorage` for v1 persistence.

Stored values:

- access token
- refresh token

The auth provider should restore tokens on app startup before deciding whether to render login or the kitchen board.

## App Flow

### Boot

1. Read tokens from `localStorage`.
2. If no tokens exist, render login.
3. If tokens exist, initialize authenticated state and render the board shell.
4. First authenticated board request confirms the session is still usable.

### Sign In

1. User enters email and password.
2. App posts credentials to `POST /api/auth/signin`.
3. On success, save tokens locally.
4. Transition into the board.

### Authenticated Request

1. Attach `Authorization: Bearer <accessToken>`.
2. Attach `x-refresh-token: <refreshToken>`.
3. If response returns refreshed tokens in headers, persist them immediately.

### Expired Access Token

1. Request fails due to expired/invalid access token.
2. Attempt refresh using the stored refresh token flow.
3. If refresh succeeds, retry the original request once.
4. If refresh fails, clear tokens and return to login.

## UI Requirements

### Login Screen

The login screen should be visually plain, dependable, and staff-friendly.

Requirements:

- centered form
- high-contrast inputs and button
- clear app identity such as `Kitchen Display`
- no extra navigation
- usable on the kitchen touchscreen

Suggested copy:

- title: `Kitchen Display`
- subtitle: `Sign in to open the live kitchen board.`
- button: `Sign in`

### Main Board

The main board should not expose a prominent logout action.

If sign-out exists at all in v1, it should be hidden behind a low-priority control outside the primary kitchen surface or omitted entirely until operationally needed.

## Error Handling

### Sign-In Failure

- show a simple inline error message
- keep entered email
- keep the password value in place for fast retry on a staff-controlled kitchen device

### Refresh Failure

- clear tokens from storage
- reset auth state
- return to login immediately

### Board Request Unauthorized

If a board request still fails with unauthorized after refresh:

- treat that as a terminal auth failure
- clear session
- return to login

## Testing Strategy

### Unit / Component

- login screen renders fields and submit button
- auth provider restores persisted session
- unauthenticated app renders login
- authenticated app renders board shell
- refresh success updates stored tokens
- refresh failure clears tokens and returns to login

### Integration

- sign in successfully and load board
- reload page and stay signed in
- simulate expired access token and successful refresh
- simulate expired access token and failed refresh

## V1 Tradeoffs

Using `localStorage` tokens is not the strongest browser security model, but it is the fastest way to align with the existing POS bearer-token backend without requiring server-side cookie work or a separate auth redesign.

That tradeoff is acceptable here because:

- this is an internal staff display
- the goal is operational access, not public internet exposure
- the server already expects bearer and refresh tokens
- we need auth before we can reliably test the board endpoint

## Implementation Notes

The next implementation plan should add:

- auth types and token storage helpers
- auth context/provider
- login screen and auth gate in `App`
- authenticated fetch wrapper for the board endpoint
- tests for login, persistence, refresh, and forced re-login
