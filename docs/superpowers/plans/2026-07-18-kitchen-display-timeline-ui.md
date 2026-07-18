# Kitchen Display Timeline UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evolve the current React kitchen display scaffold into a timeline-first board that uses a `12:00-22:00` ResOS-style axis as background context, overlays live till bars as the source of truth, and summarizes kitchen workload by print category on right-hand cards and in the detail drawer.

**Architecture:** Keep the existing Vite + React + TypeScript shell and polling hook, but replace the left-side list with a real time-axis timeline grid driven by richer API types. The screen remains split: a dominant timeline pane for room awareness and a secondary card pane for kitchen workload summaries, both fed by one merged server payload and one shared selection model.

**Tech Stack:** React, TypeScript, Vite, Vitest, Testing Library, CSS modules

---

## File Structure

- Modify: `src/types/kitchenDisplay.ts`
- Modify: `src/test/fixtures/kitchenDisplay.ts`
- Modify: `src/types/kitchenDisplay.test.ts`
- Create: `src/lib/timeline.ts`
- Create: `src/lib/timeline.test.ts`
- Modify: `src/lib/format.ts`
- Modify: `src/lib/sort.ts`
- Modify: `src/components/ServiceBoard.tsx`
- Delete: `src/components/ServiceBoardRow.tsx`
- Create: `src/components/TimelineAxis.tsx`
- Create: `src/components/TimelineAxis.test.tsx`
- Create: `src/components/TimelineRow.tsx`
- Create: `src/components/TimelineRow.test.tsx`
- Modify: `src/components/OrderCard.tsx`
- Modify: `src/components/OrderLane.tsx`
- Modify: `src/components/OrderLane.test.tsx`
- Modify: `src/components/OrderDetailDrawer.tsx`
- Modify: `src/components/OrderDetailDrawer.test.tsx`
- Modify: `src/screens/KitchenDisplayScreen.tsx`
- Modify: `src/screens/KitchenDisplayScreen.module.css`
- Modify: `src/screens/KitchenDisplayScreen.test.tsx`

### Task 1: Expand The API Contract For Timeline And Category Summaries

**Files:**
- Modify: `src/types/kitchenDisplay.ts`
- Modify: `src/test/fixtures/kitchenDisplay.ts`
- Modify: `src/types/kitchenDisplay.test.ts`

- [ ] **Step 1: Write the failing type coverage test**

```ts
import { describe, expect, it } from "vitest";
import { sampleKitchenDisplayResponse } from "../test/fixtures/kitchenDisplay";

describe("sampleKitchenDisplayResponse", () => {
  it("includes timeline rows and print-category summaries", () => {
    expect(sampleKitchenDisplayResponse.timeline.startHour).toBe(12);
    expect(sampleKitchenDisplayResponse.timeline.endHour).toBe(22);
    expect(sampleKitchenDisplayResponse.tables[0]?.bookings[0]?.startsAt).toBe(
      "2026-07-18T18:00:00Z"
    );
    expect(
      sampleKitchenDisplayResponse.activeOrders.inHouse[0]?.categorySummary[0]
        ?.label
    ).toBe("Mains");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/types/kitchenDisplay.test.ts`
Expected: FAIL with missing `timeline`, `bookings`, or `categorySummary` properties on the current fixture/types.

- [ ] **Step 3: Add the richer UI contract and fixture data**

```ts
// src/types/kitchenDisplay.ts
export type DataStatus = "ok" | "stale" | "unavailable";
export type LiveTableStatus = "active" | "food_ordered" | "called";

export type PrintCategorySummary = {
  key: string;
  label: string;
  count: number;
};

export type BookingSegment = {
  id: string;
  label: string;
  covers: number | null;
  startsAt: string;
  endsAt: string;
};

export type LiveTableOverlay = {
  billId: string;
  displayRef: string;
  status: LiveTableStatus;
  startsAt: string;
  endsAt: string;
  createdAt: string;
  updatedAt: string;
  categorySummary: PrintCategorySummary[];
  hasBookingMatch: boolean;
};

export type ServiceBoardRow = {
  displayRef: string;
  tableRef: string;
  floor: string;
  bookings: BookingSegment[];
  liveOverlay: LiveTableOverlay | null;
};

export type ActiveOrderCard = {
  displayRef: string;
  serviceType: "dine_in" | "takeaway" | "unassigned";
  billId: string;
  billRef: string;
  bookingName: string | null;
  partyName: string | null;
  createdAt: string;
  updatedAt: string;
  status: LiveTableStatus;
  categorySummary: PrintCategorySummary[];
  items: KitchenItem[];
};

export type KitchenDisplayResponse = {
  generatedAt: string;
  warnings: DisplayWarning[];
  bookingsStatus: DataStatus;
  liveOrdersStatus: DataStatus;
  timeline: {
    startHour: number;
    endHour: number;
    now: string;
  };
  tables: ServiceBoardRow[];
  activeOrders: {
    inHouse: ActiveOrderCard[];
    takeaway: ActiveOrderCard[];
    unassigned: ActiveOrderCard[];
  };
};
```

