# Kitchen Operations Display Design

> Superseded as a cross-repo v1 draft by:
> - `2026-07-16-pos-native-expo-kitchen-snapshots-design.md`
> - `2026-07-16-kitchen-display-multi-repo-architecture.md`
>
> Keep this document only as the original exploratory product-direction spec that led to the repo split decision.

**Goal:** Add a simple kitchen-facing touchscreen display that combines live till state with ResOS bookings, while preserving the current paper-cheque workflow and avoiding any kitchen-side interaction requirements.

**Primary outcome:** Give kitchen staff one screen that shows what is booked, what is actually seated or ordering, and what kitchen-printable items are currently outstanding for each live bill.

**Tech shape:** Keep the first version read-only. Derive kitchen display state from till-side bill data plus ResOS polling. Store live kitchen snapshots in Redis so the display can poll a single lightweight source.

## Problem Framing

The kitchen screen needs to do more than replace paper cheques:

- show upcoming bookings for the night
- show an overview of the room, including walk-ins that ResOS does not know about
- act as a backup if paper kitchen printing is missed or unavailable
- surface current kitchen-relevant items for open bills
- keep takeaway visible without pretending takeaway orders are real restaurant tables

The key constraint for v1 is operational: the kitchen will not maintain states such as `ready`, `served`, or `cleared` on the touchscreen. The display must therefore remain a passive projection of till-side truth.

## V1 Product Decision

Build a split kitchen operations board instead of a pure KDS carousel or a pure bookings board.

- Left side: booking timeline/list, styled similarly to a ResOS-style service plan
- Left overlay: stronger live-state markers for tables that currently have open till bills
- Right side: active order cards showing the current outstanding kitchen snapshot for each live bill
- Right-side grouping: `In House` and `Takeaway`
- Interaction: tapping a table row or order card opens a read-only detail view with the full kitchen-item snapshot for that bill

This balances the three jobs the screen actually needs to do: service forecasting, room awareness, and kitchen backup.

## Scope

### In Scope

- read-only kitchen display screen
- merge of live till state with ResOS bookings
- Redis-backed live order snapshots keyed by display reference
- support for walk-ins through live till occupancy overlay
- support for takeaway through a separate display lane
- current-snapshot-only kitchen items for each open bill
- automatic disappearance of orders when the bill is paid and closed

### Out Of Scope

- kitchen-side acknowledgement or workflow states
- replacing printed kitchen cheques as the operational primary
- true event sourcing of every kitchen send/edit action
- historical analytics
- a full till-side takeaway domain model rewrite

## Data Model

Redis should hold one current snapshot per active display reference rather than a long event log.

### Redis Key Strategy

- `kds:table:<tableRef>` for dine-in tables such as `1`, `2`, `22`
- `kds:takeaway:<orderRef>` for takeaway display references such as `TA1`, `TA2`

The namespace should stay display-oriented rather than bill-oriented because the screen is organized around operational references that staff recognize.

### Snapshot Payload

```json
{
  "displayRef": "12",
  "serviceType": "dine_in",
  "billId": "bill_abc123",
  "billRef": "12",
  "partyName": "Walker",
  "bookingName": "Walker",
  "bookingTime": "2026-07-16T19:30:00Z",
  "covers": 4,
  "updatedAt": "2026-07-16T18:42:10Z",
  "hasOpenBill": true,
  "items": [
    {
      "billItemId": "item_1",
      "name": "Fish and Chips",
      "quantity": 2,
      "printCategory": "Kitchen",
      "course": null,
      "modifiers": ["No peas"]
    }
  ]
}
```

### Snapshot Rules

- only include items assigned to kitchen-printable categories or printer groups
- store the current outstanding snapshot, not a historical trail
- overwrite the snapshot whenever the till-side bill changes in a way that affects kitchen-visible items
- delete the key when the bill is fully paid and closed
- do not create keys for bills that have no kitchen-relevant items

## Data Flow

### Till To Redis

When a bill is created or updated, the till should derive the subset of bill items relevant to the kitchen display and upsert a Redis snapshot for the matching display reference.

Likely trigger points:

- item added
- item removed or quantity changed
- modifier changed
- bill moved to another table
- bill completed and paid

For v1, this should be framed as “what kitchen items are outstanding on the open bill right now” rather than “what has been printed before.”

### ResOS To Display

The display service should poll ResOS every 60 seconds and normalize bookings into a table-indexed view model:

- booking time
- table assignment
- guest or booking name
- covers
- booking status if available

This data does not need to live in Redis unless it becomes useful for caching or rate limiting. A first pass can keep bookings in display-service memory and merge them with Redis-backed live order snapshots at read time.

### Display Read Path

