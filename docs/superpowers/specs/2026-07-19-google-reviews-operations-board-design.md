# Google Reviews Operations Board Design

## Goal

Add a Google reviews feature to the kitchen operations board that:

- introduces a typed adapter for Google Places review data
- uses mocked review data immediately while live Google access is pending
- surfaces reviews in the footer rail without disrupting service workflows
- allows staff to open a full review detail view in the right pane

This first version is intentionally designed around a small number of reviews, with the current mocked set based on two visible reviews captured on Sunday, July 19, 2026.

## Scope

In scope:

- raw Google Places review types
- normalized app review types
- adapter from Google Places review payloads into app review models
- mocked review source using the two current reviews
- footer reviews rail sharing space with bill calls
- right-pane review detail view
- selection state so only one detail source is open at a time
- tests for the adapter and the new review UI behavior

Out of scope:

- live Google API fetching
- API key or OAuth wiring
- persistence of reviews
- pagination or archival browsing
- image gallery rendering from Google review photos
- replacing bill calls as the primary footer concern during service

## Product Behavior

### Footer Rail

The footer remains the home for low-frequency operational signals that do not need permanent placement in the main board.

Bill calls remain first priority. Reviews are added as a second footer block in the same overall rail. The page layout should remain stable:

- bill calls always render first
- reviews render in their own adjacent or stacked section within the footer container
- if there are no bill calls, the reviews section can occupy more visible space
- if bill calls are present, reviews should remain visible in a compact form rather than forcing major layout shifts

The footer should not collapse or disappear when there are no reviews. Empty states should remain explicit.

### Review Cards

Footer review cards are compact and glanceable. Each card should show:

- reviewer name
- star rating
- published time
- `NEW` marker when published within 25 hours of the board time
- one short preview line from the review text

Cards should be clickable and visually distinct from bill call chips, while still fitting the existing footer language.

### Right Pane Detail

The right pane supports one detail target at a time:

- active order detail
- review detail

Selecting a review replaces any currently shown order detail. Selecting an order replaces any currently shown review detail.

The review detail pane should show:

- reviewer name
- rating
- published time
- `NEW` treatment if applicable
- full review text
- optional link to Google Maps review URL when available

If the review has no body text, the pane should still render the author, rating, time, and any available link.

## Data Design

### Raw Google Places Types

Add a dedicated type file for the raw Places review schema documented by Google. The local type should model the fields we are likely to receive and care about in the UI:

- `name`
- `relativePublishTimeDescription`
- `rating`
- `publishTime`
- `googleMapsUri`
- `flagContentUri`
- `visitDate`
- `text`
- `originalText`
- `authorAttribution`

The raw type should stay close to Google’s documented shape so that future API integration is low-friction.

### Normalized Review Type

Create an app-level normalized review model for the board. This should avoid leaking Google-specific nesting into components.

Recommended fields:

- `id`
- `source`
- `authorName`
- `authorProfileUri`
- `authorPhotoUri`
- `rating`
- `publishedAt`
- `relativePublishedText`
- `text`
- `originalText`
- `googleMapsUri`
- `isNewWithin25Hours`

`source` should distinguish mocked data from future live API data:

- `"mock"`
- `"google_places"`

### Adapter

Create a small adapter layer that converts Google Places reviews into normalized review models.

Responsibilities:

- flatten nested Google fields
- prefer localized text where present
- fall back to original text where localized text is absent
- derive `isNewWithin25Hours` from `publishedAt` relative to the board time
- create a stable `id` using Google review `name`

The adapter should be deterministic and easy to test in isolation.

### Mock Source

Create a mock review source file that exports two normalized reviews representing the current visible reviews.

The mock data should:

- mirror the real normalized model
- include one review from approximately 3 hours ago
- include one review from approximately 1 day ago
- preserve the current first review text shown in the screenshot
- support missing-body behavior for the second review if the visible content is incomplete

The mock source should feed the UI directly for now, without pretending to be a network response.

## Component Design

### New Components

Add focused components rather than extending bill call rendering with conditionals:

- `ReviewsFooter`
  - owns the compact footer reviews section
  - renders empty state when there are no reviews
- `ReviewCard`
  - compact preview card for the footer
- `ReviewDetailDrawer`
  - full right-pane review detail view

These components should mirror the current order-detail architecture so the screen logic stays understandable.

### Screen State

`KitchenDisplayScreen` should move from a single `selectedDisplayRef` model toward a single detail target model that can represent either kind of selection.

Recommended shape:

- `null`
- `{ type: "order", displayRef: string }`
- `{ type: "review", reviewId: string }`

This keeps the right-pane contract explicit and prevents order/review selection conflicts.

## Layout and Styling

Reviews should feel calm and readable rather than promotional.

Footer review cards:

- small, compact, horizontally scannable
- compatible with the existing dark board theme
- subtle `NEW` treatment
- no oversized avatars or imagery in the first version

Right-pane review detail:

- cleaner, softer reading surface similar to the cheque drawer’s paper-like tone
- full review text prioritized over decorative metadata
- star rating easy to scan
- `NEW` marker and published time near the top

The feature should not introduce major reflow in the board’s main planner area.

## Error Handling and Empty States

First version behavior:

- if the mocked review list is empty, show `No recent reviews.`
- if a review lacks text, still show metadata and a fallback note such as `No review text provided.`
- if a review lacks a Google Maps URI, omit the external link instead of rendering a disabled control

Because this version is mock-backed, there is no fetch error state yet.

## Testing

Tests should be added before implementation code for each behavior change.

Coverage should include:

- adapter maps Google review payloads into normalized review objects
- adapter derives `isNewWithin25Hours` correctly
- adapter chooses text fallback correctly
- footer renders reviews and empty state
- clicking a review opens review detail in the right pane
- selecting an order still opens order detail
- selecting a review replaces order detail, and vice versa

## Implementation Notes

Suggested file additions:

- `src/types/googleReviews.ts`
- `src/lib/googleReviews.ts`
- `src/test/fixtures/googleReviews.ts`
- `src/components/ReviewsFooter.tsx`
- `src/components/ReviewDetailDrawer.tsx`

Likely touched files:

- `src/screens/KitchenDisplayScreen.tsx`
- `src/screens/KitchenDisplayScreen.test.tsx`
- shared screen styles if needed

## Open Decisions Resolved

These decisions are fixed for this implementation cycle:

- source is typed adapter plus mocked data
- footer reviews coexist with bill calls
- right pane is shared between order detail and review detail
- only one detail target is shown at a time
- first version is text-first, without rendering review photos

## Success Criteria

The feature is successful when:

- the repo contains a clean typed boundary for Google Places reviews
- two mocked reviews render on the board without live API access
- reviews are visible in the footer without disrupting bill calls
- clicking a review opens a readable full review in the right pane
- the new behavior is covered by focused tests
