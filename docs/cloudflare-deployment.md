# Kitchen display on Cloudflare

Deployed 9 October 2026 to Worker `pos-kd-app` in account
`70ac66aefe915b84ea0517e253f40d2e`.

- Production: https://kitchen.nomi.restaurant
- Worker address: https://pos-kd-app.manager-70a.workers.dev
- API upstream: https://positive-server.manager-70a.workers.dev
- Version: `36935bd0-5717-45a0-a381-f42f40119bb4`

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

## Commands

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
