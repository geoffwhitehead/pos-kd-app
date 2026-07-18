# Kitchen Display API Base URL Design

**Date:** July 18, 2026

**Repo:** `pos-kd-app`

**Goal:** Configure the kitchen display React app to call the real POS server at `https://positive-server.herokuapp.com` through an explicit Vite environment variable instead of hardcoded relative paths.

## Product Direction

The app should use one explicit API base URL for all server communication.

This config should:

- support the real hosted POS server now
- avoid hardcoding production hostnames inside API helpers
- make it easy to switch between hosted and local backends later

The approved direction is:

- use `VITE_API_BASE_URL`
- do not silently fall back to a hardcoded default in application code

## Scope

Included:

- add one shared API base URL config helper
- use that helper for auth sign-in requests
- use that helper for kitchen board requests
- add a local `.env` entry for the current hosted server

Excluded:

- changing auth behavior
- changing polling behavior
- changing endpoint paths
- adding multi-environment runtime switching UI

## Existing Problem

The current app uses relative URLs:

- `POST /api/auth/signin`
- `GET /api/kd/board`

That only works when the frontend is served from the same origin as the API or when a proxy is in place. For direct testing against the hosted server, the client needs an explicit base URL.

## Chosen Design

Add a small config module, for example:

- `src/config/api.ts`

This module should read:

- `import.meta.env.VITE_API_BASE_URL`

It should expose one normalized base URL string for the rest of the app.

Expected initial local value:

```env
VITE_API_BASE_URL=https://positive-server.herokuapp.com
```

## API Usage

The app should build requests from that base URL.

Examples:

- sign-in: `${apiBaseUrl}/api/auth/signin`
- board: `${apiBaseUrl}/api/kd/board`

The auth/session logic stays unchanged. This is only a host configuration change.

## Failure Behavior

If `VITE_API_BASE_URL` is missing, the app should fail fast in development with a clear error instead of guessing a fallback host.

That avoids accidental requests to the wrong backend and makes deployment configuration explicit.

## Testing Strategy

Add a small test that verifies request helpers compose URLs against the configured base URL rather than relative paths.

This is enough for this slice because:

- auth behavior is already covered elsewhere
- board behavior is already covered elsewhere
- this change is about request composition, not UI behavior

## Why This Design

This approach is preferred over hardcoding the Heroku URL because:

- it keeps deployment configuration outside source logic
- it supports local development later without another refactor
- it makes the current server target explicit
- it reduces the risk of accidentally shipping environment-specific code paths

## Implementation Notes

The follow-up implementation plan should:

- add the shared API config module
- update `src/api/auth.ts`
- update `src/api/fetchKitchenDisplay.ts`
- add `.env` with the hosted base URL
- update request tests to expect absolute URLs based on config
