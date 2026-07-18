# Kitchen Display Multi-Repo Architecture

**Purpose:** Record the agreed top-level split across the three repos involved in the kitchen display system.

## Repo Split

### `pos-native-expo`

Owns till-side bill changes and publishes kitchen snapshots into Redis.

### `kitchen-display-server`

Owns operational aggregation. It reads Redis snapshots, polls ResOS, merges the two into one read model, and exposes a browser-safe HTTP API.

### `kitchen-display-react`

Owns rendering only. It polls the server API, shows the split kitchen operations screen, and opens read-only detail views.

## Data Flow

`pos-native-expo` -> Redis snapshots

`kitchen-display-server` -> reads Redis + polls ResOS -> serves merged API

`kitchen-display-react` -> polls server API -> renders kitchen display

## Important Non-Goals

- the React app should not connect to Redis directly
- the React app should not poll ResOS directly
- `pos-native-expo` should not own bookings merge logic
- the server should not own till mutation workflows
- no repo should infer joined-table footprints or party size from kitchen item counts alone in v1

## Reasoning

This split keeps credentials and integration complexity off the browser, gives the kitchen screen one stable API, and lets each repo keep a single clear responsibility.