```ts
// src/test/fixtures/kitchenDisplay.ts
export const sampleKitchenDisplayResponse: KitchenDisplayResponse = {
  generatedAt: "2026-07-18T18:42:10Z",
  warnings: [],
  bookingsStatus: "ok",
  liveOrdersStatus: "ok",
  timeline: {
    startHour: 12,
    endHour: 22,
    now: "2026-07-18T18:42:10Z"
  },
  tables: [
    {
      displayRef: "12",
      tableRef: "12",
      floor: "Ground Floor",
      bookings: [
        {
          id: "booking_12_1",
          label: "Walker",
          covers: 4,
          startsAt: "2026-07-18T18:00:00Z",
          endsAt: "2026-07-18T19:30:00Z"
        }
      ],
      liveOverlay: {
        billId: "bill_abc123",
        displayRef: "12",
        status: "food_ordered",
        startsAt: "2026-07-18T18:10:00Z",
        endsAt: "2026-07-18T18:42:10Z",
        createdAt: "2026-07-18T18:10:00Z",
        updatedAt: "2026-07-18T18:42:10Z",
        categorySummary: [
          { key: "starters", label: "Starters", count: 2 },
          { key: "mains", label: "Mains", count: 3 }
        ],
        hasBookingMatch: true
      }
    }
  ],
  activeOrders: {
    inHouse: [
      {
        displayRef: "12",
        serviceType: "dine_in",
        billId: "bill_abc123",
        billRef: "12",
        bookingName: "Walker",
        partyName: "Walker",
        createdAt: "2026-07-18T18:10:00Z",
        updatedAt: "2026-07-18T18:42:10Z",
        status: "food_ordered",
        categorySummary: [
          { key: "starters", label: "Starters", count: 2 },
          { key: "mains", label: "Mains", count: 3 },
          { key: "sides", label: "Sides", count: 2 },
          { key: "dessert", label: "Dessert", count: 1 }
        ],
        items: [
          {
            billItemId: "item_1",
            name: "Fish and Chips",
            quantity: 2,
            printCategory: "Mains",
            course: null,
            modifiers: ["No peas"]
          }
        ]
      }
    ],
    takeaway: [],
    unassigned: []
  }
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test src/types/kitchenDisplay.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/types/kitchenDisplay.ts src/test/fixtures/kitchenDisplay.ts src/types/kitchenDisplay.test.ts
git commit -m "feat: extend kitchen display ui types for timeline mode"
```

### Task 2: Add Timeline Math And Formatting Helpers

**Files:**
- Create: `src/lib/timeline.ts`
- Create: `src/lib/timeline.test.ts`
- Modify: `src/lib/format.ts`

- [ ] **Step 1: Write the failing timeline helper tests**

```ts
import { describe, expect, it } from "vitest";
import { buildTimelineSlots, toTimelinePercent } from "./timeline";

describe("timeline helpers", () => {
  it("builds hourly slots from 12 to 22", () => {
    expect(buildTimelineSlots(12, 22)).toEqual([
      "12:00",
      "13:00",
      "14:00",
      "15:00",
      "16:00",
      "17:00",
      "18:00",
      "19:00",
      "20:00",
      "21:00",
      "22:00"
    ]);
  });

  it("maps timestamps to a percentage within the board window", () => {
    expect(
      toTimelinePercent("2026-07-18T17:00:00Z", {
        startHour: 12,
        endHour: 22,
        serviceDate: "2026-07-18"
      })
    ).toBe(50);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/lib/timeline.test.ts`
Expected: FAIL because `timeline.ts` does not exist.

- [ ] **Step 3: Implement timeline math and time formatting**