The touchscreen app should poll one backend endpoint every 5 seconds instead of polling Redis and ResOS separately from the client.

Recommended shape:

- backend service polls ResOS
- backend service reads Redis snapshots
- backend service returns one merged payload to the React app

This keeps credentials, merge logic, and fallback behavior out of the touchscreen client and gives one place to evolve the data contract.

## Display Reference Strategy

### Dine-In

Use the real table reference as the display reference. This keeps the left-hand service plan aligned with how staff already think about the room.

### Takeaway

Treat takeaway as a display concern even if the till does not yet model it explicitly.

For v1:

- infer takeaway from bill references outside the dine-in range or from any existing takeaway markers already present in data
- map those bills into a separate display lane
- assign a display label such as `TA1`, `TA2`, or a stable alias derived from the bill reference

This avoids polluting the dining-room board with fake tables like `30-40` while letting the till continue operating as it does today.

The aliasing logic should be isolated in one adapter so the later introduction of a true takeaway model does not require rewriting the UI contract.

## Inference Limits

The visual model should stay honest about what the data actually proves.

- do not infer joined-table footprints from large bills or item counts
- do not infer party size from `mains` counts or total kitchen items
- highlight only the billing table reference known by the till
- if a booking exists, covers may come from ResOS only
- if no booking exists, show live activity without a guessed cover count

## UI Design

### Layout

- left column: roughly 60% width
- right column: roughly 40% width
- landscape-first layout for the kitchen touchscreen

### Left Side: Service Board

The left side should resemble a bookings/service plan rather than a generic data table.

Each row represents a table within a vertical service list ordered by booking time and then by table number. The row should combine three layers:

- base booking shading from ResOS
- live open-bill overlay from the till in a bolder color
- tap target that opens the read-only order detail

Visual states:

- booked but not yet active
- active open bill on a booked table
- active open bill with no booking, indicating a walk-in
- empty table

Explicitly excluded in v1:

- inferred joined-table satellite states
- inferred large-party badges derived from item counts alone

This is the key value of the left side: walk-ins become visible immediately because the live till overlay can appear even when the booking layer is empty.

### Right Side: Active Orders

Show card-based current snapshots rather than a free-running carousel.

- top section: `In House`
- bottom section: `Takeaway`
- sort by most recently updated, newest first
- each card shows display reference, booking or guest label when available, and the current kitchen items

Using cards instead of a carousel avoids a common failure mode where unattended orders accumulate and the UI becomes hard to trust. Cards are also easier to scan during service because nothing moves unless the data changes.

### Detail View

Tapping a row or card opens a simple detail panel with:

- display reference
- booking name and time if present
- covers if known
- full current kitchen item list
- last updated time

The detail view remains read-only in v1.

## Error Handling And Fallbacks

### Redis Unavailable

- keep the left-side bookings board visible if ResOS data is still available
- show an explicit warning that live till order data is stale or unavailable
- never silently show an empty active-orders panel as if there are no orders

### ResOS Unavailable

- keep the right-side active orders visible from Redis snapshots
- keep the left-side table list visible but remove or dim booking shading
- show a warning that booking data is unavailable

### Partial Mapping Problems

If a bill cannot be mapped confidently to dine-in or takeaway:

- place it in a visible `Unassigned` or `Needs Review` bucket on the right side
- do not drop it from the screen

Operational visibility is more important than perfect categorization.

## Testing Strategy

### Backend

- snapshot builder tests for kitchen-item filtering
- mapping tests for dine-in vs takeaway display references
- merge tests for Redis snapshots plus ResOS bookings
- stale-data tests for Redis or ResOS outages

### Frontend

- split-layout rendering tests for empty, normal, and degraded states
- interaction test for tapping a row or card to open detail
- visual verification on the target kitchen touchscreen resolution

### Operational Verification

Before rollout, verify that:

- a booked table with no open bill appears as booked only
- a walk-in with an open bill appears without a booking layer
- a booked table with an open bill shows both layers together
- a takeaway order appears only in the takeaway lane
- paying a bill removes its snapshot from the active order area

## Design Rationale

This design intentionally favors a stable operational board over a more ambitious interactive KDS.

Why this is the right first step:

- it matches the real behavior of the kitchen team, who are not expected to manage touchscreen states
- it uses the till as the single owner of order lifecycle
- it exposes walk-ins, which pure ResOS views cannot do
- it keeps takeaway visible without corrupting the dining-room table model
- it acts as a backup to paper without trying to replace paper on day one

## Open Follow-On Work

If v1 works well, likely next steps are:

- proper takeaway typing in the till domain
- push or websocket updates instead of client polling
- configurable sort modes for active cards
- optional kitchen acknowledgement states if the team later wants them
- operational metrics such as longest-open kitchen snapshot
