# Kitchen Display UI Design

**Date:** July 18, 2026

**Repo:** `pos-kd-app`

**Goal:** Design a kitchen-facing React UI that uses a simplified ResOS-style service timeline as context, overlays live till activity as the source of truth, and preserves a separate right-hand kitchen workload view for in-house and takeaway orders.

## Product Direction

This UI is not a kitchen workflow tool in v1. It is a read-only operational board.

It has to do three jobs at once:

- show the shape of service across the day
- show what tables are actually live according to the till
- show kitchen workload in a compact, glanceable form

The main design decision is that **till truth outranks ResOS context**.

That means:

- ResOS bookings are displayed as background planning context
- live till state is displayed as the foreground operational signal
- if the two systems disagree, the UI should show the mismatch honestly rather than visually forcing them to align

## Layout

The UI should use a split landscape layout with the left pane as the dominant surface.

- Left pane: approximately 65% width
- Right pane: approximately 35% width

### Left Pane

The left pane should be a simplified ResOS-inspired timeline view.

- horizontal service axis from `12:00` to `22:00`
- one row per table
- rows grouped by floor or service area
- table number fixed at the left edge of each row

This should feel familiar to staff who know the ResOS planning screen, but the kitchen version should remove non-essential complexity such as booking actions, controls, or dense reservation management affordances.

### Right Pane

The right pane should remain a card-based active-orders panel.

- top section: `In House`
- bottom section: `Takeaway`
- fallback section: `Needs Review` if the backend cannot confidently classify an order

Cards should be stable and non-animated except when the underlying data changes.

## Left Pane Visual Model

Each table row should contain two layers.

### Layer 1: ResOS Booking Context

Bookings should appear as muted background bars positioned on the `12:00-22:00` axis.

Booking bars communicate:

- expected service timing
- booking or guest name
- covers when ResOS provides them

Booking bars should use low contrast and should not compete with the kitchen signal.

ResOS in this view is a forecast, not an authority.

### Layer 2: Till Truth Overlay

Live till activity should render as a foreground overlay bar on the same table row.

Rules:

- the bar starts at bill `createdAt`
- the bar extends to `now`
- it grows over time as the bill remains open
- it appears whether or not there is a matching ResOS booking

This gives kitchen staff an honest picture of how long a table has actually been live without pretending the UI knows when the table will finish.

### Mismatch Handling

If till state does not match ResOS booking context:

- still show the live till bar
- do not reposition it to artificially match a booking
- do not hide it because ResOS does not know about it

Examples:

- walk-in with open bill and no booking: show live overlay only
- open till bill on a table whose booking has different timing: show both bars in their actual positions
- booked table with no open bill: show booking context only

This mismatch handling is a core v1 behavior, not an edge case.

## Left Pane Bar Content

The axis and row already communicate table number and timing, so the live overlay should not waste space repeating them.

Instead, the live overlay should prioritize kitchen-relevant status.

Primary in-bar labels:

- `Active`
- `Food Ordered`
- `Called`

These states refer to service state, not kitchen receipt state alone.

`Called` should mean a later service moment rather than simply “items exist.”

If the overlay has enough width, it may additionally show a compact workload hint such as a category count summary, but status should remain the primary label.

## Status Color Language

Color should reinforce the status state.

Recommended v1 palette direction:

- `Active`: subdued neutral or slate-blue
- `Food Ordered`: amber or warm yellow
- `Called`: stronger green or teal

Exceptional states such as stale data, sync problems, or unassigned classification should use a separate warning/error palette and should not share the normal service-state colors.

## Right Pane Cards

The right pane should answer a different question from the left pane.

- left pane: what is happening in the room and across service time
- right pane: what kitchen workload is currently outstanding

Cards should therefore summarize workload rather than list every item inline.

Each card should show:

- display reference
- guest or booking label when present
- current live status
- summary counts grouped by print category

Example summary:

- `2 starters`
- `3 mains`
- `2 sides`
- `1 dessert`

This is more useful on a board than a full dish list because kitchen staff can scan load shape quickly.

## Detail View

Selecting either a live timeline bar or a right-pane card should open the same read-only detail view.

The detail view should include:

- display reference
- booking label if available
- live status
- created time / last updated time
- full print-category summary
- full kitchen item list
- modifiers

The detail view should remain read-only in v1.

## Data Contract Expectations

This UI benefits from a slightly richer API contract than the first minimal React scaffold.

The server response should include:

- booking timeline data with start and end times
- floor or area grouping
- live till bill `createdAt`
- live till status such as `active`, `food_ordered`, `called`
- category summary counts by print category
- full kitchen snapshot for detail view

The frontend may calculate some summaries as a fallback, but category grouping should preferably come from the server so the display stays aligned with the backend’s kitchen-print logic.

## Degraded States

Degraded states should preserve operational trust.

### ResOS Unavailable

- keep the left pane timeline structure visible if possible
- remove or dim booking context bars
- continue showing live till overlays
- show a visible warning that booking context is unavailable

### Till / Live Snapshot Unavailable

- keep booking context visible
- do not silently show an empty kitchen state
- show a prominent warning that live order data is stale or unavailable

### Unclassified Orders

- do not drop them
- place them in a visible `Needs Review` lane on the right when classification fails

## V1 Scope Boundary

Included:

- simplified ResOS-style left timeline
- live till overlay from `createdAt -> now`
- status-color language for live bars
- right-pane in-house and takeaway cards
- category-summary cards by print category
- read-only detail view

Excluded:

- kitchen-side state mutation
- speculative finish-time prediction
- inferred joined-table geometry
- inferred party size from ordered items
- full reservation-management controls

## Why This Design Fits V1

This direction matches the operational truth of the system:

- the till is the live source of truth
- ResOS is useful planning context, but not authoritative
- the kitchen needs time-based room awareness and workload awareness at once
- category summaries are more scan-friendly than raw item lists
- a growing live bar communicates elapsed service time honestly without pretending the system knows the table’s future

## Implementation Notes

The current React scaffold should be revised in a follow-up implementation plan to:

- replace the simple left-side list with a real time-axis timeline grid
- extend the API types with booking intervals, `createdAt`, status, and category summaries
- shift the right-side cards from raw inline item lists to grouped print-category summaries
- keep the detail drawer as the full-fidelity item breakdown view