```ts
// src/lib/timeline.ts
type TimelineBounds = {
  startHour: number;
  endHour: number;
  serviceDate: string;
};

export function buildTimelineSlots(startHour: number, endHour: number) {
  return Array.from({ length: endHour - startHour + 1 }, (_, index) => {
    const hour = String(startHour + index).padStart(2, "0");
    return `${hour}:00`;
  });
}

export function toTimelinePercent(
  isoValue: string,
  bounds: TimelineBounds
) {
  const start = new Date(`${bounds.serviceDate}T${String(bounds.startHour).padStart(2, "0")}:00:00Z`);
  const end = new Date(`${bounds.serviceDate}T${String(bounds.endHour).padStart(2, "0")}:00:00Z`);
  const value = new Date(isoValue);
  const ratio =
    (value.getTime() - start.getTime()) / (end.getTime() - start.getTime());

  return Math.max(0, Math.min(100, Math.round(ratio * 100)));
}

export function buildSegmentStyle(startIso: string, endIso: string, bounds: TimelineBounds) {
  const left = toTimelinePercent(startIso, bounds);
  const right = toTimelinePercent(endIso, bounds);

  return {
    left: `${left}%`,
    width: `${Math.max(right - left, 2)}%`
  };
}
```

```ts
// src/lib/format.ts
export function formatShortTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function formatStatusLabel(value: "active" | "food_ordered" | "called") {
  return value === "food_ordered"
    ? "Food Ordered"
    : value === "called"
      ? "Called"
      : "Active";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test src/lib/timeline.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/timeline.ts src/lib/timeline.test.ts src/lib/format.ts
git commit -m "feat: add timeline ui helpers"
```

### Task 3: Replace Service Rows With A Real Timeline Grid

**Files:**
- Modify: `src/components/ServiceBoard.tsx`
- Delete: `src/components/ServiceBoardRow.tsx`
- Create: `src/components/TimelineAxis.tsx`
- Create: `src/components/TimelineAxis.test.tsx`
- Create: `src/components/TimelineRow.tsx`
- Create: `src/components/TimelineRow.test.tsx`
- Modify: `src/screens/KitchenDisplayScreen.module.css`

- [ ] **Step 1: Write the failing timeline row test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { sampleKitchenDisplayResponse } from "../test/fixtures/kitchenDisplay";
import { TimelineRow } from "./TimelineRow";

