# POS Native Expo Kitchen Snapshots Design

**Repo:** `pos-native-expo`

**Goal:** Define the changes this till app needs in order to publish live kitchen-display snapshots for open bills, without taking on display rendering, ResOS polling, or kitchen-screen-specific merge logic.

**Boundary:** This repo owns bill-derived kitchen snapshots only. It does not own the kitchen display UI, the display server API, or direct ResOS integration for the kitchen screen.

## Responsibility

This app should answer one question reliably:

> Given the current state of an open bill, what is the current kitchen-relevant snapshot that downstream systems should display?

That means this repo is responsible for:

- detecting bill changes that affect kitchen-visible output
- deriving the kitchen-relevant subset of the bill
- classifying the bill into a display reference shape that downstream services can understand
- publishing or deleting the snapshot in Redis

This repo is not responsible for:

- polling ResOS
- merging bookings with till state
- rendering kitchen layouts
- handling kitchen touchscreen interactions

## V1 Product Rules

- the till remains the source of truth for order lifecycle
- the kitchen screen is read-only
- snapshots represent the current outstanding kitchen state of the open bill
- snapshots disappear when the bill is paid and closed
- bills with no kitchen-relevant items do not create active display snapshots

## Trigger Points

The snapshot publisher should run whenever one of these actions changes the kitchen-visible state of an open bill:

- item added
- item removed
- quantity changed
- modifier changed
- item moved between bills if supported
- bill moved to a different table reference
- bill reopened or restored if that workflow exists
- bill completed and paid

The implementation should centralize this trigger logic so the app does not end up with multiple partially consistent snapshot writers.

## Snapshot Content

The published snapshot should contain only the information required for the downstream kitchen display system to merge and render live state.

### Required Fields

- `billId`
- `billRef`
- `displayRef`
- `serviceType`
- `updatedAt`
- `hasOpenBill`
- `items`

### Useful Optional Fields

- `partyName` if the till already has a meaningful local customer label
- `covers` if tracked locally
- `notes` if there is a clean kitchen-relevant bill note concept

### Item Shape

Each item should include:

- stable item or bill-item identifier
- display name
- quantity
- kitchen grouping label such as print category short name
- modifier lines that matter to the kitchen

The payload should not try to mirror the full local bill schema. It should stay lean and display-oriented.

## Kitchen Item Filtering

The snapshot builder should reuse the same category and printer-group concepts already present in this repo.

Rules:

- include only items that belong to kitchen-relevant print categories or printer groups
- exclude non-kitchen items such as purely receipt-only entries
- preserve modifier text needed for prep
- preserve grouping information needed downstream for readable display

The important constraint is consistency: the same item selection logic used for kitchen printing should also drive the kitchen-display snapshot as much as possible.

## Display Reference Classification

This repo should publish enough information for the standalone kitchen-display server to separate dine-in from takeaway, but it should avoid inventing a deep new takeaway model in v1.

### Dine-In

- use the real table reference as `displayRef`
- publish `serviceType: "dine_in"`

### Takeaway

Because takeaway is not yet a first-class till concept, v1 should use a lightweight adapter:

- identify bills whose references sit outside the dine-in table range, or match any existing takeaway markers
- publish `serviceType: "takeaway"`
- preserve the raw bill reference so the downstream server can assign a stable `TA` alias for display

This keeps the current till behavior intact while making the downstream separation explicit.

## Inference Limits

This repo must stay conservative about what it claims from till data alone.

For v1:

- do not infer joined-table relationships
- do not infer party size from item counts, `mains` counts, or total kitchen items
- do not publish guessed satellite tables around one billing table reference
- publish only the billing table reference the till actually knows

The downstream display may show booking covers from ResOS when a booking exists, but till-derived kitchen snapshots should not pretend to know the physical footprint of a party when the till does not model that explicitly.

## Redis Contract

This repo writes snapshots into Redis. It should not assume Redis is read directly by the kitchen browser client.

### Key Strategy

- `kds:table:<tableRef>` for dine-in
- `kds:takeaway:<rawBillRef>` for takeaway-like bills

### Write Rules

- upsert on every kitchen-relevant bill change
- overwrite the full snapshot instead of patching partial fields
- delete the key when the bill is paid and closed
- delete the key when an open bill no longer contains kitchen-relevant items

Overwriting the whole snapshot keeps the downstream read model simple and avoids subtle merge bugs.

## Failure Handling

If Redis is temporarily unavailable:

- the till should not block core sales flow
- snapshot publication failure should be logged and surfaced as a recoverable sync-style error
- the app should prefer retryable failure over pretending publication succeeded

This feature is operationally useful, but it must not endanger checkout.

## Architecture Notes

The snapshot-writing code should live near the existing bill and kitchen-print logic rather than as an isolated parallel system. The closer it stays to current kitchen-print derivation, the less likely it is to drift from what staff expect.

Recommended internal structure:

- a pure snapshot-builder function from bill state to display payload
- a classifier for dine-in vs takeaway-like references
- a publisher adapter that writes or deletes Redis keys
- thin orchestration hooks at the bill mutation points

This keeps business rules testable without requiring end-to-end app execution.

## Testing Strategy

### Unit Tests

- kitchen item filtering matches expected print-category behavior
- modifier lines are preserved correctly
- dine-in references map to `kds:table:*`
- takeaway-like references map to `kds:takeaway:*`
- empty kitchen snapshot results in delete behavior

### Integration-Level Verification

- adding an item updates the snapshot
- removing the last kitchen item clears the snapshot
- paying the bill clears the snapshot
- moving a bill between tables moves the published reference cleanly

## Out Of Scope

- direct ResOS calls from this app for kitchen-display purposes
- browser-facing kitchen-display APIs
- display sorting or visual grouping rules
- kitchen acknowledgement states
- inferred joined-table or inferred large-party signals

## Handoff To Other Repos

The downstream system is expected to work like this:

- `pos-native-expo` writes snapshots to Redis
- `kitchen-display-server` reads Redis and merges snapshots with ResOS bookings
- `kitchen-display-react` polls the server API and renders the operations screen

This repo should keep its contract narrow so those later repos can evolve independently.
