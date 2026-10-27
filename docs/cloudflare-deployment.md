# Kitchen display on Cloudflare

Initially deployed 9 October 2026 as `pos-kd-app`; the current Worker is `pos-kitchen` in account
`70ac66aefe915b84ea0517e253f40d2e`.

- Production: https://kitchen.nomi.restaurant
- Worker address: https://pos-kitchen.manager-70a.workers.dev
- API upstream: https://pos-server.manager-70a.workers.dev
- Initial deployment version: `36935bd0-5717-45a0-a381-f42f40119bb4`

The Vercel deployment was unused and has not been changed or removed.
This deployment includes the current local working tree. Git auto-deploy is not
configured; commit the changes before relying on a fresh checkout for releases.

## Connect the kitchen computer

1. In backoffice, generate a device pairing code named Kitchen Display.
2. Open the production address on the kitchen computer and enter the code.
3. Install the app from the browser to retain the fullscreen PWA experience.

Pairing is restricted to the configured restaurant. This uses the server's existing
device session type, with its existing device permissions. The kitchen proxy
exposes only board reads, pairing, and refresh. Session tokens stay on that browser;
clearing its storage requires pairing again. Revoke the device from backoffice
to disconnect it. Browser tabs coordinate refreshes with Web Locks where supported.

The server no longer supports the old email/password sign-in endpoint.
Access tokens renew on an expired-session response. Refresh attempt identifiers
are saved before renewal so an interrupted response can be retried safely.
Token pairs are stored atomically before the board is retried.

## Bookings source

This display uses bookings-api exclusively through the POS server's authenticated
`GET /api/kd/board/diary` endpoint. The server merges bookings-api's kitchen feed
with live till snapshots. The proxy rejects the retired `/api/kd/board` route;
there is no source flag, ResOS fallback, or alternate response format.

The existing kitchen computer keeps its pairing. There is no staged device rollout.
The POS server must have `BOOKING_DIARY_ORIGIN`, `BOOKING_DIARY_RESTAURANTS_JSON`
(the organization-to-restaurant-slug mapping), and its `BOOKINGS_AUTH_*` signing
configuration set, with the corresponding issuer trusted by bookings-api.
These are server settings, never browser environment variables.

Bookings use the API's departure times and table references; the redacted feed
contains no guest names or booking creation times. If bookings-api is unavailable,
the display shows a bookings warning and continues displaying live till activity.

## Commands

Use Yarn Classic 1.22.22, matching `packageManager` in `package.json` and the
committed v1 lockfile. In Cloudflare Workers Builds, set the build variable
`YARN_VERSION=1.22.22` under Settings > Build > Build variables. This is a build
environment variable, not a Worker runtime variable or secret. Without the
override, the build image can use Yarn 4 and fail with YN0028 while attempting
to migrate the lockfile. Keep immutable/frozen installs enabled.

For Git builds, use `yarn build:cloudflare` as the build command and
`npx wrangler deploy` as the deploy command.

```sh
yarn install --frozen-lockfile
yarn test
yarn dev:cloudflare
yarn deploy:check
yarn deploy
```

The Cloudflare build uses `.env.cloudflare` to route browser requests to same-origin
`/api/*`. The Worker has the upstream origin and restaurant ID in `wrangler.jsonc`.
Do not put credentials in Vite variables. `yarn dev:cloudflare` runs the built app
locally while proxying API requests to the configured production server.
`yarn dev` remains a direct-API Vite development mode using the local `.env` file.

The service worker caches app assets only, excludes API navigation fallback, and
does not cache board responses or tokens. The PWA manifest retains fullscreen mode.
Cloudflare serves API responses with `Cache-Control: no-store` and prevents upstream
redirects from forwarding credentials elsewhere.

## Verification

- 74 existing/new tests passed; two additional board-renewal integration tests passed.
- Production TypeScript/Vite/PWA build and Wrangler dry run passed.
- Local Cloudflare runtime renders the pairing screen correctly.
- Cloudflare reports successful Worker upload and custom-domain attachment.
- Live HTTP/browser checks from this machine encountered connection resets/timeouts.
  End-to-end production pairing and authenticated board loading still need checking
  on the kitchen computer. No device was paired during deployment.

To roll back a later Cloudflare release, use `wrangler rollback <version-id>` for
the verified prior version. No other Worker, DNS hostname, or server settings need
to change for a kitchen-display release.
