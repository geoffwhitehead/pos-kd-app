# Kitchen Display PWA Design

## Goal

Turn the kitchen display React app into an installable Progressive Web App that:

- launches as a dedicated fullscreen app from the home screen
- hides normal browser chrome when opened in installed mode
- feels like the only purpose of the machine without enforcing a hard kiosk lock
- keeps the shell available when connectivity drops
- continues to show the existing unavailable-state messaging instead of pretending live kitchen data works offline

This is intended for a single-purpose kitchen display computer that remains on continuously, with staff only occasionally turning the screen off.

## Scope

In scope:

- PWA manifest configuration
- service worker registration through Vite
- installability support
- fullscreen or standalone display mode for installed launches
- branded app name, theme color, and icons
- caching of static app shell assets
- preservation of current network-driven board behavior
- explicit offline or unavailable behavior that keeps the app frame visible
- tests for registration and build-level verification

Out of scope:

- true offline kitchen board data access
- background sync for board data
- push notifications
- hard browser kiosk lockdown
- multi-route app shell navigation
- native wrapper packaging

## Product Behavior

### Installed App Experience

The app should be installable on supported browsers and launch from the device home screen as its own app.

Installed launches should:

- open without the normal browser tab bar and address bar
- prefer fullscreen presentation for a dedicated display feel
- preserve the current login and board flow
- reopen quickly after the screen has been turned off and back on

The browser version should continue to work normally for local development and fallback access.

### Always-On Screen Behavior

The device is not a staff-operated workstation. It is a dedicated glanceable display.

That means the PWA should optimize for:

- fast app relaunch
- minimal prompts
- minimal maintenance interaction
- quiet updates rather than manual refresh decision-making during service

The app should not add an intrusive install prompt or any workflow that assumes active operator input.

### Offline or Unavailable State

When the network is unavailable, the app should continue to render the existing shell and screen structure.

Expected behavior:

- cached static assets allow the application shell to open
- live auth and board requests still go to the network
- if those requests fail, the app falls back to the current `data unavailable` style messaging and warning states
- there is no dedicated offline page

This preserves continuity for the kitchen team while staying honest about live data freshness.

### Update Behavior

Because staff rarely interact with the machine, updates should not interrupt service with a prompt.

Recommended update model:

- new app assets download in the background
- the new version becomes active on the next full reload or app relaunch
- there is no mid-service forced UI swap and no operator-facing “update available” banner in the first version

## Technical Approach

### Recommended Option

Use `vite-plugin-pwa`.

Why:

- it fits the existing Vite stack cleanly
- it handles manifest generation and service worker integration with less custom code
- it keeps future maintenance lower than a hand-written manifest and service worker setup

### Manifest

Add a web app manifest tailored to the kitchen display.

Recommended manifest characteristics:

- app name specific to the kitchen display
- short name suitable for a tablet home screen
- `display: "fullscreen"` or the closest stable installed behavior supported by target browsers
- `start_url: "/"` or the app root
- explicit theme and background colors matching the current dark operations board
- icon set for install surfaces

If browser support makes `"fullscreen"` inconsistent, we should degrade gracefully to `"standalone"` rather than forcing fragile platform-specific workarounds.

### Service Worker Strategy

Use a conservative service worker strategy.

Cache:

- built JavaScript bundles
- CSS
- HTML app shell
- manifest
- icons

Do not aggressively cache:

- authenticated board API responses
- sign-in requests
- other live operational data

Runtime network behavior should be:

- app shell: cache-first
- live board/auth data: network-first or effectively no-cache

This keeps launches fast without risking misleading stale kitchen snapshots.

### Registration

Register the service worker in the React entrypoint using the plugin’s recommended pattern.

Registration should:

- work in production builds
- stay unobtrusive in development
- avoid adding manual update UI in the first version

## UI and Branding

The PWA additions should not change the main kitchen display layout.

Visible UI additions should be minimal:

- no install CTA in the main board
- no dedicated offline screen
- no new navigation or settings surface

Branding assets should support:

- home-screen icon
- app splash identity where supported
- dark theme integration with the browser and installed shell

## Error Handling

The application should continue using the current warning banner and unavailable states when live requests fail.

The new PWA layer should not swallow or replace those states.

Failure cases:

- if shell assets are cached but API calls fail, show the board shell with unavailable warnings
- if the app is opened for the very first time without connectivity, behavior may be limited because the shell has not yet been cached; this is acceptable for the first version

## Testing

Tests should be added before implementation code for the new behavior.

Coverage should include:

- Vite PWA configuration shape where practical
- manifest metadata expectations
- service worker registration path or wrapper behavior
- no regression in the existing app startup flow

Verification should include:

- full test suite
- production Vite build
- confirmation that production output includes PWA assets such as the manifest and service worker artifacts

## Risks and Tradeoffs

### Risk: stale live data appearing trustworthy

Mitigation:

- do not cache live board payloads as offline content
- preserve current unavailable warnings when the network fails

### Risk: browser-specific fullscreen differences

Mitigation:

- prefer standards-based manifest settings
- accept `standalone` behavior where browsers do not fully honor `fullscreen`

### Risk: updates changing the board during service

Mitigation:

- avoid operator-facing update prompts
- allow new versions to take effect on relaunch or reload

## Implementation Outline

The implementation should likely proceed in this order:

1. add the PWA dependency and Vite configuration
2. add manifest metadata and icon assets
3. register the service worker in app startup
4. configure shell-only caching and network-first live requests
5. verify the current unavailable-state behavior still shows during failed live fetches
6. add focused tests and run full build verification