describe("TimelineRow", () => {
  it("renders booking bars and a live till overlay on the same row", () => {
    render(
      <TimelineRow
        row={sampleKitchenDisplayResponse.tables[0]!}
        timeline={sampleKitchenDisplayResponse.timeline}
        onSelect={() => {}}
      />
    );

    expect(screen.getByText(/walker/i)).toBeInTheDocument();
    expect(screen.getByText(/food ordered/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/components/TimelineRow.test.tsx`
Expected: FAIL because `TimelineRow` and `TimelineAxis` do not exist.

- [ ] **Step 3: Implement the axis and overlay row components**

```tsx
// src/components/TimelineAxis.tsx
import { buildTimelineSlots } from "../lib/timeline";

type Props = {
  startHour: number;
  endHour: number;
};

export function TimelineAxis({ startHour, endHour }: Props) {
  const slots = buildTimelineSlots(startHour, endHour);

  return (
    <div aria-label="Timeline axis">
      {slots.map((slot) => (
        <span key={slot}>{slot}</span>
      ))}
    </div>
  );
}
```

```tsx
// src/components/TimelineRow.tsx
import { buildSegmentStyle } from "../lib/timeline";
import { formatStatusLabel } from "../lib/format";
import type { KitchenDisplayResponse, ServiceBoardRow } from "../types/kitchenDisplay";

type Props = {
  row: ServiceBoardRow;
  timeline: KitchenDisplayResponse["timeline"];
  onSelect: (displayRef: string) => void;
};

export function TimelineRow({ row, timeline, onSelect }: Props) {
  const serviceDate = timeline.now.slice(0, 10);
  const bounds = {
    startHour: timeline.startHour,
    endHour: timeline.endHour,
    serviceDate
  };

  return (
    <div>
      <strong>{row.tableRef}</strong>
      <div>
        {row.bookings.map((booking) => (
          <button
            key={booking.id}
            type="button"
            style={buildSegmentStyle(booking.startsAt, booking.endsAt, bounds)}
            onClick={() => onSelect(row.displayRef)}
          >
            {booking.label}
          </button>
        ))}
        {row.liveOverlay ? (
          <button
            type="button"
            style={buildSegmentStyle(row.liveOverlay.startsAt, row.liveOverlay.endsAt, bounds)}
            onClick={() => onSelect(row.displayRef)}
          >
            {formatStatusLabel(row.liveOverlay.status)}
          </button>
        ) : null}
      </div>
    </div>
  );
}
```

```tsx
// src/components/ServiceBoard.tsx
import type { KitchenDisplayResponse, ServiceBoardRow } from "../types/kitchenDisplay";
import { TimelineAxis } from "./TimelineAxis";
import { TimelineRow } from "./TimelineRow";

type Props = {
  rows: ServiceBoardRow[];
  timeline: KitchenDisplayResponse["timeline"];
  onSelect: (displayRef: string) => void;
};

export function ServiceBoard({ rows, timeline, onSelect }: Props) {
  return (
    <section>
      <TimelineAxis
        startHour={timeline.startHour}
        endHour={timeline.endHour}
      />
      {rows.map((row) => (
        <TimelineRow
          key={row.displayRef}
          row={row}
          timeline={timeline}
          onSelect={onSelect}
        />
      ))}
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test src/components/TimelineAxis.test.tsx src/components/TimelineRow.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/ServiceBoard.tsx src/components/TimelineAxis.tsx src/components/TimelineAxis.test.tsx src/components/TimelineRow.tsx src/components/TimelineRow.test.tsx src/screens/KitchenDisplayScreen.module.css
git rm src/components/ServiceBoardRow.tsx
git commit -m "feat: render kitchen timeline board"
```

### Task 4: Convert Right-Hand Cards To Print-Category Summaries

**Files:**
- Modify: `src/components/OrderCard.tsx`
- Modify: `src/components/OrderLane.tsx`
- Modify: `src/components/OrderLane.test.tsx`

- [ ] **Step 1: Write the failing order card summary test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { sampleKitchenDisplayResponse } from "../test/fixtures/kitchenDisplay";
import { OrderLane } from "./OrderLane";

describe("OrderLane", () => {
  it("renders category summaries instead of raw dish lines", () => {
    render(
      <OrderLane
        title="In House"
        orders={sampleKitchenDisplayResponse.activeOrders.inHouse}
        onSelect={() => {}}
      />
    );

    expect(screen.getByText(/2 starters/i)).toBeInTheDocument();
    expect(screen.getByText(/3 mains/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/components/OrderLane.test.tsx`
Expected: FAIL because `OrderCard` still renders raw item lines.

- [ ] **Step 3: Implement summary-first order cards**

```tsx
// src/components/OrderCard.tsx
import { formatStatusLabel } from "../lib/format";
import type { ActiveOrderCard as ActiveOrderCardType } from "../types/kitchenDisplay";

type Props = {
  order: ActiveOrderCardType;
  onPress: () => void;
};

export function OrderCard({ order, onPress }: Props) {
  return (
    <button type="button" onClick={onPress} aria-label={`Open order ${order.displayRef}`}>
      <strong>{order.displayRef}</strong>
      <span>{order.bookingName ?? order.partyName ?? "Unnamed order"}</span>
      <span>{formatStatusLabel(order.status)}</span>
      <ul>
        {order.categorySummary.map((summary) => (
          <li key={summary.key}>
            {summary.count} {summary.label.toLowerCase()}
          </li>
        ))}
      </ul>
    </button>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test src/components/OrderLane.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/OrderCard.tsx src/components/OrderLane.tsx src/components/OrderLane.test.tsx
git commit -m "feat: summarize active orders by print category"
```

### Task 5: Upgrade The Detail Drawer To Full Timeline-And-Category Detail

**Files:**
- Modify: `src/components/OrderDetailDrawer.tsx`
- Modify: `src/components/OrderDetailDrawer.test.tsx`

- [ ] **Step 1: Write the failing detail drawer test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { sampleKitchenDisplayResponse } from "../test/fixtures/kitchenDisplay";
import { OrderDetailDrawer } from "./OrderDetailDrawer";

describe("OrderDetailDrawer", () => {
  it("shows status, created time, category summary, and full items", () => {
    render(
      <OrderDetailDrawer
        order={sampleKitchenDisplayResponse.activeOrders.inHouse[0]}
        onClose={() => {}}
      />
    );

    expect(screen.getByText(/food ordered/i)).toBeInTheDocument();
    expect(screen.getByText(/2 starters/i)).toBeInTheDocument();
    expect(screen.getByText(/fish and chips/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/components/OrderDetailDrawer.test.tsx`
Expected: FAIL because the current drawer does not render category summaries or live status.

- [ ] **Step 3: Implement the richer read-only detail panel**

```tsx
// src/components/OrderDetailDrawer.tsx
import { formatShortTime, formatStatusLabel, formatUpdatedAt } from "../lib/format";
import type { ActiveOrderCard } from "../types/kitchenDisplay";

export function OrderDetailDrawer({ order, onClose }: { order: ActiveOrderCard | null; onClose: () => void }) {
  if (order == null) {
    return null;
  }

  return (
    <aside aria-label="Order details">
      <h2>Order Details</h2>
      <p>Reference: {order.displayRef}</p>
      <p>Status: {formatStatusLabel(order.status)}</p>
      <p>Created: {formatShortTime(order.createdAt)}</p>
      <p>Last updated: {formatUpdatedAt(order.updatedAt)}</p>
      <ul>
        {order.categorySummary.map((summary) => (
          <li key={summary.key}>
            {summary.count} {summary.label.toLowerCase()}
          </li>
        ))}
      </ul>
      <ul>
        {order.items.map((item) => (
          <li key={item.billItemId}>
            {item.quantity} x {item.name}
          </li>
        ))}
      </ul>
      <button type="button" onClick={onClose}>
        Close
      </button>
    </aside>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test src/components/OrderDetailDrawer.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/OrderDetailDrawer.tsx src/components/OrderDetailDrawer.test.tsx
git commit -m "feat: expand kitchen order detail drawer"
```

### Task 6: Integrate Timeline Screen Behavior And Degraded States

**Files:**
- Modify: `src/screens/KitchenDisplayScreen.tsx`
- Modify: `src/screens/KitchenDisplayScreen.module.css`
- Modify: `src/screens/KitchenDisplayScreen.test.tsx`
- Modify: `src/components/SystemWarningBanner.tsx`
- Modify: `src/lib/sort.ts`

- [ ] **Step 1: Write the failing integration test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { sampleKitchenDisplayResponse } from "../test/fixtures/kitchenDisplay";
import { KitchenDisplayScreen } from "./KitchenDisplayScreen";

describe("KitchenDisplayScreen", () => {
  it("renders the timeline axis and the category-summary cards together", () => {
    render(
      <KitchenDisplayScreen
        data={sampleKitchenDisplayResponse}
        isLoading={false}
        error={null}
      />
    );

    expect(screen.getByLabelText(/timeline axis/i)).toBeInTheDocument();
    expect(screen.getByText(/2 starters/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/screens/KitchenDisplayScreen.test.tsx`
Expected: FAIL because the screen still wires the older list-style service board API.

- [ ] **Step 3: Integrate the revised screen contract**

```tsx
// src/screens/KitchenDisplayScreen.tsx
<ServiceBoard
  rows={sortServiceBoardRows(data?.tables ?? [])}
  timeline={
    data?.timeline ?? {
      startHour: 12,
      endHour: 22,
      now: new Date().toISOString()
    }
  }
  onSelect={setSelectedDisplayRef}
/>
```

```ts
// src/lib/sort.ts
export function sortServiceBoardRows(rows: ServiceBoardRow[]) {
  return [...rows].sort((left, right) =>
    left.tableRef.localeCompare(right.tableRef, undefined, {
      numeric: true,
      sensitivity: "base"
    })
  );
}
```

- [ ] **Step 4: Run the full test suite**

Run: `yarn test`
Expected: PASS with all timeline, card summary, detail drawer, and degraded-state tests green.

- [ ] **Step 5: Commit**

```bash
git add src/screens/KitchenDisplayScreen.tsx src/screens/KitchenDisplayScreen.module.css src/screens/KitchenDisplayScreen.test.tsx src/components/SystemWarningBanner.tsx src/lib/sort.ts
git commit -m "feat: ship timeline-first kitchen display ui"
```

## Self-Review

- Spec coverage:
  - left-side `12:00-22:00` timeline: covered by Tasks 1-3 and 6
  - till-truth live overlay from `createdAt -> now`: covered by Tasks 1-3
  - status labels and color-ready status contract: covered by Tasks 1, 2, and 3
  - right-side category-summary cards: covered by Task 4
  - detail drawer with full summary and item list: covered by Task 5
  - degraded states and `Needs Review` preservation: covered by Task 6
- Placeholder scan:
  - removed greenfield-only scaffold steps from the old plan
  - every task now points at the existing files in this repo
  - every verification command uses the current `yarn test` workflow
- Type consistency:
  - `createdAt`, `status`, `categorySummary`, `timeline`, and `bookings` are introduced in Task 1 and reused consistently afterward
